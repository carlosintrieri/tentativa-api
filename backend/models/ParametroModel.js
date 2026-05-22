// ParametroModel.js — junção Estação + Tipo

const { sql } = require('../conexao')

function buscarTodos() {
  return sql(`
    SELECT
      parametros.id,
      parametros.id_estacao,
      parametros.id_tipo_parametro,
      parametros.ativo,
      estacoes.nome            AS nome_estacao,
      tipos_parametro.nome     AS nome_tipo,
      tipos_parametro.unidade,
      COALESCE(tipos_parametro.fator, 1)        AS fator,
      COALESCE(tipos_parametro.valor_offset, 0) AS valor_offset
    FROM parametros
    JOIN estacoes        ON estacoes.id        = parametros.id_estacao
    JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
    ORDER BY estacoes.nome, tipos_parametro.nome
  `)
}

function criar(id_estacao, id_tipo_parametro) {
  return sql(
    'INSERT INTO parametros (id_estacao, id_tipo_parametro) VALUES ($1, $2) RETURNING *',
    [id_estacao, id_tipo_parametro]
  )
}

function deletar(id) {
  return sql('DELETE FROM parametros WHERE id = $1', [id])
}

module.exports = { buscarTodos, criar, deletar }
