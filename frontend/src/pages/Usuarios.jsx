// Usuarios.jsx — aqui gerencio o CRUD de usuários
//
// REGRAS DE ACESSO:
// só administradores acessam esta página — público vê uma mensagem de bloqueio
// o usuário com id=1 (admin principal) nunca pode ser deletado
// o usuário logado não pode deletar a si mesmo
//
// DADOS QUE RECEBO DO BACKEND (chegam via props do App.jsx):
// usuarios      = lista da tabela usuarios do PostgreSQL
// usuarioLogado = objeto do usuário atual { id, nome, email, nivel }
// crud          = objeto com as funções salvarUsuario e deletarUsuario

import { useState } from 'react'

// FORMULÁRIO VAZIO
// uso para limpar o modal ao abrir Novo Usuário
// nivel começa como 'publico' pois é o nível padrão ao criar
const Formulario_Vazio_Para_Modal = { nome: '', email: '', senha: '', nivel: 'publico' }

export default function Usuarios({ usuarios, usuarioLogado, crud }) {

  // ESTADOS DO COMPONENTE
  const [mostrarModal,      setMostrarModal]      = useState(false)
  // idUsuarioEditando = guarda o id do usuário que estou editando | null = criando novo
  const [idUsuarioEditando, setIdUsuarioEditando] = useState(null)
  const [formulario,        setFormulario]        = useState(Formulario_Vazio_Para_Modal)

  // PROTEÇÃO DA PÁGINA
  // se o nível do usuário não for admin, mostro só uma mensagem e paro aqui
  // o resto da página não é renderizado
  if (usuarioLogado.nivel !== 'admin') {
    return <div className="alert alert-warning">Acesso restrito a administradores.</div>
  }

  // FUNÇÃO DE SALVAR
  async function salvar(evento) {
    evento.preventDefault()
    // passo idUsuarioEditando — se tiver valor faz PUT (editar), se for null faz POST (criar)
    await crud.salvarUsuario(idUsuarioEditando, formulario)
    setMostrarModal(false)
  }

  // FUNÇÃO DE DELETAR COM PROTEÇÕES
  async function deletar(id) {
    // && = só executo o return se a condição for verdadeira — bloqueia a deleção
    if (id === 1)                return alert('O Administrador principal não pode ser deletado!')
    if (id === usuarioLogado.id) return alert('Você não pode deletar seu próprio usuário!')
    await crud.deletarUsuario(id)
  }

  return (
    <div>

      {/* CABEÇALHO DA PÁGINA
          não uso && aqui pois todos os admins veem o botão Novo Usuário */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-person me-2"></i>Usuários</h4>
        <button className="btn btn-success btn-sm" onClick={function() {
          // limpo o formulário e abro o modal ao clicar em Novo Usuário
          setIdUsuarioEditando(null)
          setFormulario(Formulario_Vazio_Para_Modal)
          setMostrarModal(true)
        }}>+ Novo Usuário</button>
      </div>

      {/* TABELA DE USUÁRIOS
          Array.isArray() verifica se usuarios é um array antes de chamar .map()
          evito assim erro de crash se o backend retornar null em vez de array */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>Nome</th><th>Email</th><th>Nível</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {Array.isArray(usuarios) && usuarios.map(function(usuario) {
                return (
                  <tr key={usuario.id}>
                    <td>{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td>
                      {/* badge de nível — amarelo para admin, cinza para público
                          operador ternário define a classe e o texto conforme o nível */}
                      <span className={'badge ' + (usuario.nivel === 'admin' ? 'bg-warning text-dark' : 'bg-secondary')}>
                        {usuario.nivel === 'admin' ? 'Administrador' : 'Público'}
                      </span>
                    </td>
                    <td>
                      {/* botão editar — copio os dados para o formulário
                          deixo a senha vazia por segurança — nunca exibo a senha atual */}
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={function() {
                        setIdUsuarioEditando(usuario.id)
                        setFormulario({ nome: usuario.nome, email: usuario.email, senha: '', nivel: usuario.nivel })
                        setMostrarModal(true)
                      }}><i className="bi bi-pencil"></i></button>
                      {/* botão deletar — disabled bloqueia para o admin principal e para si mesmo */}
                      <button className="btn btn-sm btn-outline-danger"
                        onClick={function() { deletar(usuario.id) }}
                        disabled={usuario.id === 1 || usuario.id === usuarioLogado.id}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {(!Array.isArray(usuarios) || usuarios.length === 0) && (
                <tr><td colSpan={4} className="text-center text-muted py-3">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE USUÁRIO
          && = só renderizo o modal se mostrarModal for true */}
      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              {/* ternário: mudo o título conforme estou editando ou criando */}
              <h5 className="modal-title">{idUsuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h5>
              <button className="btn-close" onClick={function() { setMostrarModal(false) }} />
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" required value={formulario.nome}
                    onChange={function(evento) {
                      // spread = copia todos os campos e substitui só o nome
                      setFormulario({ ...formulario, nome: evento.target.value })
                    }} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" required value={formulario.email}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, email: evento.target.value })
                    }} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Senha</label>
                  {/* ao editar, deixo a senha em branco — se o admin não preencher, mantém a atual */}
                  <input type="password" className="form-control" value={formulario.senha}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, senha: evento.target.value })
                    }} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nível de Acesso</label>
                  <select className="form-select" value={formulario.nivel}
                    onChange={function(evento) {
                      // evento.target.value = 'publico' ou 'admin' conforme a opção escolhida
                      setFormulario({ ...formulario, nivel: evento.target.value })
                    }}>
                    <option value="publico">Público — apenas leitura</option>
                    <option value="admin">Administrador — acesso total</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary"
                  onClick={function() { setMostrarModal(false) }}>Cancelar</button>
                <button type="submit" className="btn btn-success">Salvar</button>
              </div>
            </form>
          </div></div>
        </div>
      )}

    </div>
  )
}
