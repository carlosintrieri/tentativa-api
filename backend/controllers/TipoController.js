// TipoController.js — logica dos tipos de parâmetro

const TipoModel = require('../models/TipoModel')

async function listar(req, res) {
  try {
    res.json(await TipoModel.buscarTodos())
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function criar(req, res) {
  try {
    const { nome, unidade, fator, valor_offset } = req.body
    const linhas = await TipoModel.criar(nome, unidade, fator, valor_offset)
    res.status(201).json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function editar(req, res) {
  try {
    const { nome, unidade, fator, valor_offset } = req.body
    const linhas = await TipoModel.editar(req.params.id, nome, unidade, fator, valor_offset)
    res.json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    await TipoModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, editar, deletar }
