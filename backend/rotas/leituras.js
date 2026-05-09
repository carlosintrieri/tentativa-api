// rotas/leituras.js — rotas de leituras e simulador
// ROTA = so define o endereco e chama o Controller
//
// Insomnia:
// GET  http://localhost:3001/leituras
//      Header: Authorization: Bearer <token>
//
// POST http://localhost:3001/simulador/gerar
//      Header: Authorization: Bearer <token admin>
//      Body: (vazio)

const router             = require('express').Router()
const LeituraController  = require('../controllers/LeituraController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get ('/leituras',       verificarLogin,                 LeituraController.listar)
router.post('/simulador/gerar', verificarLogin, verificarAdmin, LeituraController.simular)

module.exports = router
