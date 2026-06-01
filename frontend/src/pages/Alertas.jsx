// Alertas.jsx — CRUD de alertas + historico de criticos do MongoDB

import { useState } from 'react'

const FORM_VAZIO = {
  id_estacao: '', id_parametro: '', severidade: 'info', mensagem: '', ativo: true
}

export default function Alertas({ alertas, estacoes, parametros, ehAdmin, crud, logsAlertas }) {

  const [mostrarModal,     setMostrarModal]     = useState(false)
  const [idAlertaEditando, setIdAlertaEditando] = useState(null)
  const [formulario,       setFormulario]       = useState(FORM_VAZIO)

  const parametrosDaEstacao = parametros.filter(function(p) {
    return String(p.id_estacao) === String(formulario.id_estacao)
  })

  const corDoBadge = {
    critico: 'bg-danger',
    aviso:   'bg-warning text-dark',
    info:    'bg-info text-dark'
  }

  function abrirNovo() {
    setIdAlertaEditando(null)
    setFormulario(FORM_VAZIO)
    setMostrarModal(true)
  }

  function abrirEditar(alerta) {
    setIdAlertaEditando(alerta.id)
    setFormulario({
      id_estacao:   alerta.id_estacao   || '',
      id_parametro: alerta.id_parametro || '',
      severidade:   alerta.severidade   || 'info',
      mensagem:     alerta.mensagem     || '',
      ativo:        alerta.ativo !== false
    })
    setMostrarModal(true)
  }

  async function salvar(e) {
    e.preventDefault()
    await crud.salvarAlerta(idAlertaEditando, formulario)
    setMostrarModal(false)
  }

  function campo(key, val) {
    setFormulario(function(prev) { return { ...prev, [key]: val } })
  }

  function formatarData(dataStr) {
    if (!dataStr) return '—'
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')
  }

  return (
    <div>

      {/* CABEÇALHO */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-bell me-2"></i>Alertas</h4>
        {ehAdmin && (
          <button className="btn btn-success btn-sm" onClick={abrirNovo}>
            + Novo Alerta
          </button>
        )}
      </div>

      {/* TABELA DE ALERTAS ATIVOS */}
      <div className="card mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Estação</th>
                <th>Parâmetro</th>
                <th>Severidade</th>
                <th>Mensagem</th>
                <th>Status</th>
                {ehAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {alertas.map(function(alerta) {
                return (
                  <tr key={alerta.id}>
                    <td>{alerta.nome_estacao}</td>
                    <td>{alerta.nome_parametro || '—'}</td>
                    <td>
                      <span className={'badge ' + (corDoBadge[alerta.severidade] || 'bg-secondary')}>
                        {alerta.severidade}
                      </span>
                    </td>
                    <td>{alerta.mensagem}</td>
                    <td>
                      <span className={'badge ' + (alerta.ativo ? 'bg-success' : 'bg-secondary')}>
                        {alerta.ativo ? 'Ativo' : 'Resolvido'}
                      </span>
                    </td>
                    {ehAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1"
                          onClick={function() { abrirEditar(alerta) }}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={function() { crud.deletarAlerta(alerta.id) }}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {alertas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    Nenhum alerta cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                {idAlertaEditando ? 'Editar Alerta' : 'Novo Alerta'}
              </h5>
              <button className="btn-close" onClick={function() { setMostrarModal(false) }} />
            </div>

            <form onSubmit={salvar}>
              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label">Estação *</label>
                  <select className="form-select" required value={formulario.id_estacao}
                    onChange={function(e) {
                      setFormulario(function(prev) {
                        return { ...prev, id_estacao: e.target.value, id_parametro: '' }
                      })
                    }}>
                    <option value="">Selecione a estação...</option>
                    {estacoes.map(function(e) {
                      return <option key={e.id} value={e.id}>{e.nome}</option>
                    })}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Parâmetro
                    <span className="text-muted small ms-2">(vincula ao monitoramento de Medições)</span>
                  </label>
                  <select className="form-select" value={formulario.id_parametro}
                    onChange={function(e) { campo('id_parametro', e.target.value) }}>
                    <option value="">Nenhum — alerta manual</option>
                    {parametrosDaEstacao.map(function(p) {
                      return (
                        <option key={p.id} value={p.id}>
                          {p.nome_tipo} ({p.unidade})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Severidade inicial *</label>
                  <select className="form-select" value={formulario.severidade}
                    onChange={function(e) { campo('severidade', e.target.value) }}>
                    <option value="info">Info</option>
                    <option value="aviso">Aviso</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mensagem *</label>
                  <div className="form-text mb-2">
                    Use palavras como <strong>quente, calor, frio, gelado, ventania, chuvoso, seco</strong> para que o receptor escale automaticamente para crítico quando o valor for extremo.
                  </div>
                  <textarea className="form-control" required rows={3}
                    value={formulario.mensagem}
                    onChange={function(e) { campo('mensagem', e.target.value) }} />
                </div>

                {idAlertaEditando && (
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      checked={formulario.ativo === true}
                      onChange={function(e) { campo('ativo', e.target.checked) }} />
                    <label className="form-check-label">Alerta ativo</label>
                  </div>
                )}

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary"
                  onClick={function() { setMostrarModal(false) }}>Cancelar</button>
                <button type="submit" className="btn btn-success">
                  {idAlertaEditando ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>

          </div></div>
        </div>
      )}

    </div>
  )
}