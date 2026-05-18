// Task 04 — Como administrador, quero cadastrar estações meteorológicas
// com seus respectivos sensores e parâmetros

const { validarTipo, offsetPodeSerNegativo } = require('../regras/tipos')
const { validarParametro }                   = require('../regras/parametros')
const { calcularValor }                      = require('../regras/calculos')

// regras dos tipos de parâmetro
test('5. nome do tipo obrigatório', () => {
  expect(() => validarTipo({ nome: '', unidade: '°C', fator: 1, valor_offset: 0 })).toThrow('nome obrigatório')
})

test('6. unidade do tipo obrigatória', () => {
  expect(() => validarTipo({ nome: 'Temperatura', unidade: '', fator: 1, valor_offset: 0 })).toThrow('unidade obrigatória')
})

test('7. fator não pode ser zero', () => {
  expect(() => validarTipo({ nome: 'Temperatura', unidade: '°C', fator: 0, valor_offset: 0 })).toThrow('fator não pode ser zero')
})

test('8. offset pode ser negativo', () => {
  expect(offsetPodeSerNegativo(-5)).toBe(true)
})

// regras dos parâmetros (Estação + Tipo)
const existentes = [{ id_estacao: 1, id_tipo_parametro: 2 }]

test('9. não pode vincular mesmo tipo duas vezes na mesma estação', () => {
  expect(() => validarParametro({ id_estacao: 1, id_tipo_parametro: 2 }, existentes)).toThrow('tipo já vinculado a esta estação')
})

test('10. estação e tipo são obrigatórios no parâmetro', () => {
  expect(() => validarParametro({ id_estacao: null, id_tipo_parametro: null }, [])).toThrow('estação e tipo são obrigatórios')
})

// regras do cálculo da medição
test('1. calcula valorReal = valorBruto * fator + offset', () => {
  expect(calcularValor(10, 0.25, 5)).toBe(7.5)
})

test('2. fator zero lança erro no cálculo', () => {
  expect(() => calcularValor(10, 0, 5)).toThrow('fator não pode ser zero')
})

test('3. resultado NaN ou Infinity lança erro', () => {
  expect(() => calcularValor(Infinity, 1, 0)).toThrow('resultado inválido')
})

test('4. fator 1 e offset 0 retorna o valor bruto', () => {
  expect(calcularValor(42, 1, 0)).toBe(42)
})
