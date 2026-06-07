import { useState, useEffect } from 'react'

const CINCO_MINUTOS = 5 * 60 * 1000

export default function Medicoes({ medicoes, estacoes }) {

  const [filtroEstacao,     setFiltroEstacao]     = useState('')
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date())
  const [proximaLimpeza,    setProximaLimpeza]    = useState(CINCO_MINUTOS / 1000)
  const [historicoLocal,    setHistoricoLocal]    = useState([])

  useEffect(function() {
    setHistoricoLocal(medicoes)
    setUltimaAtualizacao(new Date())
  }, [medicoes])

  useEffect(function() {
    const contador = setInterval(function() {
      setProximaLimpeza(function(time) {
        if (time <= 1) return CINCO_MINUTOS / 1000
        return time - 1
      })
    }, 1000)
    return function() { clearInterval(contador) }
  }, [])

  useEffect(function() {
    const limpeza = setInterval(function() {
      setHistoricoLocal([])
      setProximaLimpeza(CINCO_MINUTOS / 1000)
    }, CINCO_MINUTOS)
    return function() { clearInterval(limpeza) }
  }, [])

  function formatarContador(segundos) {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

// se filtroEstacao tiver um id, filtra só as medições daquela estação
// se estiver vazio, retorna todas as medições sem filtro
const medicoesFiltradas = filtroEstacao

  // filtroEstacao tem valor: percorre historicoLocal e retorna só as medições
  // cuja id_estacao bate com o id guardado no estado
  ? historicoLocal.filter(function(m) { return String(m.id_estacao) === String(filtroEstacao) })

  // filtroEstacao está vazio: retorna tudo sem filtrar
  : historicoLocal

  function formatarData(dataStr) {
    if (!dataStr) return '—'
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')
  }

  function corDoValor(nomeParam, valor) {
    if (!nomeParam || valor === null || valor === undefined) return ''
    const v = Number(valor)
    const n = nomeParam.toLowerCase()
    if (n.includes('temperatura')) {
      if (v > 38) return 'text-danger fw-bold'
      if (v < 5)  return 'text-primary fw-bold'
      return 'text-success'
    }
    if (n.includes('umidade')) {
      if (v > 90) return 'text-danger fw-bold'
      if (v < 20) return 'text-warning fw-bold'
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
{/* d-flex = ativa o flexbox na div */}
{/* justify-content-between = empurra o h4 para a esquerda e o div para a direita */}
{/* align-items-center = alinha verticalmente ao centro */}
{/* mb-3 = margem abaixo de 12px */}
<div className="d-flex justify-content-between align-items-center mb-3">

  {/* mb-0 = remove a margem padrão do h4 para ficar alinhado */}
  <h4 className="mb-0">
    <i className="bi bi-broadcast me-2"></i>Medições em Tempo Real
  </h4>

  {/* d-flex = coloca relógio e timer lado a lado */}
  {/* align-items-center = alinha verticalmente ao centro */}
  {/* gap-3 = espaço de 16px entre os dois spans */}
  <div className="d-flex align-items-center gap-3">

    {/* text-muted = cor cinza | small = fonte menor */}
    <span className="text-muted small">
      <i className="bi bi-clock me-1"></i> {/* me-1 = margem direita de 4px */}
      Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
    </span>

    {/* text-muted = cor cinza | small = fonte menor */}
    <span className="text-muted small">
      <i className="bi bi-trash me-1"></i> {/* me-1 = margem direita d  e 4px - o formatarContador é uma função lá em cima que cria o timer!*/}
      Limpeza em {formatarContador(proximaLimpeza)} 
    </span> 

  </div>
</div>

      {/* card começa aqui */}
      {/* cards só aparecem quando não há filtro ativo */}
      {!filtroEstacao && estacoes.length > 0 && (
        <div className="row g-3 mb-4">

          {estacoes.map(function(estacao) {

            const ultimas = ultimasPorEstacao(estacao.id)

            return (
              <div key={estacao.id} className="col-md-4">

                <div className="card h-100">
                  <div className="card-body">

                    <h6 className="card-title fw-semibold mb-3">
                      <i className="bi bi-geo-alt me-1 text-success"></i>
                      {estacao.nome}
                    </h6>

                    {ultimas.length === 0 && (
                      <div className="text-muted small">
                        <i className="bi bi-hourglass me-1"></i>
                        Aguardando dados...
                      </div>
                    )}

                    <div className="row g-2">
                      {ultimas.map(function(m) {
                        return (
                          <div key={m.id || m.nome_parametro} className="col-6">
                            <div className="text-muted small">
                              <i className={'bi ' + iconePorParametro(m.nome_parametro) + ' me-1'}></i>
                              {m.nome_parametro || '—'}
                            </div>
                            <div className={'fs-6 fw-bold ' + corDoValor(m.nome_parametro, m.valor)}>
                              {m.valor !== null && m.valor !== undefined
                                ? Number(m.valor).toFixed(1) + ' ' + unidadePorParametro(m.nome_parametro, m.unidade)
                                : '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* card termina aqui */}

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
          {/* título muda conforme o filtro ativo */}
<span className="fw-semibold small">
  Histórico de leituras
  {/* se filtroEstacao tiver valor, procura a estação pelo id e adiciona o nome no título */}
  {filtroEstacao && estacoes.find(function(e) { return String(e.id) === String(filtroEstacao) }) &&
    ' — ' + estacoes.find(function(e) { return String(e.id) === String(filtroEstacao) }).nome
  }
</span>
          <span className="text-muted small">{medicoesFiltradas.length} registros</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
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