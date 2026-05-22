# EnviroSense — Simuladores MQTT e Receptor


## O que é isso?

Este módulo simula dispositivos IoT (sensores meteorológicos) enviando dados de temperatura e umidade via protocolo MQTT para o banco de dados do EnviroSense.

## Fluxo completo

```
simulador_est001.py  ┐
simulador_est002.py  ├──► Broker MQTT ──► receptor.py ──► PostgreSQL Azure ──► Plataforma Web
simulador_est003.py  ┘    (mosquitto)                      (tabela medicoes)     (aba Medições)
```

## Pré-requisitos

- Python 3.8 ou superior
- Pip instalado

## Instalação das dependências

```bash
pip install paho-mqtt psycopg2-binary python-dotenv
```

## Como rodar

### 1. Rodar o receptor (deixe aberto em um terminal)

```bash
cd mqtt
python receptor.py
```

O receptor vai:
- Conectar ao broker MQTT público `test.mosquitto.org`
- Escutar o tópico `envirosense/medicoes`
- Identificar a estação pelo `uid`
- Salvar temperatura e umidade na tabela `medicoes`
- Verificar e disparar alertas automaticamente

### 2. Rodar os simuladores (cada um em um terminal separado)

```bash
python simulador_est001.py   # Estação Centro
python simulador_est002.py   # Estação Norte
python simulador_est003.py   # Estação Sul
```

Cada simulador envia temperatura e umidade a cada **10 segundos**.
Para mudar o intervalo, edite a linha `INTERVALO = 10` em cada arquivo.

## Estações cadastradas

| UID    | Nome              | Endereço                    |
|--------|-------------------|-----------------------------|
| EST001 | Estação Centro    | Praça da Sé, São Paulo      |
| EST002 | Estação Norte     | Av. Zaki Narchi, São Paulo  |
| EST003 | Estação Sul       | Av. Cupecê, São Paulo       |

## Alertas automáticos

O receptor verifica automaticamente alertas ativos no banco. Os critérios são:

| Parâmetro   | Condição                        | Dispara alerta |
|-------------|----------------------------------|----------------|
| Temperatura | > 35°C e alerta com "alta/crítico" | Sim         |
| Temperatura | < 10°C e alerta com "baixa"      | Sim            |
| Umidade     | < 30% e alerta com "baixa"       | Sim            |
| Umidade     | > 90% e alerta com "alta/crítico" | Sim           |

Para ativar um alerta, cadastre-o na plataforma web (aba Alertas) com a severidade e mensagem desejadas.

## Verificando os dados

Após rodar o receptor e os simuladores, acesse a plataforma web e vá na aba **Medições** — os dados aparecerão automaticamente a cada 10 segundos.
