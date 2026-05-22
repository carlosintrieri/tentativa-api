// AlertaModel.js — queries SQL da tabela alertas

const { sql } = require('../conexao')

// busca alertas com nome da estacao e parametro via JOIN
// LEFT JOIN = inclui alertas mesmo sem parametro vinculado
function buscarTodos() {
  return sql(`
    SELECT
      alertas.id,
      alertas.id_estacao,
      alertas.id_parametro,
      alertas.severidade,
      alertas.mensagem,
      alertas.ativo,
      estacoes.nome AS nome_estacao,
      tipos_parametro.nome AS nome_parametro
    FROM alertas
    JOIN estacoes ON estacoes.id = alertas.id_estacao
    LEFT JOIN parametros ON parametros.id = alertas.id_parametro
    LEFT JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
    ORDER BY alertas.id DESC
  `)
}

function criar(id_estacao, id_parametro, severidade, mensagem) {
  return sql(
    'INSERT INTO alertas (id_estacao, id_parametro, severidade, mensagem) VALUES ($1, $2, $3, $4) RETURNING *',
    [id_estacao, id_parametro || null, severidade || 'aviso', mensagem]
  )
}

function editar(id, id_estacao, id_parametro, severidade, mensagem, ativo) {
  return sql(
    'UPDATE alertas SET id_estacao=$1, id_parametro=$2, severidade=$3, mensagem=$4, ativo=$5 WHERE id=$6 RETURNING *',
    [id_estacao, id_parametro || null, severidade, mensagem, ativo !== false, id]
  )
}

function deletar(id) {
  return sql('DELETE FROM alertas WHERE id = $1', [id])
}

module.exports = { buscarTodos, criar, editar, deletar }
