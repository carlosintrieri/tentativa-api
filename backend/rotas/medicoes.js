// rotas/medicoes.js — rotas de medicoes
//
// Insomnia:
// GET http://localhost:3001/medicoes
// GET http://localhost:3001/medicoes/estacao/1

const router            = require('express').Router()
const MedicaoController = require('../controllers/MedicaoController')
const { verificarLogin } = require('../autenticacao')

router.get('/',            verificarLogin, MedicaoController.listar)
router.get('/estacao/:id', verificarLogin, MedicaoController.listarPorEstacao)

module.exports = router
