# receptor.py — Recebe dados MQTT e salva no banco PostgreSQL Azure
#

# O que faz:
# 1. Escuta o tópico envirosense/medicoes no broker MQTT
# 2. Recebe o JSON com uid, temperatura e umidade
# 3. Busca no banco qual estação tem aquele uid
# 4. Busca os parâmetros Temperatura e Umidade daquela estação
# 5. Aplica fator e offset no valor bruto
# 6. Salva na tabela medicoes
# 7. Verifica alertas ativos da estação e registra se necessário
#
# Pré-requisitos:
#   pip install paho-mqtt psycopg2-binary python-dotenv

import paho.mqtt.client as mqtt
import psycopg2
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# carrega variáveis do .env do backend
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

TOPICO  = 'envirosense/medicoes'
BROKER  = 'test.mosquitto.org'
PORTA   = 1883

# configuração do banco PostgreSQL Azure
DB_CONFIG = {
    'host':     os.getenv('PG_HOST'),
    'port':     int(os.getenv('PG_PORT', 5432)),
    'user':     os.getenv('PG_USER'),
    'password': os.getenv('PG_PASSWORD'),
    'dbname':   os.getenv('PG_DATABASE'),
    'sslmode':  'require'
}

# CÁLCULO — aplica fator e offset no valor bruto
# valorReal = valorBruto * fator + offset
def calcular_valor(valor_bruto, fator, offset):
    fator  = float(fator  or 1)
    offset = float(offset or 0)
    if fator == 0:
        raise ValueError('fator não pode ser zero')
    resultado = float(valor_bruto) * fator + offset
    return round(resultado, 4)

# PROCESSAR MENSAGEM — função principal chamada a cada mensagem recebida
def processar(payload_str):
    try:
        dados = json.loads(payload_str)
    except Exception:
        print('[ERRO] JSON inválido:', payload_str)
        return

    uid = dados.get('uid')
    tem = dados.get('tem')  # temperatura
    umi = dados.get('umi')  # umidade

    if not uid:
        print('[AVISO] Mensagem sem uid ignorada')
        return

    print(f'\n[{datetime.now().strftime("%H:%M:%S")}] Recebido de {uid}: tem={tem} umi={umi}')

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()

        # 1. busca a estação pelo uid
        cur.execute('SELECT id, nome FROM estacoes WHERE uid = %s AND ativo = true', (uid,))
        estacao = cur.fetchone()
        if not estacao:
            print(f'[AVISO] Estação com uid={uid} não encontrada ou inativa')
            cur.close(); conn.close()
            return

        id_estacao, nome_estacao = estacao
        print(f'  → Estação: {nome_estacao} (id={id_estacao})')

        # 2. busca os parâmetros Temperatura e Umidade desta estação
        cur.execute('''
            SELECT parametros.id, tipos_parametro.nome, tipos_parametro.fator, tipos_parametro.valor_offset
            FROM parametros
            JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
            WHERE parametros.id_estacao = %s
              AND tipos_parametro.nome IN ('Temperatura', 'Umidade')
              AND parametros.ativo = true
        ''', (id_estacao,))
        parametros = cur.fetchall()

        # mapa: nome_parametro -> (id_parametro, fator, offset)
        mapa = { row[1]: (row[0], row[2], row[3]) for row in parametros }

        # 3. salva cada leitura na tabela medicoes aplicando fator e offset
        leituras = { 'Temperatura': tem, 'Umidade': umi }
        for nome_param, valor_bruto in leituras.items():
            if valor_bruto is None or nome_param not in mapa:
                continue
            id_param, fator, offset = mapa[nome_param]
            valor_real = calcular_valor(valor_bruto, fator, offset)
            cur.execute(
                'INSERT INTO medicoes (id_estacao, id_parametro, valor) VALUES (%s, %s, %s)',
                (id_estacao, id_param, valor_real)
            )
            print(f'  → Medição salva: {nome_param} = {valor_real}')

            # 4. verifica alertas ativos para esta estação e parâmetro
            cur.execute('''
                SELECT id, severidade, mensagem
                FROM alertas
                WHERE id_estacao = %s
                  AND (id_parametro = %s OR id_parametro IS NULL)
                  AND ativo = true
            ''', (id_estacao, id_param))
            alertas = cur.fetchall()

            for alerta in alertas:
                id_alerta, severidade, mensagem = alerta
                # verifica se o valor ultrapassa limites mencionados na mensagem
                # lógica simples: alerta com "alta" e temperatura > 35 dispara
                # alerta com "baixa" e umidade < 30 dispara
                disparar = False
                msg_lower = mensagem.lower()

                if nome_param == 'Temperatura':
                    if ('alta' in msg_lower or 'critica' in msg_lower or 'critico' in msg_lower) and valor_real > 35:
                        disparar = True
                    elif ('baixa' in msg_lower) and valor_real < 10:
                        disparar = True
                elif nome_param == 'Umidade':
                    if ('baixa' in msg_lower) and valor_real < 30:
                        disparar = True
                    elif ('alta' in msg_lower or 'critica' in msg_lower) and valor_real > 90:
                        disparar = True

                if disparar:
                    cur.execute('''
                        INSERT INTO alertas (id_estacao, id_parametro, severidade, mensagem)
                        VALUES (%s, %s, %s, %s)
                    ''', (
                        id_estacao,
                        id_param,
                        severidade,
                        f'[MQTT] {nome_param} = {valor_real} — {mensagem}'
                    ))
                    print(f'  ⚠ Alerta disparado: [{severidade}] {nome_param} = {valor_real}')

        conn.commit()
        cur.close()
        conn.close()

    except Exception as erro:
        print(f'[ERRO] Banco de dados: {erro}')

# CALLBACKS MQTT
def on_connect(con, userdata, flags, rc):
    print(f'[MQTT] Conectado ao broker (rc={rc})')
    con.subscribe(TOPICO)
    print(f'[MQTT] Escutando tópico: {TOPICO}')

def on_message(con, userdata, msg):
    processar(msg.payload.decode('utf-8'))

# INÍCIO
print('=' * 50)
print('  EnviroSense — Receptor MQTT')
print(f'  Broker : {BROKER}:{PORTA}')
print(f'  Tópico : {TOPICO}')
print(f'  Banco  : {DB_CONFIG["host"]}')
print('=' * 50)

con = mqtt.Client()
con.on_connect = on_connect
con.on_message = on_message
con.connect(BROKER, PORTA, 60)
con.loop_forever()
