// autenticacao.js — verifica se o usuario esta logado e se e admin

require('dotenv').config()
const jwt   = require('jsonwebtoken')
const CHAVE = process.env.JWT_SECRET || 'chave123'

// verificarLogin() — checa o token JWT
function verificarLogin(req, res, next) {
  // chega a requisição
  const cabecalho = req.headers.authorization || ''
  // pega o Authorization
  const token     = cabecalho.replace('Bearer ', '')
  // remove Bearer
  try {
    req.usuario = jwt.verify(token, CHAVE) // verifica se o token é válido
    next() // então manda pro controller 
  } catch {
    res.status(401).json({ erro: 'nao autorizado' })
  }
}

// verificarAdmin() — verifica login E se é admin em uma só função
function verificarAdmin(req, res, next) {
  const cabecalho = req.headers.authorization || ''
  const token     = cabecalho.replace('Bearer ', '')
  try {
    req.usuario = jwt.verify(token, CHAVE)
  } catch {
    return res.status(401).json({ erro: 'nao autorizado' })
  }
  if (req.usuario.nivel !== 'admin')
    return res.status(403).json({ erro: 'apenas admin pode fazer isso' })
  next()
}

module.exports = { verificarLogin, verificarAdmin }
