// rotas/auth.js — rota de login
// ROTA = so define o endereco e chama o Controller
//
// Insomnia: POST http://localhost:3001/auth/login
// Body JSON: { "email": "admin@enviro.com", "senha": "admin123" }

const router         = require('express').Router()
const AuthController = require('../controllers/AuthController')

router.post('/login', AuthController.login)

module.exports = router
