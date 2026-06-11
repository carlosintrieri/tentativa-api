// calculos.js — regras de negócio do cálculo de medição

function calcularValor(valorBruto, fator, offset) {
  // Valida entrada
  if (valorBruto === null || valorBruto === undefined) {
    throw new Error('valorBruto não pode ser nulo')
  }
  
  if (fator === null || fator === undefined || fator === 0) {
    console.log(`  [AVISO] Fator inválido (${fator}), usando valor bruto`)
    return parseFloat(valorBruto)
  }

  // Converte para número
  const vb = parseFloat(valorBruto)
  const f = parseFloat(fator)
  const o = parseFloat(offset || 0)

  // Valida conversão
  if (isNaN(vb) || isNaN(f) || isNaN(o)) {
    throw new Error(`Valores inválidos: valorBruto=${vb}, fator=${f}, offset=${o}`)
  }

  // Calcula
  const resultado = vb * f + o

  // Valida resultado
  if (isNaN(resultado) || !isFinite(resultado)) {
    throw new Error(`Resultado inválido: ${vb} * ${f} + ${o} = ${resultado}`)
  }

  return resultado
}

module.exports = { calcularValor }