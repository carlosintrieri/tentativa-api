// parametros.js — regras de negócio dos parâmetros (Estação + Tipo)

function validarParametro({ id_estacao, id_tipo_parametro }, existentes) {
  if (!id_estacao || !id_tipo_parametro) throw new Error('estação e tipo são obrigatórios')
  const duplicado = existentes.some(function(p) {
    return String(p.id_estacao) === String(id_estacao) &&
           String(p.id_tipo_parametro) === String(id_tipo_parametro)
  })
  if (duplicado) throw new Error('tipo já vinculado a esta estação')
  return true
}

module.exports = { validarParametro }
