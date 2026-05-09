// LeituraModel.js — schema e queries do MongoDB para leituras

const mongoose = require('mongoose')

// Schema = molde de como cada leitura fica salva no MongoDB
// nomeEstacao e nomeParametro ficam aqui para nao precisar de JOIN depois
const esquema = new mongoose.Schema({
  parametroId:   Number,
  estacaoId:     Number,
  nomeEstacao:   String,
  nomeParametro: String,
  unidade:       String,
  valor:         Number,
  registrado:    { type: Date, default: Date.now }
})

const Leitura = mongoose.model('Leitura', esquema)

// busca as 100 leituras mais recentes
function buscarRecentes() {
  return Leitura.find().sort({ registrado: -1 }).limit(100).lean()
}

// salva uma nova leitura
function salvar(dados) {
  return Leitura.create(dados)
}

module.exports = { Leitura, buscarRecentes, salvar }
