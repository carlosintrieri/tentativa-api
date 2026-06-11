require('dotenv').config()
const { Pool } = require('pg')
const mongoose = require('mongoose')

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: false
})

async function popular() {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    const colecao = mongoose.connection.db.collection('medicoes_temporarias')
    const medicoes = await colecao.find({}).toArray()
    
    let count = 0
    for (const med of medicoes) {
      await pool.query(
        `INSERT INTO medicoes (uid_estacao, nome_parametro, valor_bruto, timestamp_mqtt) 
         VALUES ($1, $2, $3, $4)`,
        [med.uid_estacao, med.nome_parametro, med.valor_bruto, med.timestamp]
      )
      count++
      if (count % 100 === 0) console.log(`${count}...`)
    }
    
    console.log(`[SUCESSO] ${count} inseridas!`)
    process.exit(0)
  } catch (e) {
    console.error('[ERRO]', e.message)
    process.exit(1)
  }
}

popular()