// rotas/parametros.js
const router               = require('express').Router()
const ParametroController  = require('../controllers/ParametroController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                 ParametroController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, ParametroController.criar)
router.delete('/:id', verificarLogin, verificarAdmin, ParametroController.deletar)

module.exports = router