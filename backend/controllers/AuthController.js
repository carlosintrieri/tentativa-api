// AuthController.js — logica do login

require('dotenv').config()
const bcrypt       = require('bcryptjs')
const jwt          = require('jsonwebtoken')
const UsuarioModel = require('../models/UsuarioModel')

const CHAVE = process.env.JWT_SECRET || 'chave123'

async function login(req, res) {
  const { email, senha } = req.body

  const [usuario] = await UsuarioModel.buscarPorEmail(email)

  if (!usuario || !await bcrypt.compare(senha, usuario.senha))
    return res.status(401).json({ erro: 'email ou senha incorretos' })

  // perfil no banco = 'admin' ou 'publico'
  // nivel no token e no frontend = mesmo valor
  const dadosUsuario = {
    id:    usuario.id,
    nome:  usuario.nome,
    email: usuario.email,
    nivel: usuario.perfil
  }

  const token = jwt.sign(dadosUsuario, CHAVE, { expiresIn: '8h' })
  res.json({ token, usuario: dadosUsuario })
}

module.exports = { login }
