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

async function transferir() {
  try {
    const db = mongoose.connection.db
    if (!db) return

    const col = db.collection('medicoes_temporarias')
    const nao = await col.countDocuments({ processado: false })
    if (nao === 0) return

    const meds = await col.find({ processado: false }).limit(1000).toArray()

    let ok = 0
    for (const m of meds) {
      try {
        await pool.query(
          'INSERT INTO medicoes (uid_estacao, nome_parametro, valor_bruto, timestamp_mqtt) VALUES ($1, $2, $3, $4)',
          [m.uid_estacao, m.nome_parametro, m.valor_bruto, m.timestamp]
        )
        await col.updateOne({ _id: m._id }, { $set: { processado: true } })
        ok++
      } catch (e) {}
    }
    if (ok > 0) console.log(`[✓] ${ok} inseridas`)
  } catch (e) {
    console.error('[ERRO]', e.message)
  }
}

setInterval(transferir, 10000)
transferir()
module.exports = {}