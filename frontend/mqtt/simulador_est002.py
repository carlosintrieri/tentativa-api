# simulador_est002.py — Simula a Estação Norte (EST002)
# Publica temperatura e umidade via MQTT a cada 10 segundos

import paho.mqtt.client as mqtt
import time
import json
import random

UID     = 'EST002'
TOPICO  = 'envirosense/medicoes'
BROKER  = 'test.mosquitto.org'
PORTA   = 1883
INTERVALO = 10  # segundos entre cada envio — mude aqui se quiser mais rápido ou lento

con = mqtt.Client()
con.connect(BROKER, PORTA, 60)
con.loop_start()

print(f'[EST002] Simulador iniciado — enviando a cada {INTERVALO}s para {BROKER}/{TOPICO}')

while True:
    payload = {
        'uid': UID,
        'uxt': int(time.time()),
        'tem': round(random.uniform(15.0, 38.0), 2),
        'umi': round(random.uniform(40.0, 98.0), 2),
    }
    msg = json.dumps(payload)
    con.publish(TOPICO, msg)
    print(f'[EST002] Enviado: {msg}')
    time.sleep(INTERVALO)
