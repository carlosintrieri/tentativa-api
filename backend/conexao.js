// conexao.js — conecta no PostgreSQL e no MongoDB

require('dotenv').config()
const { Pool } = require('pg')
const mongoose = require('mongoose')

const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     process.env.PG_PORT,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl:      { rejectUnauthorized: false }
})

// sql() roda qualquer comando SQL e devolve as linhas como array
const sql = async (texto, valores) => (await pool.query(texto, valores)).rows

const conectarMongo = () => mongoose.connect(process.env.MONGO_URL)

module.exports = { sql, conectarMongo }
