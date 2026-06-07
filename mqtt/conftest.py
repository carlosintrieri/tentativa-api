# conftest.py — configuração do pytest para encontrar o receptor.py
# adiciona a pasta mqtt ao path para que o import funcione

import sys
import os

# aponta para a pasta mqtt onde está o receptor.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))