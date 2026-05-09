// tipos.js — rotas dos tipos de parâmetro

const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/TipoController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin, ctrl.listar)
router.post  ('/',    verificarAdmin, ctrl.criar)
router.put   ('/:id', verificarAdmin, ctrl.editar)
router.delete('/:id', verificarAdmin, ctrl.deletar)

module.exports = router
