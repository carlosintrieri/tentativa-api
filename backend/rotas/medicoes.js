const express = require('express')
const router = express.Router()
const { sql } = require('../conexao')
const { verificarLogin } = require('../autenticacao')

// GET /medicoes - retorna TODOS os dados que vem do MongoDB
router.get('/', verificarLogin, async (req, res) => {
  try {
    const medicoes = await sql(
      `SELECT 
        id,
        id_estacao,
        id_parametro,
        uid_estacao,
        nome_parametro,
        valor_bruto,
        valor,
        timestamp_mqtt,
        registrado_em
      FROM medicoes
      ORDER BY registrado_em DESC
      LIMIT 100`
    )
    
    res.json(medicoes)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

module.exports = router