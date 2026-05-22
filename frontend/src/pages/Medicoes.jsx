// Medicoes.jsx — exibe as leituras recebidas via MQTT em tempo real
//
// Atualiza automaticamente a cada 10 segundos
// Mostra: Estação, Parâmetro, Valor, Unidade, Data/Hora
//
// DADOS QUE RECEBO (via props do App.jsx):
// medicoes = lista das 100 medições mais recentes do banco
// estacoes = lista de estações para o filtro

import { useState, useEffect } from 'react'

export default function Medicoes({ medicoes, estacoes }) {

  // filtro por estação — '' = todas as estações
  const [filtroEstacao, setFiltroEstacao] = useState('')
  // ultima atualização — mostra quando foi a última busca
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date())

  // atualiza o horário de última atualização quando medicoes mudar
  useEffect(function() {
    setUltimaAtualizacao(new Date())
  }, [medicoes])

  // filtra as medições pela estação selecionada
  const medicoesFiltradas = filtroEstacao
    ? medicoes.filter(function(m) { return String(m.id_estacao) === String(filtroEstacao) })
    : medicoes

  // formata a data/hora de forma legível
  function formatarData(dataStr) {
    if (!dataStr) return '—'
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')
  }

  // define a cor do valor conforme o parâmetro e o valor
  function corDoValor(nomeParam, valor) {
    if (!nomeParam || valor === null || valor === undefined) return ''
    const v = Number(valor)
    if (nomeParam === 'Temperatura') {
      if (v > 35) return 'text-danger fw-bold'
      if (v < 10) return 'text-primary fw-bold'
      return 'text-success'
    }
    if (nomeParam === 'Umidade') {
      if (v < 30) return 'text-warning fw-bold'
      if (v > 90) return 'text-danger fw-bold'
      return 'text-success'
    }
    return ''
  }

  // ícone conforme o parâmetro
  function iconePorParametro(nomeParam) {
    if (!nomeParam) return 'bi-activity'
    const n = nomeParam.toLowerCase()
    if (n.includes('temperatura')) return 'bi-thermometer-half'
    if (n.includes('umidade'))     return 'bi-droplet-half'
    if (n.includes('pressao'))     return 'bi-speedometer2'
    if (n.includes('chuva'))       return 'bi-cloud-rain'
    if (n.includes('vento'))       return 'bi-wind'
    return 'bi-activity'
  }

  return (
    <div>

      {/* CABEÇALHO */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          <i className="bi bi-broadcast me-2"></i>Medições em Tempo Real
        </h4>
        <div className="d-flex align-items-center gap-3">
          {/* indicador de atualização */}
          <span className="text-muted small">
            <i className="bi bi-clock me-1"></i>
            Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          </span>
          {/* badge pulsante indicando que está ao vivo */}
          <span className="badge bg-success d-flex align-items-center gap-1">
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#fff', display: 'inline-block',
              animation: 'pulse 1.5s infinite'
            }}></span>
            AO VIVO
          </span>
        </div>
      </div>

      {/* ANIMAÇÃO DO PONTO AO VIVO */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {/* FILTRO POR ESTAÇÃO */}
      <div className="mb-3" style={{ maxWidth: 300 }}>
        <select className="form-select form-select-sm"
          value={filtroEstacao}
          onChange={function(e) { setFiltroEstacao(e.target.value) }}>
          <option value="">Todas as estações</option>
          {estacoes.map(function(estacao) {
            return <option key={estacao.id} value={estacao.id}>{estacao.nome}</option>
          })}
        </select>
      </div>

      {/* CARDS RESUMO — últimos valores por estação */}
      {!filtroEstacao && estacoes.length > 0 && (
        <div className="row g-3 mb-4">
          {estacoes.map(function(estacao) {
            // pega a última medição de temperatura desta estação
            const ultimaTemp = medicoes.find(function(m) {
              return String(m.id_estacao) === String(estacao.id) &&
                     m.nome_parametro === 'Temperatura'
            })
            const ultimaUmi = medicoes.find(function(m) {
              return String(m.id_estacao) === String(estacao.id) &&
                     m.nome_parametro === 'Umidade'
            })
            return (
              <div key={estacao.id} className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-title fw-semibold mb-3">
                      <i className="bi bi-geo-alt me-1 text-success"></i>
                      {estacao.nome}
                      <span className="ms-2 badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: 10 }}>
                        {estacao.uid || '—'}
                      </span>
                    </h6>
                    <div className="d-flex gap-4">
                      <div>
                        <div className="text-muted small"><i className="bi bi-thermometer-half me-1"></i>Temperatura</div>
                        <div className={'fs-4 fw-bold ' + corDoValor('Temperatura', ultimaTemp?.valor)}>
                          {ultimaTemp ? Number(ultimaTemp.valor).toFixed(1) + '°C' : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted small"><i className="bi bi-droplet-half me-1"></i>Umidade</div>
                        <div className={'fs-4 fw-bold ' + corDoValor('Umidade', ultimaUmi?.valor)}>
                          {ultimaUmi ? Number(ultimaUmi.valor).toFixed(1) + '%' : '—'}
                        </div>
                      </div>
                    </div>
                    {ultimaTemp && (
                      <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                        <i className="bi bi-clock me-1"></i>
                        {formatarData(ultimaTemp.registrado_em)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABELA COMPLETA */}
      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
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
                    <td>
                      <span className="fw-semibold">{medicao.nome_estacao}</span>
                    </td>
                    <td>
                      <i className={'bi ' + iconePorParametro(medicao.nome_parametro) + ' me-1 text-muted'}></i>
                      {medicao.nome_parametro || '—'}
                    </td>
                    <td>
                      <span className={corDoValor(medicao.nome_parametro, medicao.valor)}>
                        {medicao.valor !== null && medicao.valor !== undefined
                          ? Number(medicao.valor).toFixed(2) + ' ' + (medicao.unidade || '')
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
                    Nenhuma medição recebida ainda. Rode os simuladores Python para começar.
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
