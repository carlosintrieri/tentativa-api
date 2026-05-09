// EstacaoController.js — logica das estacoes

const EstacaoModel = require('../models/EstacaoModel')

async function listar(req, res) {
  try {
    res.json(await EstacaoModel.buscarTodas())
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function criar(req, res) {
  try {
    const { nome, endereco, responsavel, lat, long, descricao } = req.body
    const linhas = await EstacaoModel.criar(nome, endereco, responsavel, lat, long, descricao)
    res.status(201).json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function editar(req, res) {
  try {
    const { nome, endereco, responsavel, lat, long, descricao, ativo } = req.body
    const linhas = await EstacaoModel.editar(req.params.id, nome, endereco, responsavel, lat, long, descricao, ativo)
    res.json(linhas[0])
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function deletar(req, res) {
  try {
    await EstacaoModel.deletar(req.params.id)
    res.json({ ok: true })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, criar, editar, deletar }
