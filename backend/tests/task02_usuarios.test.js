// Task 02 — Como administrador, quero cadastrar, editar e remover usuários
// para controlar quem acessa o sistema

const { validarUsuario, podeDeletar } = require('../regras/usuarios')

test('14. nível só pode ser admin ou publico', () => {
  expect(() => validarUsuario({ email: 'x@x.com', nivel: 'superadmin' })).toThrow('nível inválido')
})

test('15. não pode deletar o próprio usuário', () => {
  expect(() => podeDeletar(3, 3)).toThrow('não é possível deletar o próprio usuário')
})

test('16. não pode deletar o admin principal (id=1)', () => {
  expect(() => podeDeletar(1, 2)).toThrow('não é possível deletar o admin principal')
})

test('17. email obrigatório', () => {
  expect(() => validarUsuario({ email: '', nivel: 'admin' })).toThrow('email obrigatório')
})
