// auth.js — regras de negócio da autenticação

const jwt = require('jsonwebtoken')
const CHAVE = process.env.JWT_SECRET || 'chave_secreta_qualquer'

function verificarToken(token) {
  try {
    return jwt.verify(token, CHAVE)
  } catch {
    throw new Error('token inválido ou expirado')
  }
}

function podeFazerAcaoAdmin(nivel) {
  if (nivel !== 'admin') throw new Error('apenas admin pode fazer isso')
  return true
}

function verificarSenha(senhaDigitada, senhaCorreta) {
  if (senhaDigitada !== senhaCorreta) throw new Error('senha incorreta')
  return true
}

module.exports = { verificarToken, podeFazerAcaoAdmin, verificarSenha }
