// rotas/alertas.js
const router            = require('express').Router()
const AlertaController  = require('../controllers/AlertaController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                 AlertaController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, AlertaController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin, AlertaController.editar)
router.delete('/:id', verificarLogin, verificarAdmin, AlertaController.deletar)

module.exports = router