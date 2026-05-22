// Estacoes.jsx — CRUD de estações com tipos vinculados
// cada estação tem sua própria tabela com: Tipo, Medida (fator), Unidade

import { useState } from 'react'

// FORMULÁRIOS VAZIOS
const Formulario_Vazio_Estacao = { nome: '', uid: '', endereco: '', responsavel: '', lat: '', long: '', ativo: true }
const Formulario_Vazio_Tipo    = { nome: '', unidade: '', fator: 1, valor_offset: 0 }

export default function Estacoes({ estacoes, parametros, tipos, ehAdmin, crud }) {

  const [mostrarModal,       setMostrarModal]       = useState(false)
  const [etapa,              setEtapa]              = useState(1)
  const [idEditando,         setIdEditando]         = useState(null)
  const [estacaoSalvaId,     setEstacaoSalvaId]     = useState(null)
  const [formularioEstacao,  setFormularioEstacao]  = useState(Formulario_Vazio_Estacao)
  const [mostrarFormTipo,    setMostrarFormTipo]    = useState(false)
  const [formularioTipo,     setFormularioTipo]     = useState(Formulario_Vazio_Tipo)
  const [idTipoEditando,     setIdTipoEditando]     = useState(null)
  const [formularioEditTipo, setFormularioEditTipo] = useState(Formulario_Vazio_Tipo)

  function abrirModal(estacao) {
    if (estacao) {
      setIdEditando(estacao.id)
      setEstacaoSalvaId(estacao.id)
      setFormularioEstacao({ ...estacao })
    } else {
      setIdEditando(null)
      setEstacaoSalvaId(null)
      setFormularioEstacao(Formulario_Vazio_Estacao)
    }
    setEtapa(1)
    setMostrarFormTipo(false)
    setIdTipoEditando(null)
    setFormularioTipo(Formulario_Vazio_Tipo)
    setMostrarModal(true)
  }

  function fecharModal() {
    setMostrarModal(false)
    setEtapa(1)
    setMostrarFormTipo(false)
    setIdTipoEditando(null)
  }

  async function salvarEtapa1(evento) {
    evento.preventDefault()
    const resposta = await crud.salvarEstacaoComRetorno(idEditando, formularioEstacao)
    if (resposta && resposta.id) setEstacaoSalvaId(resposta.id)
    else if (idEditando)         setEstacaoSalvaId(idEditando)
    setEtapa(2)
  }

  async function vincularTipo(tipoId, marcado) {
    const eId = estacaoSalvaId || idEditando
    if (marcado) {
      await crud.salvarParametro({ id_estacao: eId, id_tipo_parametro: tipoId })
    } else {
      const p = parametros.find(function(p) {
        return String(p.id_estacao)        === String(eId) &&
               String(p.id_tipo_parametro) === String(tipoId)
      })
      if (p) await crud.deletarParametro(p.id)
    }
  }

  function tipoVinculado(tipoId) {
    const eId = estacaoSalvaId || idEditando
    return parametros.some(function(p) {
      return String(p.id_estacao)        === String(eId) &&
             String(p.id_tipo_parametro) === String(tipoId)
    })
  }

  async function salvarNovoTipo(evento) {
    evento.preventDefault()
    const novoTipo = await crud.salvarTipoComRetorno(formularioTipo)
    if (novoTipo && novoTipo.id) {
      const eId = estacaoSalvaId || idEditando
      if (eId) await crud.salvarParametro({ id_estacao: eId, id_tipo_parametro: novoTipo.id })
    }
    setFormularioTipo(Formulario_Vazio_Tipo)
    setMostrarFormTipo(false)
  }

  async function salvarEdicaoTipo(evento) {
    evento.preventDefault()
    await crud.salvarTipo(idTipoEditando, formularioEditTipo)
    setIdTipoEditando(null)
    await crud.recarregarParametros()
  }

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-geo-alt me-2"></i>Estações</h4>
        {ehAdmin && (
          <button className="btn btn-success btn-sm"
            onClick={function() { abrirModal(null) }}>+ Nova Estação</button>
        )}
      </div>

      {estacoes.length === 0 && (
        <div className="alert alert-info">Nenhuma estação cadastrada.</div>
      )}

      {estacoes.map(function(estacao) {
        const tiposVinculados = parametros.filter(function(p) {
          return String(p.id_estacao) === String(estacao.id)
        })

        return (
          <div key={estacao.id} className="mb-5">

            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold fs-5">{estacao.nome}</span>
                <span className={'badge ' + (estacao.ativo ? 'bg-success' : 'bg-secondary')}>
                  {estacao.ativo ? 'Ativa' : 'Inativa'}
                </span>
                {/* badge do UID — mostra o identificador IoT da estação */}
                {estacao.uid && (
                  <span className="badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: 11 }}>
                    <i className="bi bi-cpu me-1"></i>{estacao.uid}
                  </span>
                )}
              </div>
              {ehAdmin && (
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary"
                    onClick={function() { abrirModal(estacao) }}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger"
                    onClick={function() { crud.deletarEstacao(estacao.id) }}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              )}
            </div>

            <p className="text-muted small mb-2">
              {estacao.endereco    && <span className="me-3"><i className="bi bi-pin-map me-1"></i>{estacao.endereco}</span>}
              {estacao.responsavel && <span className="me-3"><i className="bi bi-person me-1"></i>{estacao.responsavel}</span>}
              {(estacao.lat || estacao.long) && <span><i className="bi bi-geo me-1"></i>{estacao.lat} / {estacao.long}</span>}
            </p>

            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tipo de Parâmetro</th>
                      <th>Medida (Fator)</th>
                      <th>Unidade</th>
                      <th>Offset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposVinculados.map(function(parametro) {
                      return (
                        <tr key={parametro.id}>
                          <td>{parametro.nome_tipo}</td>
                          <td>{Number(parametro.fator ?? 1).toFixed(0)}</td>
                          <td>{parametro.unidade}</td>
                          <td>{Number(parametro.valor_offset ?? 0).toFixed(0)}</td>
                        </tr>
                      )
                    })}
                    {tiposVinculados.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-2 small">
                          Nenhum tipo vinculado. Clique em Editar para vincular.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )
      })}

      {/* MODAL ÚNICO COM 2 ETAPAS */}
      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">

            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-0">
                  {idEditando ? 'Editar Estação' : 'Nova Estação'}
                </h5>
                <small className="text-muted">
                  {etapa === 1 ? 'Etapa 1 de 2 — Dados da estação' : 'Etapa 2 de 2 — Tipos de Parâmetro'}
                </small>
              </div>
              <button className="btn-close" onClick={fecharModal} />
            </div>

            {etapa === 1 && (
              <form onSubmit={salvarEtapa1}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" required value={formularioEstacao.nome}
                      onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, nome: e.target.value }) }} />
                  </div>

                  {/* CAMPO UID — identificador do dispositivo IoT */}
                  <div className="mb-3">
                    <label className="form-label">
                      UID do Dispositivo
                      <span className="text-muted ms-1 small">(ex: EST001 — usado pelo simulador Python)</span>
                    </label>
                    <input className="form-control" placeholder="Ex: EST001, EST002, EST003"
                      value={formularioEstacao.uid || ''}
                      onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, uid: e.target.value }) }} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Endereço</label>
                    <input className="form-control" value={formularioEstacao.endereco || ''}
                      onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, endereco: e.target.value }) }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Responsável</label>
                    <input className="form-control" value={formularioEstacao.responsavel || ''}
                      onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, responsavel: e.target.value }) }} />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label">Latitude</label>
                      <input className="form-control" placeholder="-23.5505" value={formularioEstacao.lat || ''}
                        onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, lat: e.target.value }) }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Longitude</label>
                      <input className="form-control" placeholder="-46.6333" value={formularioEstacao.long || ''}
                        onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, long: e.target.value }) }} />
                    </div>
                  </div>
                  {idEditando && (
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox"
                        checked={formularioEstacao.ativo || false}
                        onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, ativo: e.target.checked }) }} />
                      <label className="form-check-label">Estação ativa</label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
                  <button type="submit" className="btn btn-success">
                    Próximo <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </form>
            )}

            {etapa === 2 && (
              <div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Marque os tipos que esta estação irá monitorar.
                    Clique no lápis para editar nome, medida e unidade:
                  </p>

                  {tipos.length === 0 && (
                    <p className="text-muted small">Nenhum tipo cadastrado. Adicione um abaixo.</p>
                  )}

                  {tipos.map(function(tipo) {
                    const esteEditando = idTipoEditando === tipo.id
                    return (
                      <div key={tipo.id} className="mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <input className="form-check-input" type="checkbox"
                            checked={tipoVinculado(tipo.id)}
                            onChange={function(e) { vincularTipo(tipo.id, e.target.checked) }} />
                          <span className="flex-grow-1">
                            <span className="fw-semibold">{tipo.nome}</span>
                            <span className="text-muted ms-1 small">
                              — {tipo.unidade} · fator: {Number(tipo.fator ?? 1).toFixed(2)} · offset: {Number(tipo.valor_offset ?? 0).toFixed(2)}
                            </span>
                          </span>
                          {ehAdmin && (
                            <button type="button" className="btn btn-sm btn-outline-secondary"
                              onClick={function() {
                                if (esteEditando) {
                                  setIdTipoEditando(null)
                                } else {
                                  setIdTipoEditando(tipo.id)
                                  setFormularioEditTipo({ nome: tipo.nome, unidade: tipo.unidade, fator: tipo.fator || 1, valor_offset: tipo.valor_offset || 0 })
                                }
                              }}>
                              <i className={'bi ' + (esteEditando ? 'bi-x' : 'bi-pencil')}></i>
                            </button>
                          )}
                        </div>

                        {esteEditando && (
                          <form onSubmit={salvarEdicaoTipo} className="mt-2 ms-4 p-2 bg-light rounded">
                            <div className="row g-2 mb-2">
                              <div className="col">
                                <label className="form-label form-label-sm mb-1">Nome</label>
                                <input className="form-control form-control-sm" required
                                  value={formularioEditTipo.nome}
                                  onChange={function(e) { setFormularioEditTipo({ ...formularioEditTipo, nome: e.target.value }) }} />
                              </div>
                              <div className="col">
                                <label className="form-label form-label-sm mb-1">Unidade</label>
                                <input className="form-control form-control-sm" required
                                  value={formularioEditTipo.unidade}
                                  onChange={function(e) { setFormularioEditTipo({ ...formularioEditTipo, unidade: e.target.value }) }} />
                              </div>
                            </div>
                            <div className="row g-2 mb-2">
                              <div className="col">
                                <label className="form-label form-label-sm mb-1">Medida (Fator)</label>
                                <input type="number" step="1" className="form-control form-control-sm"
                                  value={formularioEditTipo.fator}
                                  onChange={function(e) { setFormularioEditTipo({ ...formularioEditTipo, fator: e.target.value }) }} />
                              </div>
                              <div className="col">
                                <label className="form-label form-label-sm mb-1">Offset</label>
                                <input type="number" step="1" className="form-control form-control-sm"
                                  value={formularioEditTipo.valor_offset}
                                  onChange={function(e) { setFormularioEditTipo({ ...formularioEditTipo, valor_offset: e.target.value }) }} />
                              </div>
                            </div>
                            <button type="submit" className="btn btn-success btn-sm">
                              <i className="bi bi-check me-1"></i>Salvar alterações
                            </button>
                          </form>
                        )}
                      </div>
                    )
                  })}

                  <hr />

                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={function() { setMostrarFormTipo(!mostrarFormTipo) }}>
                    <i className="bi bi-plus me-1"></i>
                    {mostrarFormTipo ? 'Cancelar' : 'Adicionar novo Tipo'}
                  </button>

                  {mostrarFormTipo && (
                    <form onSubmit={salvarNovoTipo} className="mt-3 p-3 bg-light rounded">
                      <p className="fw-semibold small mb-2">Novo Tipo de Parâmetro</p>
                      <div className="row g-2 mb-2">
                        <div className="col">
                          <label className="form-label form-label-sm mb-1">Nome *</label>
                          <input className="form-control form-control-sm" required
                            placeholder="Ex: Temperatura"
                            value={formularioTipo.nome}
                            onChange={function(e) { setFormularioTipo({ ...formularioTipo, nome: e.target.value }) }} />
                        </div>
                        <div className="col">
                          <label className="form-label form-label-sm mb-1">Unidade *</label>
                          <input className="form-control form-control-sm" required
                            placeholder="Ex: graus C"
                            value={formularioTipo.unidade}
                            onChange={function(e) { setFormularioTipo({ ...formularioTipo, unidade: e.target.value }) }} />
                        </div>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col">
                          <label className="form-label form-label-sm mb-1">Medida (Fator)</label>
                          <input type="number" step="0.0001" className="form-control form-control-sm"
                            placeholder="Padrão: 1"
                            value={formularioTipo.fator}
                            onChange={function(e) { setFormularioTipo({ ...formularioTipo, fator: e.target.value }) }} />
                        </div>
                        <div className="col">
                          <label className="form-label form-label-sm mb-1">Offset</label>
                          <input type="number" step="0.0001" className="form-control form-control-sm"
                            placeholder="Padrão: 0"
                            value={formularioTipo.valor_offset}
                            onChange={function(e) { setFormularioTipo({ ...formularioTipo, valor_offset: e.target.value }) }} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-success btn-sm">
                        <i className="bi bi-check me-1"></i>Criar e vincular
                      </button>
                    </form>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary"
                    onClick={function() { setEtapa(1) }}>
                    <i className="bi bi-arrow-left me-1"></i> Voltar
                  </button>
                  <button type="button" className="btn btn-success" onClick={fecharModal}>
                    <i className="bi bi-check me-1"></i> Concluir
                  </button>
                </div>
              </div>
            )}

          </div></div>
        </div>
      )}
    </div>
  )
}
