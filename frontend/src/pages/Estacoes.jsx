// Estacoes.jsx — CRUD de estações com tipos vinculados
// cada estação tem sua própria tabela com: Tipo, Medida (fator), Unidade

import { useState } from 'react'

// FORMULÁRIOS VAZIOS
// usados para limpar os campos ao abrir um modal novo
const Formulario_Vazio_Tipo = { nome: '', unidade: '', fator: 1, valor_offset: 0 }

// gera o próximo UID disponível no formato EST001, EST002...
function gerarUID(e) {
  const ids = e.map(x => parseInt(x.uid?.replace('EST', ''))).filter(Boolean)
  return `EST${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`
}

export default function Estacoes({ estacoes, parametros, tipos, ehAdmin, crud }) {
  // estacoes   = lista de estações do banco
  // parametros = JOIN entre parametros + tipos_parametro (traz nome_tipo, unidade, fator, valor_offset)
  // tipos      = lista de tipos disponíveis para vincular
  // ehAdmin    = true se o usuário for administrador — controla visibilidade dos botões
  // crud       = funções de salvar e deletar criadas no App.jsx

  // ESTADOS DO MODAL EM 2 ETAPAS
  // é um único modal — o estado "etapa" decide qual conteúdo renderizar
  // etapa = 1 => formulário de dados da estação aparece
  // etapa = 2 => lista de tipos com checkboxes aparece
  const [mostrarModal,       setMostrarModal]       = useState(false)
  const [etapa,              setEtapa]              = useState(1)
  const [idEditando,         setIdEditando]         = useState(null)
  // estacaoSalvaId = id gerado pelo banco ao salvar na etapa 1
  // preciso dele na etapa 2 para saber a qual estação vincular os tipos
  const [estacaoSalvaId,     setEstacaoSalvaId]     = useState(null)
  const [formularioEstacao,  setFormularioEstacao]  = useState({})

  // ESTADOS DO FORMULÁRIO DE NOVO TIPO INLINE
  // aparece quando o usuário clica em "Adicionar novo Tipo" dentro da etapa 2
  const [mostrarFormTipo,    setMostrarFormTipo]    = useState(false)
  const [formularioTipo,     setFormularioTipo]     = useState(Formulario_Vazio_Tipo)

  // ESTADOS DO PINCEL DE EDIÇÃO
  // idTipoEditando = id do tipo com o formulário aberto | null = nenhum aberto
  // só um pincel fica aberto por vez — idTipoEditando guarda apenas um valor
  const [idTipoEditando,     setIdTipoEditando]     = useState(null)
  const [formularioEditTipo, setFormularioEditTipo] = useState(Formulario_Vazio_Tipo)

  // ABRIR MODAL
  // se receber uma estação = modo edição: preenche o formulário com os dados dela
  // se receber null = modo criação: limpa tudo e gera UID automático
  function abrirModal(estacao) {
    if (estacao) {
      setIdEditando(estacao.id)
      setEstacaoSalvaId(estacao.id)
      setFormularioEstacao({ ...estacao }) // spread = copia todos os campos da estação
    } else {
      setIdEditando(null)
      setEstacaoSalvaId(null)
      // UID gerado automaticamente baseado no maior número existente
      setFormularioEstacao({
        nome: '', uid: gerarUID(estacoes), endereco: '',
        responsavel: '', lat: '', long: '', ativo: true
      })
    }
    // sempre começa na etapa 1 e com os formulários inline fechados
    setEtapa(1)
    setMostrarFormTipo(false)
    setIdTipoEditando(null)
    setFormularioTipo(Formulario_Vazio_Tipo)
    setMostrarModal(true)
  }

  // FECHAR MODAL — reseta tudo para o estado inicial
  function fecharModal() {
    setMostrarModal(false)
    setEtapa(1)
    setMostrarFormTipo(false)
    setIdTipoEditando(null)
  }

  // BOTÃO "PRÓXIMO"
  // salva a estação e avança o modal para a etapa 2
  async function salvarEtapa1(evento) {
    evento.preventDefault() // impede o HTML de recarregar a página ao submeter
    const resposta = await crud.salvarEstacaoComRetorno(idEditando, formularioEstacao)
    // se criou nova estação => pega o id do banco
    if (resposta && resposta.id) setEstacaoSalvaId(resposta.id)
    // se editou => usa o idEditando
    else if (idEditando)         setEstacaoSalvaId(idEditando)
    setEtapa(2) // troca o conteúdo do modal sem fechar
  }

  // VINCULAR/DESVINCULAR TIPO VIA CHECKBOX
  // marcou = cria um Parâmetro (Estação + Tipo) no banco
  // desmarcou = encontra o Parâmetro existente e deleta
  async function vincularTipo(tipoId, marcado) {
    const eId = estacaoSalvaId || idEditando
    if (marcado) {
      await crud.salvarParametro({ id_estacao: eId, id_tipo_parametro: tipoId })
    } else {
      // .find() percorre os parâmetros e retorna o primeiro que bate com estação + tipo
      const p = parametros.find(function(p) {
        return String(p.id_estacao)        === String(eId) &&
               String(p.id_tipo_parametro) === String(tipoId)
      })
      if (p) await crud.deletarParametro(p.id)
    }
  }

  // VERIFICAR SE TIPO JÁ ESTÁ VINCULADO
  // .some() retorna true se encontrar ao menos um parâmetro que bate com estação + tipo
  // define se o checkbox aparece marcado ou desmarcado na etapa 2
  function tipoVinculado(tipoId) {
    const eId = estacaoSalvaId || idEditando
    return parametros.some(function(p) {
      return String(p.id_estacao)        === String(eId) &&
             String(p.id_tipo_parametro) === String(tipoId)
    })
  }

  // CRIAR NOVO TIPO INLINE E JÁ VINCULAR
  // salvarTipoComRetorno cria o tipo e devolve o objeto com o id gerado pelo banco
  // com o id em mãos, já vinculo à estação automaticamente — sem o usuário marcar o checkbox
  async function salvarNovoTipo(evento) {
    evento.preventDefault()
    const novoTipo = await crud.salvarTipoComRetorno(formularioTipo)
    if (novoTipo && novoTipo.id) {
      const eId = estacaoSalvaId || idEditando
      if (eId) await crud.salvarParametro({ id_estacao: eId, id_tipo_parametro: novoTipo.id })
    }
    setFormularioTipo(Formulario_Vazio_Tipo) // limpa os campos inline
    setMostrarFormTipo(false)               // fecha o formulário inline
  }

  // SALVAR ALTERAÇÕES DO PINCEL
  // salva o tipo editado, fecha o pincel e recarrega os parâmetros
  // sem recarregarParametros, os novos valores não apareceriam na tabela da estação
  async function salvarEdicaoTipo(evento) {
    evento.preventDefault()
    await crud.salvarTipo(idTipoEditando, formularioEditTipo)
    setIdTipoEditando(null)           // fecha o pincel
    await crud.recarregarParametros() // atualiza a tabela com os novos valores
  }

  return (
    <div>

      {/* CABEÇALHO DA PÁGINA
          && = só mostra o botão se o usuário for admin */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-geo-alt me-2"></i>Estações</h4>
        {ehAdmin && (
          <button className="btn btn-success btn-sm"
            onClick={function() { abrirModal(null) }}>+ Nova Estação</button>
        )}
      </div>

      {/* AVISO DE LISTA VAZIA */}
      {estacoes.length === 0 && (
        <div className="alert alert-info">Nenhuma estação cadastrada.</div>
      )}

      {/* UMA TABELA POR ESTAÇÃO
          .map() percorre a lista e renderiza um bloco separado por estação */}
      {estacoes.map(function(estacao) {

        // filtra só os parâmetros desta estação
        const tiposVinculados = parametros.filter(function(p) {
          return String(p.id_estacao) === String(estacao.id)
        })

        return (
          <div key={estacao.id} className="mb-5">

            {/* NOME DA ESTAÇÃO + BADGE DE STATUS + BOTÕES DE AÇÃO
                badge verde = ativa | badge cinza = inativa
                botões só aparecem para admin */}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold fs-5">{estacao.nome}</span>
                <span className={'badge ' + (estacao.ativo ? 'bg-success' : 'bg-secondary')}>
                  {estacao.ativo ? 'Ativa' : 'Inativa'}
                </span>
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

            {/* DADOS DA ESTAÇÃO — cada campo só aparece se não estiver vazio no banco */}
            <p className="text-muted small mb-2">
              {estacao.endereco    && <span className="me-3"><i className="bi bi-pin-map me-1"></i>{estacao.endereco}</span>}
              {estacao.responsavel && <span className="me-3"><i className="bi bi-person me-1"></i>{estacao.responsavel}</span>}
              {(estacao.lat || estacao.long) && <span><i className="bi bi-geo me-1"></i>{estacao.lat} / {estacao.long}</span>}
            </p>

            {/* TABELA DE TIPOS VINCULADOS
                nome_tipo, unidade, fator e valor_offset vêm do JOIN no backend
                toFixed(0) = mostra sem casas decimais */}
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
                    {/* .map() = uma linha por tipo vinculado
                        ?? 1 e ?? 0 = valor padrão se o campo vier null do banco */}
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

      {/* MODAL ÚNICO COM 2 ETAPAS
          {etapa === 1 && ...} e {etapa === 2 && ...} nunca aparecem juntos
          setEtapa() troca o conteúdo interno sem fechar o modal */}
      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog"><div className="modal-content">

            {/* CABEÇALHO DO MODAL
                título e indicador de etapa mudam conforme o estado */}
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

            {/* ETAPA 1 — formulário com os dados da estação
                type="submit" aciona salvarEtapa1 => salva no banco => setEtapa(2) */}
            {etapa === 1 && (
              <form onSubmit={salvarEtapa1}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" required value={formularioEstacao.nome || ''}
                      onChange={function(e) { setFormularioEstacao({ ...formularioEstacao, nome: e.target.value }) }} />
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
                  {/* lat e long lado a lado com grid do Bootstrap */}
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
                  {/* checkbox Ativo — só aparece ao editar, não ao criar
                      ao criar, a estação já nasce ativa por padrão */}
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

            {/* ETAPA 2 — lista de tipos com checkboxes e pincel de edição
                só existe na tela quando etapa === 2 */}
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

                  {/* LISTA DE TIPOS COM CHECKBOX E PINCEL
                      .map() gera uma linha por tipo disponível no banco */}
                  {tipos.map(function(tipo) {
                    // esteEditando = true quando o pincel deste tipo está aberto
                    // cada tipo do .map() faz essa comparação individualmente
                    // por isso só um pincel fica expandido por vez
                    const esteEditando = idTipoEditando === tipo.id
                    return (
                      <div key={tipo.id} className="mb-2">

                        {/* LINHA DO TIPO: checkbox + nome/dados + botão lápis */}
                        <div className="d-flex align-items-center gap-2">
                          {/* checkbox — ao marcar/desmarcar chama vincularTipo() */}
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
                            // BOTÃO LÁPIS
                            // se esteEditando = true => fecha | false => abre e preenche o formulário
                            // ícone muda de lápis para X conforme o estado
                            <button type="button" className="btn btn-sm btn-outline-secondary"
                              onClick={function() {
                                if (esteEditando) {
                                  setIdTipoEditando(null)
                                } else {
                                  setIdTipoEditando(tipo.id)
                                  // preencho com os valores atuais para o usuário ver antes de editar
                                  setFormularioEditTipo({ nome: tipo.nome, unidade: tipo.unidade, fator: tipo.fator || 1, valor_offset: tipo.valor_offset || 0 })
                                }
                              }}>
                              <i className={'bi ' + (esteEditando ? 'bi-x' : 'bi-pencil')}></i>
                            </button>
                          )}
                        </div>

                        {/* FORMULÁRIO EXPANDIDO DO PINCEL
                            && = só aparece quando esteEditando for true
                            type="submit" aciona salvarEdicaoTipo => salva => fecha o pincel */}
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

                  {/* BOTÃO ADICIONAR NOVO TIPO
                      ! inverte o valor — se mostrarFormTipo for true vira false e vice-versa */}
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={function() { setMostrarFormTipo(!mostrarFormTipo) }}>
                    <i className="bi bi-plus me-1"></i>
                    {mostrarFormTipo ? 'Cancelar' : 'Adicionar novo Tipo'}
                  </button>

                  {/* FORMULÁRIO DE NOVO TIPO INLINE
                      ao submeter chama salvarNovoTipo => cria o tipo => já vincula => fecha o form */}
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

                {/* RODAPÉ DA ETAPA 2
                    Voltar = setEtapa(1) => modal volta para o formulário da estação
                    Concluir = fecha o modal */}
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