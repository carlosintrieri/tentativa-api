// UsuarioController.js — logica dos usuarios

const bcrypt       = require('bcryptjs')
const UsuarioModel = require('../models/UsuarioModel')

async function listar(req, res) {
  try {
    const usuarios = await UsuarioModel.buscarTodos()
    res.json(usuarios)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, nivel } = req.body
    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' })
    const senhaCriptografada = await bcrypt.hash(senha, 10)
    const linhas = await UsuarioModel.criar(nome, email, senhaCriptografada, nivel)
    res.status(201).json(linhas[0])
  } catch (erro) {
    if (erro.code === '23505') return res.status(400).json({ erro: 'Email já cadastrado' })
    res.status(500).json({ erro: erro.message })
  }
}

async function editar(req, res) {
  try {
    const { nome, email, senha, nivel } = req.body
    const senhaCriptografada = senha ? await bcrypt.hash(senha, 10) : null
    const linhas = await UsuarioModel.editar(req.params.id, nome, email, senhaCriptografada, nivel)
    res.json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    await UsuarioModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, editar, deletar }
