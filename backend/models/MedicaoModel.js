// MedicaoModel.js — queries SQL da tabela medicoes

const { sql } = require('../conexao')

// busca as medicoes mais recentes com JOIN para trazer nomes
// LIMIT 500 garante cobertura de todas as estacoes e parametros dos ultimos 5 minutos
function buscarRecentes() {
  return sql(`
    SELECT
      medicoes.id,
      medicoes.valor,
      medicoes.registrado_em,
      medicoes.id_estacao,
      medicoes.id_parametro,
      estacoes.nome            AS nome_estacao,
      tipos_parametro.nome     AS nome_parametro,
      tipos_parametro.unidade  AS unidade
    FROM medicoes
    JOIN estacoes        ON estacoes.id        = medicoes.id_estacao
    LEFT JOIN parametros      ON parametros.id      = medicoes.id_parametro
    LEFT JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
    ORDER BY medicoes.registrado_em DESC
    LIMIT 500
  `)
}

// busca medicoes de uma estação específica
function buscarPorEstacao(id_estacao) {
  return sql(`
    SELECT
      medicoes.id,
      medicoes.valor,
      medicoes.registrado_em,
      medicoes.id_parametro,
      tipos_parametro.nome     AS nome_parametro,
      tipos_parametro.unidade  AS unidade
    FROM medicoes
    LEFT JOIN parametros      ON parametros.id      = medicoes.id_parametro
    LEFT JOIN tipos_parametro ON tipos_parametro.id = parametros.id_tipo_parametro
    WHERE medicoes.id_estacao = $1
    ORDER BY medicoes.registrado_em DESC
    LIMIT 100
  `, [id_estacao])
}

// salva uma nova medicao
function salvar(id_estacao, id_parametro, valor) {
  return sql(
    'INSERT INTO medicoes (id_estacao, id_parametro, valor) VALUES ($1, $2, $3) RETURNING *',
    [id_estacao, id_parametro || null, valor]
  )
}

module.exports = { buscarRecentes, buscarPorEstacao, salvar }