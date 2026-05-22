# simulador_est003.py — Simula a Estação Sul (EST003)
# Publica temperatura e umidade via MQTT a cada 10 segundos

import paho.mqtt.client as mqtt
import time
import json
import random

UID     = 'EST003'
TOPICO  = 'envirosense/medicoes'
BROKER  = 'test.mosquitto.org'
PORTA   = 1883
INTERVALO = 10  # segundos entre cada envio — mude aqui se quiser mais rápido ou lento

con = mqtt.Client()
con.connect(BROKER, PORTA, 60)
con.loop_start()

print(f'[EST003] Simulador iniciado — enviando a cada {INTERVALO}s para {BROKER}/{TOPICO}')

while True:
    payload = {
        'uid': UID,
        'uxt': int(time.time()),
        'tem': round(random.uniform(20.0, 45.0), 2),
        'umi': round(random.uniform(25.0, 90.0), 2),
    }
    msg = json.dumps(payload)
    con.publish(TOPICO, msg)
    print(f'[EST003] Enviado: {msg}')
    time.sleep(INTERVALO)
