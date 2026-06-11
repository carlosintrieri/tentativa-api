require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: false
})

async function setup() {
  try {
    console.log('[Setup] Criando tabelas...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS estacoes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        uid VARCHAR(50),
        endereco TEXT,
        responsavel VARCHAR(100),
        lat DECIMAL(10,8),
        long DECIMAL(11,8),
        descricao TEXT,
        ativo BOOLEAN DEFAULT true
      )
    `)
    console.log('[✓] estacoes')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_parametro (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        unidade VARCHAR(20) NOT NULL
      )
    `)
    console.log('[✓] tipos_parametro')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parametros (
        id SERIAL PRIMARY KEY,
        id_estacao INTEGER REFERENCES estacoes(id) ON DELETE CASCADE,
        id_tipo_parametro INTEGER REFERENCES tipos_parametro(id) ON DELETE CASCADE,
        descricao TEXT
      )
    `)
    console.log('[✓] parametros')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicoes (
        id SERIAL PRIMARY KEY,
        id_estacao INTEGER REFERENCES estacoes(id) ON DELETE CASCADE,
        id_parametro INTEGER REFERENCES parametros(id) ON DELETE SET NULL,
        valor DECIMAL(10,4),
        uid_estacao VARCHAR(50),
        nome_parametro VARCHAR(100),
        valor_bruto DECIMAL(10,4),
        timestamp_mqtt TIMESTAMP,
        registrado_em TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('[✓] medicoes')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        nome VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('[✓] usuarios')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertas (
        id SERIAL PRIMARY KEY,
        id_parametro INTEGER REFERENCES parametros(id) ON DELETE CASCADE,
        tipo VARCHAR(50),
        valor_minimo DECIMAL(10,4),
        valor_maximo DECIMAL(10,4),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('[✓] alertas')

    console.log('\n[SUCCESS] Banco criado!')
    process.exit(0)
  } catch (e) {
    console.error('[ERRO]', e.message)
    process.exit(1)
  }
}

setup()