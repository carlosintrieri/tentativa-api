// Login.jsx — aqui cuido da tela de login do sistema
//
// Não busco dados do backend diretamente
// Recebo a função onEntrar do App.jsx — ela faz a chamada ao backend em /auth/login

import { useState } from 'react'
// importo useState do React para guardar os valores dos campos e o estado de carregamento

// ESTADOS DO FORMULÁRIO
// uso um único useState para os dois campos em vez de dois separados
// form.email e form.senha guardam o que o usuário digita
export default function Login({ onEntrar }) {
  const [form,       setForm]       = useState({ email: 'admin@enviro.com', senha: 'admin123' })
  // erro = mensagem que o backend retorna se o login falhar
  const [erro,       setErro]       = useState('')
  // carregando = true enquanto aguardo a resposta do backend — desativo o botão nesse tempo
  const [carregando, setCarregando] = useState(false)

  // FUNÇÃO DE SUBMETER O FORMULÁRIO
  // chamo quando o usuário clica em Entrar ou aperta Enter
  async function submeter(evento) {
    // preventDefault() impede o HTML de recarregar a página ao submeter o formulário
    evento.preventDefault()
    setCarregando(true)
    setErro('')
    // chamo onEntrar que veio do App.jsx — ela bate no backend e retorna null ou mensagem de erro
    const mensagem = await onEntrar(form.email, form.senha)
    // && = só executo setErro se mensagem não for null ou vazio
    if (mensagem) setErro(mensagem)
    setCarregando(false)
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      {/* centralizo o card na tela inteira com vh-100 (altura da viewport) */}
      <div className="card shadow p-4" style={{ width: 360 }}>
        <h4 className="text-center mb-1">EnviroSense</h4>
        <p className="text-center text-muted mb-4">Sistema de Estações Meteorológicas</p>

        {/* && = só mostro o alerta vermelho se erro não estiver vazio */}
        {erro && <div className="alert alert-danger py-2">{erro}</div>}

        {/* FORMULÁRIO DE LOGIN
            onSubmit chama minha função submeter() ao clicar em Entrar ou apertar Enter */}
        <form onSubmit={submeter}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} required
              onChange={function(evento) {
                // evento = o que aconteceu (usuário digitou algo)
                // evento.target = o campo input onde digitou
                // evento.target.value = o texto atual dentro do campo
                // spread operator {...form} = copia todos os campos do formulário
                // substituo só o campo email pelo novo valor digitado
                setForm({ ...form, email: evento.target.value })
              }} />
          </div>
          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input className="form-control" type="password" value={form.senha} required
              onChange={function(evento) {
                // mesma lógica do email — copia tudo e substitui só a senha
                setForm({ ...form, senha: evento.target.value })
              }} />
          </div>
          {/* disabled={carregando} = desativo o botão enquanto aguardo o backend
              evito que o usuário clique duas vezes e envie o login duplicado */}
          <button className="btn btn-success w-100" disabled={carregando}>
            {/* ternário: mostro "Entrando..." durante o carregamento ou "Entrar" quando livre */}
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-muted mt-3 small">admin@enviro.com / admin123</p>
      </div>
    </div>
  )
}
