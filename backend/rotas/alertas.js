// rotas/alertas.js — rotas de alertas
// ROTA = so define o endereco e chama o Controller
//
// Insomnia:
// GET    http://localhost:3001/alertas
// POST   http://localhost:3001/alertas
//        Body JSON: { "id_estacao": 1, "id_parametro": 1, "severidade": "critico", "mensagem": "Temp alta" }
// PUT    http://localhost:3001/alertas/1
//        Body JSON: { "severidade": "aviso", "mensagem": "Normalizado", "ativo": false }
// DELETE http://localhost:3001/alertas/1

const router            = require('express').Router()
const AlertaController  = require('../controllers/AlertaController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                 AlertaController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, AlertaController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin, AlertaController.editar)
router.delete('/:id', verificarLogin, verificarAdmin, AlertaController.deletar)

module.exports = router
