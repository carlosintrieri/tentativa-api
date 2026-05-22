// setup.js — cria o banco, tabelas e dados iniciais
// pode rodar mais de uma vez sem perder dados (IF NOT EXISTS + ON CONFLICT)

require('dotenv').config()
const { Pool } = require('pg')
const bcrypt   = require('bcryptjs')

async function run() {

  // conecta no banco padrão para criar o banco enviro se não existir
  const init = new Pool({
    host:     process.env.PG_HOST,
    port:     process.env.PG_PORT,
    user:     process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: 'postgres',
    ssl:      { rejectUnauthorized: false }
  })
  try { await init.query('CREATE DATABASE ' + process.env.PG_DATABASE) } catch {}
  await init.end()

  // conecta no banco correto
  const db = new Pool({
    host:     process.env.PG_HOST,
    port:     process.env.PG_PORT,
    user:     process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl:      { rejectUnauthorized: false }
  })

  // TABELA USUARIOS
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id     SERIAL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL,
    email  VARCHAR(100) UNIQUE NOT NULL,
    senha  VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) DEFAULT 'publico'
  )`)

  // TABELA ESTACOES — com uid para identificar o dispositivo IoT
  await db.query(`CREATE TABLE IF NOT EXISTS estacoes (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL UNIQUE,
    uid         VARCHAR(50)  UNIQUE,
    endereco    VARCHAR(200),
    responsavel VARCHAR(100),
    lat         VARCHAR(20),
    long        VARCHAR(20),
    descricao   TEXT,
    ativo       BOOLEAN DEFAULT true
  )`)

  // adiciona uid se o banco for antigo (sem apagar dados)
  await db.query(`ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS uid VARCHAR(50) UNIQUE`)

  // TABELA TIPOS_PARAMETRO
  await db.query(`CREATE TABLE IF NOT EXISTS tipos_parametro (
    id           SERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL UNIQUE,
    unidade      VARCHAR(20)  NOT NULL,
    fator        DECIMAL(10,4) DEFAULT 1,
    valor_offset DECIMAL(10,4) DEFAULT 0
  )`)

  await db.query(`ALTER TABLE tipos_parametro ADD COLUMN IF NOT EXISTS fator        DECIMAL(10,4) DEFAULT 1`)
  await db.query(`ALTER TABLE tipos_parametro ADD COLUMN IF NOT EXISTS valor_offset DECIMAL(10,4) DEFAULT 0`)

  // TABELA PARAMETROS
  await db.query(`CREATE TABLE IF NOT EXISTS parametros (
    id                SERIAL PRIMARY KEY,
    id_estacao        INTEGER REFERENCES estacoes(id)        ON DELETE CASCADE,
    id_tipo_parametro INTEGER REFERENCES tipos_parametro(id) ON DELETE CASCADE,
    ativo             BOOLEAN DEFAULT true,
    UNIQUE(id_estacao, id_tipo_parametro)
  )`)

  // TABELA ALERTAS
  await db.query(`CREATE TABLE IF NOT EXISTS alertas (
    id           SERIAL PRIMARY KEY,
    id_estacao   INTEGER REFERENCES estacoes(id)   ON DELETE CASCADE,
    id_parametro INTEGER REFERENCES parametros(id) ON DELETE SET NULL,
    severidade   VARCHAR(20) DEFAULT 'aviso',
    mensagem     TEXT        NOT NULL,
    ativo        BOOLEAN     DEFAULT true,
    criado_em    TIMESTAMP   DEFAULT NOW()
  )`)

  // TABELA MEDICOES — armazena leituras recebidas via MQTT
  await db.query(`CREATE TABLE IF NOT EXISTS medicoes (
    id           SERIAL PRIMARY KEY,
    id_estacao   INTEGER REFERENCES estacoes(id)   ON DELETE CASCADE,
    id_parametro INTEGER REFERENCES parametros(id) ON DELETE SET NULL,
    valor        DECIMAL(10,4) NOT NULL,
    registrado_em TIMESTAMP DEFAULT NOW()
  )`)

  // USUÁRIOS PADRÃO
  const senhaAdmin   = await bcrypt.hash('admin123',   10)
  const senhaPublico = await bcrypt.hash('publico123', 10)
  await db.query(`INSERT INTO usuarios (nome, email, senha, perfil) VALUES
    ('Administrador',   'admin@enviro.com',   $1, 'admin'),
    ('Usuario Publico', 'publico@enviro.com', $2, 'publico')
    ON CONFLICT (email) DO NOTHING`, [senhaAdmin, senhaPublico])

  // TIPOS PADRÃO
  await db.query(`INSERT INTO tipos_parametro (nome, unidade, fator, valor_offset) VALUES
    ('Temperatura', 'C',    1, 0),
    ('Umidade',     '%',    1, 0),
    ('Pressao',     'hPa',  1, 0),
    ('Chuva',       'mm',   1, 0),
    ('Vento',       'km/h', 1, 0)
    ON CONFLICT (nome) DO NOTHING`)

  // 3 ESTAÇÕES PADRÃO COM UID — para os simuladores Python
  await db.query(`INSERT INTO estacoes (nome, uid, endereco, responsavel, descricao) VALUES
    ('Estação Centro',   'EST001', 'Praça da Sé, São Paulo',        'Carlos Admin', 'Estação simulada pelo dispositivo EST001'),
    ('Estação Norte',    'EST002', 'Av. Zaki Narchi, São Paulo',    'Carlos Admin', 'Estação simulada pelo dispositivo EST002'),
    ('Estação Sul',      'EST003', 'Av. Cupecê, São Paulo',         'Carlos Admin', 'Estação simulada pelo dispositivo EST003')
    ON CONFLICT (nome) DO NOTHING`)

  // VINCULA TEMPERATURA E UMIDADE EM CADA ESTAÇÃO
  await db.query(`
    INSERT INTO parametros (id_estacao, id_tipo_parametro)
    SELECT e.id, t.id
    FROM estacoes e, tipos_parametro t
    WHERE e.uid IN ('EST001','EST002','EST003')
      AND t.nome IN ('Temperatura','Umidade')
    ON CONFLICT (id_estacao, id_tipo_parametro) DO NOTHING
  `)

  await db.end()
  console.log('Setup concluído!')
  console.log('admin@enviro.com / admin123')
  console.log('publico@enviro.com / publico123')
  console.log('Estações criadas: EST001, EST002, EST003')
  process.exit(0)
}

run().catch(function(erro) { console.log('erro:', erro.message); process.exit(1) })
