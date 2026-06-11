import paho.mqtt.client as mqtt
import json
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Conecta no MongoDB Atlas e acessa a coleção temporária
colecao = MongoClient('mongodb+srv://envirosense:Carlos1313*@cluster0.jfw9kcd.mongodb.net/envirosense?retryWrites=true&w=majority')['envirosense']['medicoes_temporarias']

# Função que roda TODA VEZ que chega uma mensagem MQTT
def on_message(client, userdata, msg):
  dados = json.loads(msg.payload.decode())
  
  # Insere um novo documento no MongoDB com os dados recebidos 
  resultado = colecao.insert_one({
    'uid_estacao': dados['uid'],
    'nome_parametro': dados['nome_parametro'],
    'valor_bruto': float(dados['valor']),
    'timestamp': datetime.now(),
    'processado': False
  })
  
  print(f"Salvo no MongoDB (ID: {resultado.inserted_id})")

# Cria um cliente MQTT
cliente = mqtt.Client()
cliente.on_message = on_message
cliente.connect('broker.emqx.io', 1883)
cliente.subscribe('envirosense/medicoes')
cliente.loop_forever()