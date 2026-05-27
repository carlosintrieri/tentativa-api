// rotas/usuarios.js
const router             = require('express').Router()
const UsuarioController  = require('../controllers/UsuarioController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin, verificarAdmin, UsuarioController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, UsuarioController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin, UsuarioController.editar)
router.delete('/:id', verificarLogin, verificarAdmin, UsuarioController.deletar)

module.exports = router