// rotas/estacoes.js — rotas de estacoes
// ROTA = so define o endereco e chama o Controller
//
// Insomnia:
// GET    http://localhost:3001/estacoes
// POST   http://localhost:3001/estacoes
//        Body JSON: { "nome": "Estação Centro", "endereco": "Rua XV", "responsavel": "João", "lat": "-23.55", "long": "-46.63" }
// PUT    http://localhost:3001/estacoes/1
//        Body JSON: { "nome": "Novo Nome", "endereco": "...", "ativo": true }
// DELETE http://localhost:3001/estacoes/1

const router             = require('express').Router()
const EstacaoController  = require('../controllers/EstacaoController')
const { verificarLogin, verificarAdmin } = require('../autenticacao')

router.get   ('/',    verificarLogin,                    EstacaoController.listar)
router.post  ('/',    verificarLogin, verificarAdmin,    EstacaoController.criar)
router.put   ('/:id', verificarLogin, verificarAdmin,    EstacaoController.editar)
router.delete('/:id', verificarLogin, verificarAdmin,    EstacaoController.deletar)

module.exports = router
