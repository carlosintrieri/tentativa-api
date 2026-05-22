// Task 12 — Como administrador, quero configurar alertas baseados em limites
// de parâmetros meteorológicos para ser notificado em situações críticas
// Task 13 — Como usuário público, quero receber notificações de alertas ativos

const { validarAlerta, deveDisparar } = require('../regras/alertas')

test('11. severidade só pode ser info, aviso ou critico', () => {
  expect(() => validarAlerta({ severidade: 'urgente', id_estacao: 1 })).toThrow('severidade inválida')
})

test('12. alerta sem estação é inválido', () => {
  expect(() => validarAlerta({ severidade: 'info', id_estacao: null })).toThrow('estação obrigatória')
})

test('13. alerta resolvido não deve disparar', () => {
  expect(deveDisparar({ resolvido: true })).toBe(false)
})
