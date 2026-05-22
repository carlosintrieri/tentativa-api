// LeituraController.js — logica das leituras

const { sql }      = require('../conexao')
const LeituraModel = require('../models/LeituraModel')

async function listar(req, res) {
  try {
    const leituras = await LeituraModel.buscarRecentes()
    res.json(leituras)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

async function simular(req, res) {
  try {
    const parametrosAtivos = await sql(`
      SELECT
        parametros.id,
        parametros.id_estacao,
        tipos_parametro.nome    AS nome_parametro,
        tipos_parametro.unidade AS unidade,
        estacoes.nome           AS nome_estacao
      FROM parametros
      JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
      JOIN estacoes        ON estacoes.id         = parametros.id_estacao
      WHERE estacoes.ativo = true
    `)

    const faixas = {
      'Temperatura': [15, 20],
      'Umidade':     [30, 60],
      'Pressão':     [990, 50],
      'Chuva':       [0, 10],
      'Vento':       [0, 40]
    }

    for (const item of parametrosAtivos) {
      const [minimo, variacao] = faixas[item.nome_parametro] || [0, 100]
      const valor = parseFloat((Math.random() * variacao + minimo).toFixed(2))
      await LeituraModel.salvar({
        parametroId:   item.id,
        estacaoId:     item.id_estacao,
        nomeEstacao:   item.nome_estacao,
        nomeParametro: item.nome_parametro,
        unidade:       item.unidade,
        valor
      })
    }

    res.json({ mensagem: parametrosAtivos.length + ' leituras geradas' })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
}

module.exports = { listar, simular }
