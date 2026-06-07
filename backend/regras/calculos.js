// calculos.js — regras de negócio do cálculo de medição

function calcularValor(valorBruto, fator, offset) {
  if (fator === 0) throw new Error('fator não pode ser zero')
  const resultado = valorBruto * fator + offset
  if (isNaN(resultado) || !isFinite(resultado)) throw new Error('resultado inválido')
  return resultado
}

module.exports = { calcularValor }