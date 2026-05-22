// Alertas.jsx — aqui gerencio o CRUD completo de alertas
//
// O que liga as páginas:
// uso estacoes (criadas em Estacoes.jsx) para vincular cada alerta a uma estação
// uso parametros (criados em Parametros.jsx) opcionalmente — o alerta pode ou não ter um parâmetro
//
// DADOS QUE RECEBO DO BACKEND (chegam via props do App.jsx):
// alertas    = lista com JOIN entre alertas + estacoes + parametros + tipos_parametro
//              isso significa que cada alerta já vem com nome_estacao e nome_parametro prontos
// estacoes   = lista de estações — uso no select do modal para o usuário escolher
// parametros = lista de parâmetros — filtro por estação antes de mostrar no select
// ehAdmin    = true se o usuário logado for administrador — controla quem vê os botões
// crud       = objeto com as funções salvarAlerta e deletarAlerta, criadas no App.jsx

import { useState } from 'react'
// useState = importo do React para guardar valores que mudam na tela

// FORMULÁRIO VAZIO
// uso isso para limpar o modal quando o usuário clica em Novo Alerta
// severidade começa como 'aviso' e ativo começa como true por padrão
const Formulario_Vazio_Para_Modal = { id_estacao: '', id_parametro: '', severidade: 'aviso', mensagem: '', ativo: true }

export default function Alertas({ alertas, estacoes, parametros, ehAdmin, crud }) {
  // export default = exporto este componente para que o App.jsx possa importá-lo

  // ESTADOS DO COMPONENTE
  // mostrarModal = controla se o modal está visível ou não na tela
  const [mostrarModal,     setMostrarModal]     = useState(false)
  // idAlertaEditando = guarda o id do alerta que estou editando | null = estou criando novo
  const [idAlertaEditando, setIdAlertaEditando] = useState(null)
  // formulario = guarda os valores digitados nos campos do modal
  const [formulario,       setFormulario]       = useState(Formulario_Vazio_Para_Modal)

  // FILTRO DE PARÂMETROS POR ESTAÇÃO
  // quando o usuário escolhe uma estação no modal, filtro os parâmetros para mostrar só os dela
  // uso .filter() para percorrer a lista e retornar só os que pertencem à estação selecionada
  // uso String() nos dois lados porque o banco retorna número (1) mas o select retorna texto ('1')
  // sem o String(), '1' !== 1 e o filtro nunca encontraria nada
  const parametrosDaEstacao = parametros.filter(function(parametro) {
    return String(parametro.id_estacao) === String(formulario.id_estacao)
  })

  // CORES DOS BADGES DE SEVERIDADE
  // crio um objeto que mapeia cada severidade para uma classe de cor do Bootstrap
  // uso assim: corDoBadge['critico'] → 'bg-danger' → Bootstrap pinta o badge de vermelho
  // critico = vermelho | aviso = amarelo | info = azul
  const corDoBadge = { critico: 'bg-danger', aviso: 'bg-warning text-dark', info: 'bg-info text-dark' }

  // FUNÇÃO DE SALVAR
  // chamo quando o usuário submete o formulário (clica em Criar/Salvar ou aperta Enter)
  async function salvar(evento) {
    // preventDefault() impede o comportamento padrão do HTML que recarregaria a página
    evento.preventDefault()
    // passo idAlertaEditando para o crud — se tiver valor faz PUT (editar), se for null faz POST (criar)
    await crud.salvarAlerta(idAlertaEditando, formulario)
    // fecho o modal após salvar
    setMostrarModal(false)
  }

  return (
    <div>

      {/* CABEÇALHO DA PÁGINA
          mostro o título e o botão de novo alerta lado a lado
          && = só mostro o botão se o usuário for admin — público só lê */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-bell me-2"></i>Alertas</h4>
        {ehAdmin && (
          <button className="btn btn-success btn-sm" onClick={function() {
            // limpo o formulário e abro o modal ao clicar em Novo Alerta
            setFormulario(Formulario_Vazio_Para_Modal)
            setMostrarModal(true)
          }}>+ Novo Alerta</button>
        )}
      </div>

      {/* TABELA DE ALERTAS
          uso .map() para transformar cada alerta em uma linha da tabela
          key={alerta.id} é obrigatório no React — identifica cada linha de forma única
          nome_estacao e nome_parametro já vêm prontos do JOIN feito no backend */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Estação</th><th>Parâmetro</th><th>Severidade</th>
                <th>Mensagem</th><th>Status</th>
                {/* && = só mostro a coluna Ações se o usuário for admin */}
                {ehAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {alertas.map(function(alerta) {
                return (
                  <tr key={alerta.id}>
                    {/* nome_estacao vem do JOIN com a tabela estacoes no backend */}
                    <td>{alerta.nome_estacao}</td>
                    {/* || '—' = se nome_parametro for null ou vazio, mostro um traço */}
                    <td>{alerta.nome_parametro || '—'}</td>
                    <td>
                      {/* uso corDoBadge[alerta.severidade] para pegar a classe Bootstrap correta
                          a classe 'badge' do Bootstrap é quem cria o botãozinho colorido arredondado */}
                      <span className={'badge ' + (corDoBadge[alerta.severidade] || 'bg-secondary')}>
                        {alerta.severidade}
                      </span>
                    </td>
                    <td>{alerta.mensagem}</td>
                    <td>
                      {/* badge Ativo/Resolvido — verde se ativo for true, cinza se for false
                          operador ternário: condição ? valor_se_verdadeiro : valor_se_falso */}
                      <span className={'badge ' + (alerta.ativo ? 'bg-success' : 'bg-secondary')}>
                        {alerta.ativo ? 'Ativo' : 'Resolvido'}
                      </span>
                    </td>
                    {ehAdmin && (
                      <td>
                        {/* botão editar — ao clicar, copio os dados do alerta para o formulário
                            spread operator {...alerta} = copia todos os campos do alerta de uma vez */}
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={function() {
                          setIdAlertaEditando(alerta.id)
                          setFormulario({ ...alerta })
                          setMostrarModal(true)
                        }}><i className="bi bi-pencil"></i></button>
                        {/* botão deletar — chamo crud.deletarAlerta passando o id do alerta */}
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={function() { crud.deletarAlerta(alerta.id) }}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {/* se a lista estiver vazia, mostro uma mensagem no lugar da tabela */}
              {alertas.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-3">Nenhum alerta cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ALERTA
          && = só renderizo o modal se mostrarModal for true
          quando mostrarModal é false, o modal não existe na tela */}
      {mostrarModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          {/* modal d-block = forço o Bootstrap a mostrar o modal
              o fundo escuro semitransparente aparece por trás do modal */}
          <div className="modal-dialog"><div className="modal-content">

            {/* CABEÇALHO DO MODAL
                mudo o título conforme estou criando ou editando */}
            <div className="modal-header">
              <h5 className="modal-title">
                {/* ternário: se idAlertaEditando tiver valor = editando | se for null = criando */}
                {idAlertaEditando ? 'Editar Alerta' : 'Novo Alerta'}
              </h5>
              {/* btn-close = botão X do Bootstrap para fechar o modal */}
              <button className="btn-close" onClick={function() { setMostrarModal(false) }} />
            </div>

            {/* FORMULÁRIO DO MODAL
                onSubmit chama minha função salvar() ao clicar em Criar/Salvar ou apertar Enter */}
            <form onSubmit={salvar}>
              <div className="modal-body">

                {/* CAMPO: ESTAÇÃO
                    required = o HTML bloqueia o submit se este campo estiver vazio
                    ao trocar a estação, limpo o parâmetro selecionado
                    evito assim enviar um parâmetro de outra estação */}
                <div className="mb-3">
                  <label className="form-label">Estação *</label>
                  <select className="form-select" required value={formulario.id_estacao}
                    onChange={function(evento) {
                      // evento = o que aconteceu (usuário escolheu uma opção)
                      // evento.target = o select onde escolheu
                      // evento.target.value = o id da estação selecionada
                      // spread {...formulario} = copia todos os campos do formulário
                      // substituo id_estacao pelo novo valor e limpo id_parametro
                      setFormulario({ ...formulario, id_estacao: evento.target.value, id_parametro: '' })
                    }}>
                    <option value="">Selecione a estação...</option>
                    {/* .map() gera uma opção para cada estação vinda do backend
                        key={estacao.id} obrigatório no React | value={estacao.id} é o que envio ao backend */}
                    {estacoes.map(function(estacao) {
                      return <option key={estacao.id} value={estacao.id}>{estacao.nome}</option>
                    })}
                  </select>
                </div>

                {/* CAMPO: PARÂMETRO (opcional)
                    uso parametrosDaEstacao — lista já filtrada pelo .filter() no topo
                    só aparecem os parâmetros da estação selecionada acima */}
                <div className="mb-3">
                  <label className="form-label">Parâmetro (opcional)</label>
                  <select className="form-select" value={formulario.id_parametro}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, id_parametro: evento.target.value })
                    }}>
                    <option value="">Nenhum</option>
                    {parametrosDaEstacao.map(function(parametro) {
                      return (
                        <option key={parametro.id} value={parametro.id}>
                          {parametro.nome_tipo} ({parametro.unidade})
                          {/* && = só adiciono o nome personalizado se ele existir */}
                          {parametro.nome ? ' — ' + parametro.nome : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* CAMPO: SEVERIDADE
                    a opção escolhida aqui define a cor do badge na tabela
                    o objeto corDoBadge lá em cima mapeia cada valor para uma cor */}
                <div className="mb-3">
                  <label className="form-label">Severidade *</label>
                  <select className="form-select" value={formulario.severidade}
                    onChange={function(evento) {
                      setFormulario({ ...formulario, severidade: evento.target.value })
                    }}>
                    <option value="info">Info</option>
                    <option value="aviso">Aviso</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>

                {/* CAMPO: MENSAGEM
                    textarea = caixa de texto com múltiplas linhas
                    rows={3} = mostro 3 linhas de altura inicial */}
                <div className="mb-3">
                  <label className="form-label">Mensagem *</label>
                  <textarea className="form-control" required rows={3} value={formulario.mensagem}
                    onChange={function(evento) {
                      // evento.target.value = o texto que o usuário está digitando
                      setFormulario({ ...formulario, mensagem: evento.target.value })
                    }} />
                </div>

                {/* CHECKBOX: ATIVO
                    && = só mostro ao editar — ao criar, o alerta começa ativo por padrão
                    formulario.ativo !== false = se ativo for true ou undefined, deixo marcado */}
                {idAlertaEditando && (
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      checked={formulario.ativo === true}
                      onChange={function(evento) {
                        // evento.target.checked = true se marquei, false se desmarquei
                        setFormulario({ ...formulario, ativo: evento.target.checked })
                      }} />
                    <label className="form-check-label">Alerta ativo</label>
                  </div>
                )}

              </div>

              {/* BOTÕES DO MODAL
                  type="button" = não aciona o submit — só fecha o modal
                  type="submit"  = aciona o onSubmit do form, que chama minha função salvar() */}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary"
                  onClick={function() { setMostrarModal(false) }}>Cancelar</button>
                <button type="submit" className="btn btn-success">
                  {/* ternário: mostro "Salvar" ao editar ou "Criar" ao criar novo */}
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
