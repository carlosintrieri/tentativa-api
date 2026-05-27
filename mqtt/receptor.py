# receptor.py — recebe mensagens MQTT e salva no banco
# tudo em um arquivo so: conexao, queries SQL, logica de alertas e MQTT

import paho.mqtt.client as mqtt
import psycopg2, json, os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

BROKER = 'broker.emqx.io'
PORTA  = 1883
TOPICO = 'envirosense/medicoes'

# configuracao do banco lida do .env
BANCO = {
    'host':     os.getenv('PG_HOST'),
    'port':     int(os.getenv('PG_PORT', 5432)),
    'user':     os.getenv('PG_USER'),
    'password': os.getenv('PG_PASSWORD'),
    'dbname':   os.getenv('PG_DATABASE'),
    'sslmode':  'require'
}

# palavras que indicam situacao de valor alto
PALAVRAS_ALTA  = ['alta', 'quente', 'calor', 'ventania', 'rajada',
                  'chuvoso', 'tempestade', 'umido', 'úmido', 'enchente']

# palavras que indicam situacao de valor baixo
PALAVRAS_BAIXA = ['baixa', 'frio', 'gelado', 'seco', 'seca']

# limites numericos por tipo de parametro
LIMITES = {
    'temperatura': {'max': 38,   'min': 5},
    'umidade':     {'max': 90,   'min': 20},
    'pressao':     {'max': 1030, 'min': 980},
    'chuva':       {'max': 60,   'min': None},
    'vento':       {'max': 90,   'min': None},
}

# mensagens pre-fabricadas ao escalar para critico
MENSAGENS = {
    'temperatura': {'max': 'Temperatura MUITO ALTA! 🔥',      'min': 'Temperatura BAIXÍSSIMA! 🥶'},
    'umidade':     {'max': 'Umidade ALTÍSSIMA! 🌬️',          'min': 'Umidade BAIXÍSSIMA!'},
    'pressao':     {'max': 'Pressao atmosferica muito alta!', 'min': 'Pressao atmosferica muito baixa!'},
    'chuva':       {'max': 'Volume de chuva MUITO INTENSO! 🌧️'},
    'vento':       {'max': 'Velocidade do vento ALTA DEMAIS!'},
}

# ── funções de banco ──────────────────────────────────────────────────────────

# roda qualquer comando SQL e devolve as linhas encontradas
def sql(sessao, comando, valores=()):
    cursor = sessao.cursor()
    cursor.execute(comando, valores)
    try:    linhas = cursor.fetchall()
    except: linhas = []
    cursor.close()
    return linhas

# busca estacao pelo uid — devolve (id, nome) ou None
def buscar_estacao(sessao, uid):
    resultado = sql(sessao,
        'SELECT id, nome FROM estacoes WHERE uid = %s AND ativo = true', (uid,))
    return resultado[0] if resultado else None

# busca id do parametro pelo nome dentro de uma estacao
def buscar_parametro(sessao, id_estacao, nome_parametro):
    resultado = sql(sessao, '''
        SELECT parametros.id
        FROM parametros
        JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
        WHERE parametros.id_estacao = %s AND tipos_parametro.nome = %s
    ''', (id_estacao, nome_parametro))
    return resultado[0][0] if resultado else None

# salva medicao na tabela temporaria — apagada a cada 5 minutos pelo frontend
def salvar_medicao(sessao, id_estacao, id_parametro, valor):
    sql(sessao,
        'INSERT INTO medicoes (id_estacao, id_parametro, valor) VALUES (%s, %s, %s)',
        (id_estacao, id_parametro, valor))

# salva medicao no historico permanente — nunca apagado, visivel no pgAdmin
def salvar_historico(sessao, id_estacao, id_parametro, valor):
    sql(sessao,
        'INSERT INTO historico_medicoes (id_estacao, id_parametro, valor) VALUES (%s, %s, %s)',
        (id_estacao, id_parametro, valor))

# apaga medicoes com mais de 5 minutos da tabela temporaria
def limpar_antigas(sessao):
    sql(sessao,
        "DELETE FROM medicoes WHERE registrado_em < NOW() - INTERVAL '5 minutes'")

# busca alertas para esta estacao e parametro
def buscar_alertas(sessao, id_estacao, id_parametro):
    return sql(sessao,
        'SELECT id, mensagem FROM alertas WHERE id_estacao=%s AND id_parametro=%s',
        (id_estacao, id_parametro))

# atualiza alerta para critico com nova mensagem
def escalar_critico(sessao, id_alerta, nova_mensagem):
    sql(sessao,
        'UPDATE alertas SET severidade=%s, mensagem=%s, ativo=true WHERE id=%s',
        ('critico', nova_mensagem, id_alerta))

# ── logica de alertas ─────────────────────────────────────────────────────────

# identifica o tipo do parametro pelo nome
def detectar_chave(nome):
    if not nome: return None
    n = nome.lower()
    if 'temperatura' in n: return 'temperatura'
    if 'umidade'     in n: return 'umidade'
    if 'pressao'     in n or 'pressão' in n: return 'pressao'
    if 'chuva'       in n: return 'chuva'
    if 'vento'       in n: return 'vento'
    return None

# verifica se algum alerta deve virar critico
def verificar_alerta(sessao, id_estacao, id_parametro, nome, valor):
    alertas  = buscar_alertas(sessao, id_estacao, id_parametro)
    chave    = detectar_chave(nome)
    if not chave: return

    limites  = LIMITES[chave]
    mensagens = MENSAGENS.get(chave, {})
    v         = float(valor)

    for id_alerta, mensagem in alertas:
        msg  = (mensagem or '').lower()
        nova = None

        # palavras de situacao alta + valor acima do maximo
        if any(p in msg for p in PALAVRAS_ALTA) and limites['max'] and v > limites['max']:
            nova = mensagens.get('max')

        # palavras de situacao baixa + valor abaixo do minimo
        if any(p in msg for p in PALAVRAS_BAIXA) and limites['min'] and v < limites['min']:
            nova = mensagens.get('min')

        if nova:
            escalar_critico(sessao, id_alerta, nova)
            print(f'  ⚠ Alerta #{id_alerta} → CRITICO: {nova}')

# ── processamento principal ───────────────────────────────────────────────────

# chamada a cada mensagem recebida do broker
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

        # 1. descobre qual estacao enviou
        estacao = buscar_estacao(sessao, uid)
        if not estacao:
            print(f'  [AVISO] {uid} nao encontrada')
            sessao.close(); return
        id_estacao, nome_estacao = estacao

        # 2. descobre qual parametro foi medido
        id_parametro = buscar_parametro(sessao, id_estacao, nome)

        # 3. valor salvo direto — SEM multiplicar fator para nao distorcer
        valor_real = round(float(valor), 4)
        print(f'  → {nome_estacao} | {nome}: {valor_real}')

        # 4. salva na tabela temporaria (frontend busca daqui)
        salvar_medicao(sessao, id_estacao, id_parametro, valor_real)

        # 5. salva no historico permanente (visivel no pgAdmin)
        salvar_historico(sessao, id_estacao, id_parametro, valor_real)

        # 6. apaga medicoes antigas da tabela temporaria
        limpar_antigas(sessao)

        # 7. verifica se algum alerta deve virar critico
        verificar_alerta(sessao, id_estacao, id_parametro, nome, valor_real)

        sessao.commit()
        sessao.close()

    except Exception as erro:
        print(f'[ERRO] {erro}')

# ── callbacks MQTT ────────────────────────────────────────────────────────────

def on_connect(cliente_mqtt, userdata, flags, rc):
    cliente_mqtt.subscribe(TOPICO, qos=1)
    print(f'[MQTT] Conectado — escutando {TOPICO}')

def on_disconnect(cliente_mqtt, userdata, rc):
    if rc != 0:
        print(f'[MQTT] Desconectado (rc={rc}) — reconectando...')

def on_message(cliente_mqtt, userdata, msg):
    processar(msg.payload.decode('utf-8'))

# ── inicio ────────────────────────────────────────────────────────────────────

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