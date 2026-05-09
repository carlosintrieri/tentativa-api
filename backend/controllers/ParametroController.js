// ParametroController.js — logica dos parametros

const ParametroModel = require('../models/ParametroModel')

async function listar(req, res) {
  try {
    res.json(await ParametroModel.buscarTodos())
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function criar(req, res) {
  try {
    const { id_estacao, id_tipo_parametro, nome, valor_min, valor_max } = req.body
    const linhas = await ParametroModel.criar(id_estacao, id_tipo_parametro, nome, valor_min, valor_max)
    res.status(201).json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    await ParametroModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, deletar }
