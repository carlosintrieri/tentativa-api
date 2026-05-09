// EstacaoModel.js — queries SQL da tabela estacoes

const { sql } = require('../conexao')

function buscarTodas() {
  return sql('SELECT id, nome, endereco, responsavel, lat, long, descricao, ativo FROM estacoes ORDER BY nome')
}

function criar(nome, endereco, responsavel, lat, long, descricao) {
  return sql(
    'INSERT INTO estacoes (nome, endereco, responsavel, lat, long, descricao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nome, endereco || null, responsavel || null, lat || null, long || null, descricao || null]
  )
}

function editar(id, nome, endereco, responsavel, lat, long, descricao, ativo) {
  return sql(
    'UPDATE estacoes SET nome=$1, endereco=$2, responsavel=$3, lat=$4, long=$5, descricao=$6, ativo=$7 WHERE id=$8 RETURNING *',
    [nome, endereco || null, responsavel || null, lat || null, long || null, descricao || null, ativo !== false, id]
  )
}

function deletar(id) {
  return sql('DELETE FROM estacoes WHERE id = $1', [id])
}

module.exports = { buscarTodas, criar, editar, deletar }
