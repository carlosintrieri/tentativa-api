// rotas/usuarios.js — rotas de usuarios
// ROTA = so define o endereco e chama o Controller
//
// Insomnia:
// GET    http://localhost:3001/usuarios
// POST   http://localhost:3001/usuarios
//        Body JSON: { "nome": "Maria", "email": "maria@enviro.com", "senha": "123456", "nivel": "publico" }
// PUT    http://localhost:3001/usuarios/2
//        Body JSON: { "nome": "Maria Silva", "email": "maria@enviro.com", "nivel": "admin", "senha": "" }
// DELETE http://localhost:3001/usuarios/2

const router             = require('express').Router()
const UsuarioController  = require('../controllers/UsuarioController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin, verificarAdmin, UsuarioController.listar)
router.post  ('/',    verificarLogin, verificarAdmin, UsuarioController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin, UsuarioController.editar)
router.delete('/:id', verificarLogin, verificarAdmin, UsuarioController.deletar)

module.exports = router
