import paho.mqtt.client as mqtt
import time
import json
import random
import requests
import os
from datetime import datetime

BROKER    = 'broker.emqx.io'
PORTA     = 1883
TOPICO    = 'envirosense/medicoes'
INTERVALO = 10

API_URL = os.getenv('API_URL', 'http://localhost:3001')
EMAIL   = os.getenv('API_EMAIL', 'admin@enviro.com')
SENHA   = os.getenv('API_SENHA', 'admin123')


# faz login na API e retorna o token de acesso
def obter_token():
    try:
        r = requests.post(
            f'{API_URL}/auth/login',
            json={
                'email': EMAIL,
                'senha': SENHA
            },
            timeout=10
        )

        dados = r.json()

        if 'token' in dados:
            print(f'[API] Login ok — usuario: {dados["usuario"]["nome"]}')
            return dados['token']

        print(f'[API] Erro no login: {dados}')
        return None

    except Exception as e:
        print(f'[API] Falha ao conectar na API: {e}')
        return None


# busca todas as estacoes e parametros cadastrados no banco via API
def buscar_estacoes(token):
    headers = {
        'Authorization': f'Bearer {token}'
    }

    try:
        estacoes = requests.get(
            f'{API_URL}/estacoes',
            headers=headers,
            timeout=10
        ).json()

        parametros = requests.get(
            f'{API_URL}/parametros',
            headers=headers,
            timeout=10
        ).json()

        return estacoes, parametros

    except Exception as e:
        print(f'[API] Erro ao buscar dados: {e}')
        return [], []


# gera valores aleatorios realistas com ocasionais extremos
def gerar_valor(nome_tipo):
    nome = nome_tipo.lower()

    # 15% de chance de evento extremo
    extremo = random.random() < 0.15

    if 'temperatura' in nome:

        if extremo:
            return round(random.choice([
                random.uniform(-15.0, -5.0),   # frio extremo
                random.uniform(45.0, 55.0)     # calor extremo
            ]), 2)

        return round(random.uniform(18.0, 35.0), 2)

    elif 'umidade' in nome:

        if extremo:
            return round(random.choice([
                random.uniform(0.0, 10.0),     # seco extremo
                random.uniform(98.0, 100.0)    # saturado
            ]), 2)

        return round(random.uniform(40.0, 80.0), 2)

    elif 'pressao' in nome:

        if extremo:
            return round(random.choice([
                random.uniform(850.0, 920.0),    # ciclone
                random.uniform(1045.0, 1080.0)  # alta extrema
            ]), 2)

        return round(random.uniform(980.0, 1030.0), 2)

    elif 'chuva' in nome:

        if extremo:
            return round(random.uniform(120.0, 300.0), 2)

        return round(random.uniform(0.0, 40.0), 2)

    elif 'vento' in nome:

        if extremo:
            return round(random.uniform(100.0, 180.0), 2)

        return round(random.uniform(5.0, 40.0), 2)

    else:

        if extremo:
            return round(random.uniform(-999.0, 999.0), 2)

        return round(random.uniform(0.0, 100.0), 2)


# publica os dados via MQTT
def publicar(cliente, estacao, parametro, valor):

    payload = {
        'uid': estacao['uid'],
        'nome_estacao': estacao['nome'],
        'nome_parametro': parametro['nome_tipo'],
        'id_parametro': parametro['id'],
        'valor': valor,
        'timestamp': datetime.now().isoformat()
    }

    cliente.publish(TOPICO, json.dumps(payload))

    print(
        f'[MQTT] {estacao["nome"]} | '
        f'{parametro["nome_tipo"]}: {valor}'
    )


print('=' * 50)
print('  EnviroSense — Simulador')
print(f'  Broker   : {BROKER}:{PORTA}')
print(f'  API      : {API_URL}')
print(f'  Intervalo: {INTERVALO}s')
print('=' * 50)


# autentica na API
token = obter_token()

if not token:
    print('[ERRO] Nao foi possivel autenticar.')
    print('[ERRO] Verifique se o backend esta rodando.')
    exit(1)


# conecta MQTT
con = mqtt.Client()

con.connect(BROKER, PORTA, 60)

con.loop_start()

print('[MQTT] Conectado ao broker')


ciclo = 0

while True:

    ciclo += 1

    print(f'\n[Ciclo {ciclo}] {datetime.now().strftime("%H:%M:%S")}')

    # busca dados atualizados
    estacoes, parametros = buscar_estacoes(token)

    print('[DEBUG] Tipo estacoes:', type(estacoes))
    print('[DEBUG] Tipo parametros:', type(parametros))

    # garante que veio lista
    if not isinstance(estacoes, list):
        print('[ERRO] API retornou estacoes invalidas:')
        print(estacoes)
        time.sleep(INTERVALO)
        continue

    if not isinstance(parametros, list):
        print('[ERRO] API retornou parametros invalidos:')
        print(parametros)
        time.sleep(INTERVALO)
        continue

    # filtra somente estacoes ativas com UID
    ativas = [
        e for e in estacoes
        if isinstance(e, dict)
        and e.get('ativo')
        and e.get('uid')
    ]

    print(f'[API] {len(ativas)} estacoes ativas com UID encontradas')

    # percorre estações
    for estacao in ativas:

        params_estacao = [
            p for p in parametros
            if isinstance(p, dict)
            and str(p.get('id_estacao')) == str(estacao.get('id'))
        ]

        if not params_estacao:
            print(f'[AVISO] {estacao["nome"]} sem parametros')
            continue

        for param in params_estacao:

            valor = gerar_valor(
                param.get('nome_tipo', '')
            )

            publicar(
                con,
                estacao,
                param,
                valor
            )

    print(f'[INFO] Proxima alimentacao em {INTERVALO}s')

    time.sleep(INTERVALO)