// rotas/logs.js — rotas de logs de alertas criticos salvos no MongoDB

const express = require('express')
const router  = express.Router()
const { buscarLogs, salvarLog } = require('../models/LogAlertaModel')

// GET /logs-alertas — retorna historico para o frontend
router.get('/', async function(req, res) {
  try {
    const logs = await buscarLogs()
    res.json(logs)
  } catch (erro) {
    console.error('[LOGS] Erro ao buscar logs:', erro.message)
    res.json([])
  }
})

// POST /logs-alertas/interno — chamado pelo receptor.py ao escalar alerta
router.post('/interno', async function(req, res) {
  try {
    const { estacao, uid, parametro, valor, mensagem } = req.body
    await salvarLog({ estacao, uid, parametro, valor, mensagem })
    res.json({ ok: true })
  } catch (erro) {
    console.error('[LOGS] Erro ao salvar log:', erro.message)
    res.status(500).json({ erro: erro.message })
  }
})

module.exports = router