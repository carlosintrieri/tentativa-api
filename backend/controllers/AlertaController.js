// AlertaController.js — logica dos alertas

const AlertaModel = require('../models/AlertaModel')

async function listar(req, res) {
  try {
    const alertas = await AlertaModel.buscarTodos()
    res.json(alertas)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function criar(req, res) {
  try {
    const { id_estacao, id_parametro, severidade, mensagem, valor_min, valor_max } = req.body
    const linhas = await AlertaModel.criar(id_estacao, id_parametro, severidade, mensagem, valor_min, valor_max)
    res.status(201).json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function editar(req, res) {
  try {
    const { id_estacao, id_parametro, severidade, mensagem, ativo, valor_min, valor_max } = req.body
    const linhas = await AlertaModel.editar(
      req.params.id, id_estacao, id_parametro,
      severidade, mensagem, ativo, valor_min, valor_max
    )
    res.json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    await AlertaModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, editar, deletar }