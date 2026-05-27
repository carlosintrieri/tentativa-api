// Medicoes.jsx — exibe as leituras recebidas via MQTT em tempo real

import { useState, useEffect } from 'react'

const CINCO_MINUTOS = 5 * 60 * 1000

export default function Medicoes({ medicoes, estacoes }) {

  const [filtroEstacao,     setFiltroEstacao]     = useState('')
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date())
  const [proximaLimpeza,    setProximaLimpeza]    = useState(CINCO_MINUTOS / 1000)
  const [historicoLocal,    setHistoricoLocal]    = useState([])

  // atualiza historico e relogio sempre que chegam medicoes novas do App.jsx
  useEffect(function() {
    setHistoricoLocal(medicoes)
    setUltimaAtualizacao(new Date())
  }, [medicoes])

  // decrementa 1 segundo a cada tick — sincronizado com a limpeza abaixo
// cria um contador regressivo que decrementa 1 segundo a cada tick
// alimenta o temporizador visual "Limpeza em 4:59" no cabeçalho
useEffect(function() {

  // setInterval dispara a função a cada 1000ms (1 segundo)
  const contador = setInterval(function() {

    // atualiza o estado proximaLimpeza usando o valor anterior (time)
    setProximaLimpeza(function(time) {
      if (time <= 1) return CINCO_MINUTOS / 1000  // chegou a 0 → reinicia em 300 segundos
      return time - 1                              // ainda tem tempo → diminui 1 segundo
    })

  }, 1000)

  // quando o componente for desmontado, para o intervalo
  // evita que o contador continue rodando em background desnecessariamente
  return function() { clearInterval(contador) }

}, []) // [] = executa só uma vez quando o componente monta

  // a cada 5 minutos zera o historico exibido na tela
  useEffect(function() {
    const limpeza = setInterval(function() {
      setHistoricoLocal([]) // zera com array vazia o valor do timer!!
      setProximaLimpeza(CINCO_MINUTOS / 1000)
    }, CINCO_MINUTOS)
    return function() { clearInterval(limpeza) } // a função clearInterval limpa o timer em 5min
  }, [])

  // formata segundos para mm:ss
  function formatarContador(segundos) {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // aplica filtro de estação historico local
  const medicoesFiltradas = filtroEstacao
    ? historicoLocal.filter(function(m) { return String(m.id_estacao) === String(filtroEstacao) })
    : historicoLocal

  // formata timestamp do banco para dd/mm/aaaa hh:mm:ss
  function formatarData(dataStr) {
    if (!dataStr) return '—'
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')
  }

  // retorna classe CSS Bootstrap de cor baseada no tipo e valor do parametro
  // reconhece o tipo pela palavra contida no nome: "Temperatura Infernal" vira temperatura
  function corDoValor(nomeParam, valor) {
    if (!nomeParam || valor === null || valor === undefined) return ''
    const v = Number(valor)
    const n = nomeParam.toLowerCase()
    if (n.includes('temperatura')) {
      if (v > 38) return 'text-danger fw-bold'   // vermelho acima do limite
      if (v < 5)  return 'text-primary fw-bold'  // azul abaixo do limite
      return 'text-success'                       // verde normal
    }
    if (n.includes('umidade')) {
      if (v > 90) return 'text-danger fw-bold'
      if (v < 20) return 'text-warning fw-bold'  // amarelo abaixo do limite
      return 'text-success'
    }
    if (n.includes('pressao') || n.includes('pressão')) {
      if (v > 1030 || v < 980) return 'text-danger fw-bold'
      return 'text-success'
    }
    if (n.includes('chuva')) {
      if (v > 60) return 'text-danger fw-bold'
      return 'text-primary'
    }
    if (n.includes('vento')) {
      if (v > 90) return 'text-danger fw-bold'
      return 'text-success'
    }
    return 'text-secondary'
  }

  // nomeParam é o parâmetro com seu nome!

  // retorna icone Bootstrap Icons correto para cada tipo de parametro
  function iconePorParametro(nomeParam) {
    if (!nomeParam) return 'bi-activity'
    const n = nomeParam.toLowerCase()
    if (n.includes('temperatura')) return 'bi-thermometer-half'
    if (n.includes('umidade'))     return 'bi-droplet-half'
    if (n.includes('pressao') || n.includes('pressão')) return 'bi-speedometer2'
    if (n.includes('chuva'))       return 'bi-cloud-rain'
    if (n.includes('vento'))       return 'bi-wind'
    return 'bi-activity'
  }

  // retorna unidade correta: usa a do banco ou deduz pelo nome
  function unidadePorParametro(nomeParam, unidade) {
    if (unidade) return unidade
    if (!nomeParam) return ''
    const n = nomeParam.toLowerCase()
    if (n.includes('temperatura')) return '°C'
    if (n.includes('umidade'))     return '%'
    if (n.includes('pressao'))     return 'hPa'
    if (n.includes('chuva'))       return 'mm'
    if (n.includes('vento'))       return 'km/h'
    return ''
  }

  // retorna a ultima medicao de cada parametro de uma estacao
  // percorre o historico e pega a primeira ocorrencia de cada parametro
  // resultado: array com um item por parametro — popula os cards
  function ultimasPorEstacao(idEstacao) {
    const vistos    = {}
    const resultado = []
    const medicoesDaEstacao = historicoLocal.filter(function(m) {
      return String(m.id_estacao) === String(idEstacao)
    })
    for (const m of medicoesDaEstacao) {
      const chave = m.nome_parametro || 'Desconhecido'
      if (!vistos[chave]) {
        vistos[chave] = true
        resultado.push(m)
      }
    }
    return resultado
  }

  return (
    <div>

      {/* cabecalho com relogio e contador regressivo */}
      {/* d-flex justify-content-between: titulo a esq, info a dir */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          <i className="bi bi-broadcast me-2"></i>Medições em Tempo Real
        </h4>
        <div className="d-flex align-items-center gap-3">
          {/* relogio: atualiza toda vez que chegam medicoes novas */}
          <span className="text-muted small">
            <i className="bi bi-clock me-1"></i>
            Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          </span>
          {/* temporizador: conta regressiva ate a proxima limpeza */}
          <span className="text-muted small" title="Próxima limpeza do histórico">
            <i className="bi bi-trash me-1"></i>
            Limpeza em {formatarContador(proximaLimpeza)}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {/* select para filtrar por estacao — vazio exibe todas */}
      <div className="mb-3" style={{ maxWidth: 300 }}>
        <select
          className="form-select form-select-sm"
          value={filtroEstacao}
          onChange={function(e) { setFiltroEstacao(e.target.value) }}>
          <option value="">Todas as estações</option>
          {estacoes.map(function(estacao) {
            return <option key={estacao.id} value={estacao.id}>{estacao.nome}</option>
          })}
        </select>
      </div>

      {/* CARDS DE ESTAÇÃO
          só aparecem quando não há filtro ativo
          row g-3: linha Bootstrap com espacamento entre os cards
          col-md-4: 3 cards por linha em telas medias */}
      {!filtroEstacao && estacoes.length > 0 && ( // se filtro for vazio, os cards não aparecem
        <div className="row g-3 mb-4">

          {estacoes.map(function(estacao) {

            {/* chama ultimasPorEstacao() para obter os parametros desta estacao
                retorna array com ultima medicao de cada parametro
                ex: [{nome_parametro:'Temperatura', valor:32.5}, {nome_parametro:'Umidade', valor:65}] */}
            const ultimas = ultimasPorEstacao(estacao.id)

            return (
              <div key={estacao.id} className="col-md-4">
                {/* col-md-4: cada card ocupa 4 de 12 colunas = 3 por linha */}

                <div className="card h-100">
                  {/* card: componente Bootstrap com borda
                      h-100: altura igual entre todos os cards */}

                  <div className="card-body">
                    {/* card-body: padding interno padrao do Bootstrap */}

                    {/* nome da estacao no topo do card */}
                    <h6 className="card-title fw-semibold mb-3">
                      {/* fw-semibold: negrito medio | mb-3: espaco abaixo */}
                      <i className="bi bi-geo-alt me-1 text-success"></i>
                      {/* bi-geo-alt: icone de localizacao | text-success: verde */}
                      {estacao.nome}
                    </h6>

                    {/* mensagem enquanto nenhuma medicao chegou ainda */}
                    {ultimas.length === 0 && (
                      <div className="text-muted small">
                        <i className="bi bi-hourglass me-1"></i>
                        Aguardando dados...
                      </div>
                    )}

                    {/* GRADE DE PARAMETROS
                        row g-2: grade interna com espacamento menor
                        os parametros sao os criados em Estacoes etapa 2
                        chegam aqui via: Estacoes cria → simulador publica → receptor salva → medicoes → cards */}
                    <div className="row g-2">

                      {ultimas.map(function(m) {
                        return (
                          <div key={m.id || m.nome_parametro} className="col-6">
                            {/* col-6: cada parametro ocupa metade da linha = 2 por linha */}

                            {/* label: icone + nome do parametro */}
                            <div className="text-muted small">
                              {/* icone muda conforme o nome: termometro, gota, velocimetro etc */}
                              <i className={'bi ' + iconePorParametro(m.nome_parametro) + ' me-1'}></i>
                              {m.nome_parametro || '—'}
                            </div>

                            {/* valor colorido conforme os limites
                                fs-6: tamanho de fonte Bootstrap
                                fw-bold: negrito
                                corDoValor retorna: text-danger, text-success, text-warning ou text-primary */}
                            <div className={'fs-6 fw-bold ' + corDoValor(m.nome_parametro, m.valor)}>
                              {m.valor !== null && m.valor !== undefined
                                ? Number(m.valor).toFixed(1) + ' ' + unidadePorParametro(m.nome_parametro, m.unidade)
                                : '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* timestamp da medicao mais recente no rodape do card */}
                    {ultimas.length > 0 && (
                      <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                        <i className="bi bi-clock me-1"></i>
                        {formatarData(ultimas[0].registrado_em)}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABELA DE HISTORICO
          table-responsive: scroll horizontal em telas pequenas
          table-hover: linha destaca ao passar o mouse 
          
          filtroEstacao filtra e pega apenas os valores de cada Estação */}
      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
          {/* card-header: cabecalho do card | bg-white: fundo branco | py-2: padding vertical pequeno */}
          <span className="fw-semibold small">
            Histórico de leituras 
            {filtroEstacao && estacoes.find(function(e) { return String(e.id) === String(filtroEstacao) }) &&
              ' — ' + estacoes.find(function(e) { return String(e.id) === String(filtroEstacao) }).nome
            } 
          </span>
          <span className="text-muted small">{medicoesFiltradas.length} registros</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              {/* table-light: cabecalho cinza claro */}
              <tr>
                <th>Estação</th>
                <th>Parâmetro</th>
                <th>Valor</th>
                <th>Data / Hora</th>
              </tr>
            </thead>
            <tbody>
              {medicoesFiltradas.map(function(medicao) {
                return (
                  <tr key={medicao.id}>
                    <td><span className="fw-semibold">{medicao.nome_estacao}</span></td>
                    <td>
                      <i className={'bi ' + iconePorParametro(medicao.nome_parametro) + ' me-1 text-muted'}></i>
                      {medicao.nome_parametro || '—'}
                    </td>
                    <td>
                      {/* cor muda conforme o valor: vermelho, verde, amarelo, azul */}
                      <span className={corDoValor(medicao.nome_parametro, medicao.valor)}>
                        {medicao.valor !== null && medicao.valor !== undefined
                          ? Number(medicao.valor).toFixed(2) + ' ' + unidadePorParametro(medicao.nome_parametro, medicao.unidade)
                          : '—'}
                      </span>
                    </td>
                    <td className="text-muted small">{formatarData(medicao.registrado_em)}</td>
                  </tr>
                )
              })}
              {medicoesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    <i className="bi bi-broadcast-pin me-2"></i>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}