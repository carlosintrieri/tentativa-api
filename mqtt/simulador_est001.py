# simulador_est001.py — Simula a Estação Centro (EST001)
# Publica temperatura e umidade via MQTT a cada 10 segundos

import paho.mqtt.client as mqtt
import time
import json
import random

# identificador único desta estação — deve bater com o uid cadastrado no banco
UID     = 'EST001'
TOPICO  = 'envirosense/medicoes'
BROKER  = 'test.mosquitto.org'
PORTA   = 1883
INTERVALO = 10  # segundos entre cada envio — mude aqui se quiser mais rápido ou lento

con = mqtt.Client()
con.connect(BROKER, PORTA, 60)
con.loop_start()

print(f'[EST001] Simulador iniciado — enviando a cada {INTERVALO}s para {BROKER}/{TOPICO}')

while True:
    payload = {
        'uid': UID,
        'uxt': int(time.time()),
        'tem': round(random.uniform(18.0, 42.0), 2),  # temperatura em graus C
        'umi': round(random.uniform(30.0, 95.0), 2),  # umidade em %
    }
    msg = json.dumps(payload)
    con.publish(TOPICO, msg)
    print(f'[EST001] Enviado: {msg}')
    time.sleep(INTERVALO)
