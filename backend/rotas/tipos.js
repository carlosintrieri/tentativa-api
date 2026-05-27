// rotas/tipos.js
const router          = require('express').Router()
const TipoController  = require('../controllers/TipoController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                 TipoController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, TipoController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin, TipoController.editar)
router.delete('/:id', verificarLogin, verificarAdmin, TipoController.deletar)

module.exports = router