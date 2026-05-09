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
    database: 'postgres'
  })
  try { await init.query('CREATE DATABASE ' + process.env.PG_DATABASE) } catch {}
  await init.end()

  // conecta no banco correto
  const db = new Pool({
    host:     process.env.PG_HOST,
    port:     process.env.PG_PORT,
    user:     process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  })

  // TABELA USUARIOS
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id     SERIAL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL,
    email  VARCHAR(100) UNIQUE NOT NULL,
    senha  VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) DEFAULT 'publico'
  )`)

  // TABELA ESTACOES
  await db.query(`CREATE TABLE IF NOT EXISTS estacoes (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL UNIQUE,
    endereco    VARCHAR(200),
    responsavel VARCHAR(100),
    lat         VARCHAR(20),
    long        VARCHAR(20),
    descricao   TEXT,
    ativo       BOOLEAN DEFAULT true
  )`)

  // TABELA TIPOS_PARAMETRO — com fator e valor_offset
  await db.query(`CREATE TABLE IF NOT EXISTS tipos_parametro (
    id           SERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL UNIQUE,
    unidade      VARCHAR(20)  NOT NULL,
    fator        DECIMAL(10,4) DEFAULT 1,
    valor_offset DECIMAL(10,4) DEFAULT 0
  )`)

  // adiciona colunas fator e valor_offset se o banco for antigo (sem apagar dados)
  await db.query(`ALTER TABLE tipos_parametro ADD COLUMN IF NOT EXISTS fator        DECIMAL(10,4) DEFAULT 1`)
  await db.query(`ALTER TABLE tipos_parametro ADD COLUMN IF NOT EXISTS valor_offset DECIMAL(10,4) DEFAULT 0`)

  // TABELA PARAMETROS — junção de Estação + Tipo
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

  // USUÁRIOS PADRÃO
  const senhaAdmin   = await bcrypt.hash('admin123',   10)
  const senhaPublico = await bcrypt.hash('publico123', 10)
  await db.query(`INSERT INTO usuarios (nome, email, senha, perfil) VALUES
    ('Administrador',   'admin@enviro.com',   $1, 'admin'),
    ('Usuario Publico', 'publico@enviro.com', $2, 'publico')
    ON CONFLICT (email) DO NOTHING`, [senhaAdmin, senhaPublico])

  // TIPOS PADRÃO — os 5 tipos meteorológicos
  await db.query(`INSERT INTO tipos_parametro (nome, unidade, fator, valor_offset) VALUES
    ('Temperatura', 'C',    1, 0),
    ('Umidade',     '%',    1, 0),
    ('Pressao',     'hPa',  1, 0),
    ('Chuva',       'mm',   1, 0),
    ('Vento',       'km/h', 1, 0)
    ON CONFLICT (nome) DO NOTHING`)

  await db.end()
  console.log('setup concluido!')
  console.log('admin@enviro.com / admin123')
  console.log('publico@enviro.com / publico123')
  process.exit(0)
}

run().catch(function(erro) { console.log('erro:', erro.message); process.exit(1) })
