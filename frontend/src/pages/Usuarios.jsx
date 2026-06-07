import { useState } from 'react'

const Formulario_Vazio_Para_Modal = { nome: '', email: '', senha: '', nivel: 'publico' }

export default function Usuarios({ usuarios, usuarioLogado, crud }) {

  const [mostrarModal,      setMostrarModal]      = useState(false)
  const [idUsuarioEditando, setIdUsuarioEditando] = useState(null)
  const [formulario,        setFormulario]        = useState(Formulario_Vazio_Para_Modal)

  if (usuarioLogado.nivel !== 'admin') {
    return <div className="alert alert-warning">Acesso restrito a administradores.</div>
  }

  async function salvar(evento) {
    evento.preventDefault()
    await crud.salvarUsuario(idUsuarioEditando, formulario)
    setMostrarModal(false)
  }

  async function deletar(id) {
    if (id === 1)                return alert('O Administrador principal não pode ser deletado!')
    if (id === usuarioLogado.id) return alert('Você não pode deletar seu próprio usuário!')
    await crud.deletarUsuario(id)
  }

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-person me-2"></i>Usuários</h4>
        <button className="btn btn-success btn-sm" onClick={function() {
          setIdUsuarioEditando(null)
          setFormulario(Formulario_Vazio_Para_Modal)
          setMostrarModal(true)
        }}>+ Novo Usuário</button>
      </div>

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
                      <span className={'badge ' + (usuario.nivel === 'admin' ? 'bg-warning text-dark' : 'bg-secondary')}>
                        {usuario.nivel === 'admin' ? 'Administrador' : 'Público'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={function() {
                        setIdUsuarioEditando(usuario.id)
                        setFormulario({ nome: usuario.nome, email: usuario.email, senha: '', nivel: usuario.nivel })
                        setMostrarModal(true)
                      }}><i className="bi bi-pencil"></i></button>
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

      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{idUsuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h5>
              <button className="btn-close" onClick={function() { setMostrarModal(false) }} />
            </div>

            {/* começo do formulário */}
            <form onSubmit={salvar}>
              <div className="modal-body">

                {/* campo nome: texto obrigatório */}
                <div className="mb-3">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" required value={formulario.nome}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, nome: evento.target.value })
                    }} />
                </div>

                {/* campo email: type email valida o formato automaticamente */}
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" required value={formulario.email}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, email: evento.target.value })
                    }} />
                </div>

                {/* campo senha: fica vazio ao editar para não exibir a senha atual */}
                <div className="mb-3">
                  <label className="form-label">Senha</label>
                  <input type="password" className="form-control" value={formulario.senha}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, senha: evento.target.value })
                    }} />
                </div>

                {/* campo nível: select fixo com duas opções */}
                <div className="mb-3">
                  <label className="form-label">Nível de Acesso</label>
                  <select className="form-select" value={formulario.nivel}
                    onChange={function(evento) {
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
            {/* fim do formulário */}

          </div></div>
        </div>
      )}

    </div>
  )
}