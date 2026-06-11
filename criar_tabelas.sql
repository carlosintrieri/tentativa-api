CREATE TABLE estacoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  uid VARCHAR(50),
  endereco VARCHAR(255),
  responsavel VARCHAR(100),
  lat VARCHAR(20),
  long VARCHAR(20),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE tipos_parametro (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  fator FLOAT DEFAULT 1,
  valor_offset FLOAT DEFAULT 0
);

CREATE TABLE parametros (
  id SERIAL PRIMARY KEY,
  id_estacao INTEGER REFERENCES estacoes(id),
  id_tipo_parametro INTEGER REFERENCES tipos_parametro(id),
  nome_tipo VARCHAR(100)
);

CREATE TABLE medicoes (
  id SERIAL PRIMARY KEY,
  id_estacao INTEGER REFERENCES estacoes(id),
  id_parametro INTEGER REFERENCES parametros(id),
  valor FLOAT,
  uid_estacao VARCHAR(50),
  nome_parametro VARCHAR(100),
  valor_bruto FLOAT,
  timestamp_mqtt TIMESTAMP,
  registrado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO estacoes (nome, uid, endereco, responsavel, lat, long, descricao, ativo) 
VALUES ('Estação Centro', 'EST001', 'Rua XV', 'João', '-23.55', '-46.63', 'Teste', true);

INSERT INTO tipos_parametro (nome, fator, valor_offset) VALUES ('Temperatura', 1, 0);

INSERT INTO parametros (id_estacao, id_tipo_parametro) VALUES (1, 1);