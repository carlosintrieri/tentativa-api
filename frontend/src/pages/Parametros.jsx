import { useState } from 'react'

const Formulario_Vazio_Para_Modal = { nome: '', unidade: '', fator: 1, valor_offset: 0 }

export default function Parametros({ tipos, ehAdmin, crud }) {

  const [mostrarModal, setMostrarModal] = useState(false)
  const [idEditando,   setIdEditando]   = useState(null)
  const [formulario,   setFormulario]   = useState(Formulario_Vazio_Para_Modal)

  async function salvar(evento) {
    evento.preventDefault()
    await crud.salvarTipo(idEditando, formulario)
    setMostrarModal(false)
  }

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-thermometer me-2"></i>Tipos de Parâmetro</h4>
        {ehAdmin && (
          <button className="btn btn-success btn-sm" onClick={function() {
            setIdEditando(null)
            setFormulario(Formulario_Vazio_Para_Modal)
            setMostrarModal(true)
          }}>+ Novo Tipo</button>
        )}
      </div>

      <p className="text-muted small mb-3">
        Os tipos cadastrados aqui ficam disponíveis para vincular às Estações.
      </p>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nome</th><th>Unidade</th><th>Fator</th><th>Offset</th>
                {ehAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {tipos.map(function(tipo) {
                return (
                  <tr key={tipo.id}>
                    <td>{tipo.nome}</td>
                    <td>{tipo.unidade}</td>
                    <td>{Number(tipo.fator ?? 1).toFixed(2)}</td>
                    <td>{Number(tipo.valor_offset ?? 0).toFixed(2)}</td>
                    {ehAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1"
                          onClick={function() {
                            setIdEditando(tipo.id)
                            setFormulario({ ...tipo })
                            setMostrarModal(true)
                          }}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={function() { crud.deletarTipo(tipo.id) }}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {tipos.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-3">
                  Nenhum tipo cadastrado. Clique em Novo Tipo.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{idEditando ? 'Editar Tipo' : 'Novo Tipo'}</h5>
              <button className="btn-close" onClick={function() { setMostrarModal(false) }} />
            </div>

            {/* começo do formulário */}
            <form onSubmit={salvar}>
              <div className="modal-body">

                {/* campo nome: texto livre obrigatório */}
                <div className="mb-3">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" required placeholder="Ex: Temperatura do Rio"
                    value={formulario.nome}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, nome: evento.target.value })
                    }} />
                </div>

                {/* campo unidade: texto livre obrigatório */}
                <div className="mb-3">
                  <label className="form-label">Unidade *</label>
                  <input className="form-control" required placeholder="Ex: °C, %, hPa, mm, km/h"
                    value={formulario.unidade}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, unidade: evento.target.value })
                    }} />
                </div>

                {/* campos fator e offset lado a lado */}
                {/* fator multiplica o valor bruto do sensor */}
                {/* offset soma ao resultado após o fator */}
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label">Fator</label>
                    <input type="number" step="0.0001" className="form-control"
                      value={formulario.fator}
                      onChange={function(evento) {
                        setFormulario({ ...formulario, fator: evento.target.value })
                      }} />
                  </div>
                  <div className="col">
                    <label className="form-label">Offset</label>
                    <input type="number" step="0.0001" className="form-control"
                      value={formulario.valor_offset}
                      onChange={function(evento) {
                        setFormulario({ ...formulario, valor_offset: evento.target.value })
                      }} />
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary"
                  onClick={function() { setMostrarModal(false) }}>Cancelar</button>
                <button type="submit" className="btn btn-success">
                  {idEditando ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
            {/* fim do formulário */}

          </div></div>
        </div>
      )}

    </div>
  )
}