import paho.mqtt.client as mqtt
import psycopg2, json, os, requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

BROKER  = 'broker.emqx.io'
PORTA   = 1883
TOPICO  = 'envirosense/medicoes'
API_URL = os.getenv('API_URL', 'http://localhost:3001')

BANCO = {
    'host':     os.getenv('PG_HOST'),
    'port':     int(os.getenv('PG_PORT', 5432)),
    'user':     os.getenv('PG_USER'),
    'password': os.getenv('PG_PASSWORD'),
    'dbname':   os.getenv('PG_DATABASE'),
    'sslmode':  'require'
}

LIMITES = {
    'temperatura': {'max': 38,   'min': 5},
    'umidade':     {'max': 90,   'min': 20},
    'pressao':     {'max': 1030, 'min': 980},
    'chuva':       {'max': 60,   'min': None},
    'vento':       {'max': 90,   'min': None},
}

MENSAGENS = {
    'temperatura': {'max': 'Temperatura MUITO ALTA! 🔥',      'min': 'Temperatura BAIXÍSSIMA! 🥶'},
    'umidade':     {'max': 'Umidade ALTÍSSIMA! 🌬️',          'min': 'Umidade BAIXÍSSIMA!'},
    'pressao':     {'max': 'Pressao atmosferica muito alta!', 'min': 'Pressao atmosferica muito baixa!'},
    'chuva':       {'max': 'Volume de chuva MUITO INTENSO! 🌧️'},
    'vento':       {'max': 'Velocidade do vento ALTA DEMAIS!'},
}

# funções de banco
def sql(sessao, comando, valores=()):
    cursor = sessao.cursor()
    cursor.execute(comando, valores)
    try:    linhas = cursor.fetchall()
    except: linhas = []
    cursor.close()
    return linhas

def buscar_estacao(sessao, uid):
    resultado = sql(sessao,
        'SELECT id, nome, uid FROM estacoes WHERE uid = %s AND ativo = true', (uid,))
    return resultado[0] if resultado else None

def buscar_parametro(sessao, id_estacao, nome_parametro):
    resultado = sql(sessao, '''
        SELECT parametros.id
        FROM parametros
        JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
        WHERE parametros.id_estacao = %s AND tipos_parametro.nome = %s
    ''', (id_estacao, nome_parametro))
    return resultado[0][0] if resultado else None

def salvar_medicao(sessao, id_estacao, id_parametro, valor):
    sql(sessao,
        'INSERT INTO medicoes (id_estacao, id_parametro, valor) VALUES (%s, %s, %s)',
        (id_estacao, id_parametro, valor))

def salvar_historico(sessao, id_estacao, id_parametro, valor):
    sql(sessao,
        'INSERT INTO historico_medicoes (id_estacao, id_parametro, valor) VALUES (%s, %s, %s)',
        (id_estacao, id_parametro, valor))

def limpar_antigas(sessao):
    sql(sessao,
        "DELETE FROM medicoes WHERE registrado_em < NOW() - INTERVAL '5 minutes'")

def buscar_alertas(sessao, id_estacao, id_parametro):
    return sql(sessao,
        'SELECT id, mensagem, severidade FROM alertas WHERE id_estacao=%s AND id_parametro=%s AND ativo=true',
        (id_estacao, id_parametro))

def escalar_critico(sessao, id_alerta, nova_mensagem):
    sql(sessao,
        'UPDATE alertas SET severidade=%s, mensagem=%s, ativo=true WHERE id=%s',
        ('critico', nova_mensagem, id_alerta))

def salvar_log_mongodb(nome_estacao, uid, nome_parametro, valor, mensagem):
    try:
        r = requests.post(
            f'{API_URL}/logs-alertas/interno',
            json={
                'estacao':   nome_estacao,
                'uid':       uid,
                'parametro': nome_parametro,
                'valor':     float(valor),
                'mensagem':  mensagem
            },
            timeout=3
        )
        print(f'  Log salvo no MongoDB: {nome_estacao} | {nome_parametro} = {valor}')
    except Exception as erro:
        print(f'  [AVISO] Nao foi possivel salvar log no MongoDB: {erro}')

def detectar_chave(nome):
    if not nome: return None
    n = nome.lower()
    if 'temperatura' in n: return 'temperatura'
    if 'umidade'     in n: return 'umidade'
    if 'pressao'     in n or 'pressão' in n: return 'pressao'
    if 'chuva'       in n: return 'chuva'
    if 'vento'       in n: return 'vento'
    return None

def verificar_alerta(sessao, id_estacao, id_parametro, nome, valor, nome_estacao, uid):
    alertas = buscar_alertas(sessao, id_estacao, id_parametro)
    chave   = detectar_chave(nome)
    if not chave: return

    limites  = LIMITES[chave]
    mensagens = MENSAGENS.get(chave, {})
    v         = float(valor)

    # verifica se o valor ultrapassa os limites
    e_alta = limites['max'] is not None and v > limites['max']
    e_baixa = limites['min'] is not None and v < limites['min']

    # só continua se o valor for extremo
    if not e_alta and not e_baixa:
        return

    nova = mensagens.get('max') if e_alta else mensagens.get('min')
    if not nova:
        return

    for id_alerta, mensagem, severidade in alertas:
        # salva log no MongoDB sempre que o valor for extremo
        # independente de já estar crítico ou não
        escalar_critico(sessao, id_alerta, nova)
        print(f'  ⚠ Alerta #{id_alerta} → CRITICO: {nova}')
        salvar_log_mongodb(nome_estacao, uid, nome, valor, nova)

def processar(payload_str):
    try:
        dados = json.loads(payload_str)
    except:
        return

    uid   = dados.get('uid')
    nome  = dados.get('nome_parametro', '')
    valor = dados.get('valor')
    if not uid or valor is None: return

    print(f'\n[{datetime.now().strftime("%H:%M:%S")}] {uid} | {nome}: {valor}')

    try:
        sessao = psycopg2.connect(**BANCO)

        estacao = buscar_estacao(sessao, uid)
        if not estacao:
            print(f'  [AVISO] {uid} nao encontrada')
            sessao.close(); return
        id_estacao, nome_estacao, uid_estacao = estacao

        id_parametro = buscar_parametro(sessao, id_estacao, nome)
        valor_real   = round(float(valor), 4)
        print(f'  → {nome_estacao} | {nome}: {valor_real}')

        salvar_medicao(sessao, id_estacao, id_parametro, valor_real)
        salvar_historico(sessao, id_estacao, id_parametro, valor_real)
        limpar_antigas(sessao)
        verificar_alerta(sessao, id_estacao, id_parametro, nome, valor_real, nome_estacao, uid_estacao)

        sessao.commit()
        sessao.close()

    except Exception as erro:
        print(f'[ERRO] {erro}')

def on_connect(cliente_mqtt, userdata, flags, rc):
    cliente_mqtt.subscribe(TOPICO, qos=1)
    print(f'[MQTT] Conectado — escutando {TOPICO}')

def on_disconnect(cliente_mqtt, userdata, rc):
    if rc != 0:
        print(f'[MQTT] Desconectado (rc={rc}) — reconectando...')

def on_message(cliente_mqtt, userdata, msg):
    processar(msg.payload.decode('utf-8'))

print('=' * 50)
print('  EnviroSense — Receptor MQTT')
print(f'  Broker : {BROKER}:{PORTA}')
print(f'  Topico : {TOPICO}')
print('=' * 50)

cliente_mqtt = mqtt.Client(client_id='envirosense-receptor', clean_session=False)
cliente_mqtt.on_connect    = on_connect
cliente_mqtt.on_disconnect = on_disconnect
cliente_mqtt.on_message    = on_message
cliente_mqtt.connect(BROKER, PORTA, keepalive=60)
cliente_mqtt.loop_forever()