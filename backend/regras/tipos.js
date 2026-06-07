// tipos.js — regras de negócio dos tipos de parâmetro

function validarTipo({ nome, unidade, fator }) {
  if (!nome    || nome.trim()    === '') throw new Error('nome obrigatório')
  if (!unidade || unidade.trim() === '') throw new Error('unidade obrigatória')
  if (fator === 0)                       throw new Error('fator não pode ser zero')
  return true
}

function offsetPodeSerNegativo(valor_offset) {
  return typeof valor_offset === 'number'
}

module.exports = { validarTipo, offsetPodeSerNegativo }