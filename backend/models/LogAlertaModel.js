// LogAlertaModel.js — schema Mongoose para logs de alertas críticos no MongoDB
// cada documento registra um alerta que foi escalado para crítico pelo receptor

const mongoose = require('mongoose')

const LogAlertaSchema = new mongoose.Schema({
  estacao:    { type: String, required: true },
  uid:        { type: String, required: true },
  parametro:  { type: String, required: true },
  valor:      { type: Number, required: true },
  mensagem:   { type: String, required: true },
  criado_em:  { type: Date,   default: Date.now }
})

const LogAlerta = mongoose.model('LogAlerta', LogAlertaSchema)

// busca os ultimos 50 logs ordenados do mais recente para o mais antigo
async function buscarLogs() {
  return LogAlerta.find().sort({ criado_em: -1 }).limit(50)
}

// salva um novo log de alerta critico
async function salvarLog(dados) {
  const log = new LogAlerta(dados)
  return log.save()
}

module.exports = { buscarLogs, salvarLog }