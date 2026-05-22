// usuarios.js — regras de negócio dos usuários

const NIVEIS = ['admin', 'publico']

function validarUsuario({ email, nivel }) {
  if (!email || email.trim() === '') throw new Error('email obrigatório')
  if (!NIVEIS.includes(nivel))       throw new Error('nível inválido')
  return true
}

function podeDeletar(idAlvo, idLogado) {
  if (idAlvo === 1)        throw new Error('não é possível deletar o admin principal')
  if (idAlvo === idLogado) throw new Error('não é possível deletar o próprio usuário')
  return true
}

module.exports = { validarUsuario, podeDeletar }
