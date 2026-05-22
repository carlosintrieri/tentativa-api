// MedicaoController.js — logica das medicoes

const MedicaoModel = require('../models/MedicaoModel')

async function listar(req, res) {
  try {
    const medicoes = await MedicaoModel.buscarRecentes()
    res.json(medicoes)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function listarPorEstacao(req, res) {
  try {
    const medicoes = await MedicaoModel.buscarPorEstacao(req.params.id)
    res.json(medicoes)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, listarPorEstacao }
