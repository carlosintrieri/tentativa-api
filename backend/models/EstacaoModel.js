// EstacaoModel.js — queries SQL da tabela estacoes

const { sql } = require('../conexao')

function buscarTodas() {
  return sql('SELECT id, nome, uid, endereco, responsavel, lat, long, descricao, ativo FROM estacoes ORDER BY nome')
}

function buscarPorUid(uid) {
  return sql('SELECT * FROM estacoes WHERE uid = $1 AND ativo = true', [uid])
}

function criar(nome, uid, endereco, responsavel, lat, long, descricao) {
  return sql(
    'INSERT INTO estacoes (nome, uid, endereco, responsavel, lat, long, descricao) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [nome, uid || null, endereco || null, responsavel || null, lat || null, long || null, descricao || null]
  )
}

function editar(id, nome, uid, endereco, responsavel, lat, long, descricao, ativo) {
  return sql(
    'UPDATE estacoes SET nome=$1, uid=$2, endereco=$3, responsavel=$4, lat=$5, long=$6, descricao=$7, ativo=$8 WHERE id=$9 RETURNING *',
    [nome, uid || null, endereco || null, responsavel || null, lat || null, long || null, descricao || null, ativo !== false, id]
  )
}

function deletar(id) {
  return sql('DELETE FROM estacoes WHERE id = $1', [id])
}

module.exports = { buscarTodas, buscarPorUid, criar, editar, deletar }
