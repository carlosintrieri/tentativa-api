// Task 01 — Como administrador, quero fazer login com e-mail e senha
// para acessar as funcionalidades restritas do sistema

const { verificarToken, verificarSenha, podeFazerAcaoAdmin } = require('../regras/auth')

test('18. token expirado ou inválido lança erro', () => {
  expect(() => verificarToken('token_invalido')).toThrow('token inválido ou expirado')
})

test('19. usuário público não pode fazer ação de admin', () => {
  expect(() => podeFazerAcaoAdmin('publico')).toThrow('apenas admin pode fazer isso')
}) // .toThrow é para verificar se está errado!

test('20. senha errada lança erro', () => {
  expect(() => verificarSenha('senhaErrada', 'admin123')).toThrow('senha incorreta')
})
