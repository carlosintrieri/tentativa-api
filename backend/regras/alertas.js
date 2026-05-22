// alertas.js — regras de negócio dos alertas

const SEVERIDADES = ['info', 'aviso', 'critico']

function validarAlerta({ severidade, id_estacao, resolvido }) {
  if (!SEVERIDADES.includes(severidade)) throw new Error('severidade inválida')
  if (!id_estacao)                        throw new Error('estação obrigatória')
  return true
}

function deveDisparar(alerta) {
  return !alerta.resolvido
}

module.exports = { validarAlerta, deveDisparar }
