// TipoModel.js — queries SQL da tabela tipos_parametro

const { sql } = require('../conexao')

function buscarTodos() {
  return sql(`
    SELECT id, nome, unidade,
      COALESCE(fator, 1) AS fator,
      COALESCE(valor_offset, 0) AS valor_offset
    FROM tipos_parametro ORDER BY nome
  `)
}

function criar(nome, unidade, fator, valor_offset) {
  return sql(
    'INSERT INTO tipos_parametro (nome, unidade, fator, valor_offset) VALUES ($1, $2, $3, $4) RETURNING *',
    [nome, unidade || '', Number(fator) || 1, Number(valor_offset) || 0]
  )
}

function editar(id, nome, unidade, fator, valor_offset) {
  return sql(
    'UPDATE tipos_parametro SET nome=$1, unidade=$2, fator=$3, valor_offset=$4 WHERE id=$5 RETURNING *',
    [nome, unidade || '', Number(fator) || 1, Number(valor_offset) || 0, id]
  )
}

function deletar(id) {
  return sql('DELETE FROM tipos_parametro WHERE id = $1', [id])
}

module.exports = { buscarTodos, criar, editar, deletar }
