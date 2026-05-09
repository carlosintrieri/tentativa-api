// rotas/parametros.js — rotas de parametros
// ROTA = so define o endereco e chama o Controller
//
// Insomnia:
// GET    http://localhost:3001/parametros
// POST   http://localhost:3001/parametros
//        Body JSON: { "id_estacao": 1, "id_tipo_parametro": 2, "nome": "Temp Interna", "valor_min": -10, "valor_max": 60 }
// DELETE http://localhost:3001/parametros/1

const router               = require('express').Router()
const ParametroController  = require('../controllers/ParametroController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                 ParametroController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, ParametroController.criar)
router.delete('/:id', verificarLogin, verificarAdmin, ParametroController.deletar)

module.exports = router
