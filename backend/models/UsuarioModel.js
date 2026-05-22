// UsuarioModel.js — queries SQL da tabela usuarios

const { sql } = require('../conexao')

// busca id, nome, email e perfil de todos os usuarios — sem retornar a senha
function buscarTodos() {
  return sql('SELECT id, nome, email, perfil AS nivel FROM usuarios ORDER BY nome')
}

// busca um usuario pelo email — usado no login para checar a senha
function buscarPorEmail(email) {
  return sql('SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = $1', [email])
}

// salva novo usuario com senha ja criptografada
function criar(nome, email, senhaCriptografada, nivel) {
  return sql(
    'INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil AS nivel',
    [nome, email, senhaCriptografada, nivel || 'publico']
  )
}

// atualiza usuario — so muda a senha se for informada
function editar(id, nome, email, senhaCriptografada, nivel) {
  if (senhaCriptografada) {
    return sql(
      'UPDATE usuarios SET nome=$1, email=$2, senha=$3, perfil=$4 WHERE id=$5 RETURNING id, nome, email, perfil AS nivel',
      [nome, email, senhaCriptografada, nivel, id]
    )
  }
  return sql(
    'UPDATE usuarios SET nome=$1, email=$2, perfil=$3 WHERE id=$4 RETURNING id, nome, email, perfil AS nivel',
    [nome, email, nivel, id]
  )
}

// remove usuario do banco
function deletar(id) {
  return sql('DELETE FROM usuarios WHERE id = $1', [id])
}

module.exports = { buscarTodos, buscarPorEmail, criar, editar, deletar }
