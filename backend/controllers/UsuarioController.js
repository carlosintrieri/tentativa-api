// UsuarioController.js — logica dos usuarios

const bcrypt                      = require('bcryptjs')
const UsuarioModel                = require('../models/UsuarioModel')
const { validarUsuario, podeDeletar } = require('../regras/usuarios') // importa as regras

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
    validarUsuario({ email, nivel }) // valida email e nível antes de salvar
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
    validarUsuario({ email, nivel }) // valida email e nível antes de editar
    const senhaCriptografada = senha ? await bcrypt.hash(senha, 10) : null
    const linhas = await UsuarioModel.editar(req.params.id, nome, email, senhaCriptografada, nivel)
    res.json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    // podeDeletar verifica: não pode deletar id=1 nem o próprio usuário logado
    podeDeletar(Number(req.params.id), req.usuario.id)
    await UsuarioModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, editar, deletar }