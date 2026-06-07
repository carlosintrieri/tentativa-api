# test_receptor.py — testes unitários do receptor MQTT
# testa apenas as funções puras: detectar_chave e os limites
# não depende de banco, broker ou API

import pytest
import sys
import os

# aponta para a pasta mqtt onde está o receptor.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'mqtt'))

from receptor import detectar_chave, LIMITES, MENSAGENS

#  detectar_chave 

def test_detecta_temperatura():
    assert detectar_chave('Temperatura') == 'temperatura'

def test_detecta_temperatura_com_apelido():
    # nome customizado ainda detecta como temperatura
    assert detectar_chave('Temperatura Infernal') == 'temperatura'

def test_detecta_umidade():
    assert detectar_chave('Umidade') == 'umidade'

def test_detecta_chuva():
    assert detectar_chave('Chuva Intensa') == 'chuva'

def test_detecta_vento():
    assert detectar_chave('Vento Fortíssimo') == 'vento'

def test_nome_desconhecido_retorna_none():
    assert detectar_chave('Radiação Solar') is None

def test_nome_vazio_retorna_none():
    assert detectar_chave('') is None

def test_none_retorna_none():
    assert detectar_chave(None) is None

#  limites ─

def test_temperatura_acima_do_limite():
    assert 45.0 > LIMITES['temperatura']['max']

def test_temperatura_abaixo_do_limite():
    assert -10.0 < LIMITES['temperatura']['min']

def test_chuva_nao_tem_limite_minimo():
    assert LIMITES['chuva']['min'] is None

def test_vento_nao_tem_limite_minimo():
    assert LIMITES['vento']['min'] is None

def test_umidade_tem_limite_maximo_e_minimo():
    assert LIMITES['umidade']['max'] is not None
    assert LIMITES['umidade']['min'] is not None

#  mensagens ─

def test_temperatura_tem_mensagem_de_calor():
    assert 'ALTA' in MENSAGENS['temperatura']['max']

def test_temperatura_tem_mensagem_de_frio():
    assert 'BAIXÍSSIMA' in MENSAGENS['temperatura']['min']

def test_chuva_tem_mensagem_de_intensidade():
    assert 'INTENSO' in MENSAGENS['chuva']['max']

def test_vento_tem_mensagem():
    assert MENSAGENS['vento']['max'] is not None