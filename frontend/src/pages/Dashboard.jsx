// Dashboard.jsx — gráficos em tempo real por estação e parâmetro

import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// cores por tipo de parametro
const CORES = {
  temperatura: { borda: '#ef4444', fundo: 'rgba(239,68,68,0.15)' },
  umidade:     { borda: '#3b82f6', fundo: 'rgba(59,130,246,0.15)' },
  pressao:     { borda: '#8b5cf6', fundo: 'rgba(139,92,246,0.15)' },
  chuva:       { borda: '#06b6d4', fundo: 'rgba(6,182,212,0.15)'  },
  vento:       { borda: '#f59e0b', fundo: 'rgba(245,158,11,0.15)' },
  padrao:      { borda: '#10b981', fundo: 'rgba(16,185,129,0.15)' },
}

function detectarCor(nome) {
  if (!nome) return CORES.padrao
  const n = nome.toLowerCase()
  if (n.includes('temperatura')) return CORES.temperatura
  if (n.includes('umidade'))     return CORES.umidade
  if (n.includes('pressao') || n.includes('pressão')) return CORES.pressao
  if (n.includes('chuva'))       return CORES.chuva
  if (n.includes('vento'))       return CORES.vento
  return CORES.padrao
}

function icone(nome) {
  if (!nome) return '📊'
  const n = nome.toLowerCase()
  if (n.includes('temperatura')) 
  if (n.includes('umidade'))     
  if (n.includes('pressão') || n.includes('pressão'))
  if (n.includes('chuva'))   
  if (n.includes('vento'))       
  return '📊'
}

function unidade(nome) {
  if (!nome) return ''
  const n = nome.toLowerCase()
  if (n.includes('temperatura')) return '°C'
  if (n.includes('umidade'))     return '%'
  if (n.includes('pressao'))     return 'hPa'
  if (n.includes('chuva'))       return 'mm'
  if (n.includes('vento'))       return 'km/h'
  return ''
}

// grafico individual por parametro — atualiza quando medicoes mudam
function GraficoParametro({ nomeParam, medicoes }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(function() {
    if (!canvasRef.current) return

    // pega as ultimas 20 leituras deste parametro em ordem cronologica
    const dados = medicoes
      .filter(function(m) { return m.nome_parametro === nomeParam })
      .slice(0, 20)
      .reverse()

    const labels = dados.map(function(m) {
      return new Date(m.registrado_em).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    })
    const valores = dados.map(function(m) { return Number(m.valor) })
    const cor     = detectarCor(nomeParam)

    if (chartRef.current) {
      // atualiza dados sem recriar o grafico — movimento suave
      chartRef.current.data.labels            = labels
      chartRef.current.data.datasets[0].data  = valores
      chartRef.current.update('active')
      return
    }

    // cria o grafico na primeira vez
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label:            nomeParam,
          data:             valores,
          borderColor:      cor.borda,
          backgroundColor:  cor.fundo,
          borderWidth:      2,
          pointRadius:      4,
          pointHoverRadius: 6,
          pointBackgroundColor: cor.borda,
          fill:    true,
          tension: 0.4,
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ` ${ctx.parsed.y.toFixed(2)} ${unidade(nomeParam)}`
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45 },
            grid:  { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
            ticks: {
              font: { size: 11 },
              callback: function(v) { return v.toFixed(1) + ' ' + unidade(nomeParam) }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    })

    return function() {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [medicoes, nomeParam])

  // estatisticas rapidas
  const valores = medicoes
    .filter(function(m) { return m.nome_parametro === nomeParam })
    .map(function(m) { return Number(m.valor) })

  const ultimo = valores.length ? valores[0].toFixed(1) : '—'
  const media  = valores.length ? (valores.reduce(function(a, b) { return a + b }, 0) / valores.length).toFixed(1) : '—'
  const maxVal = valores.length ? Math.max(...valores).toFixed(1) : '—'
  const minVal = valores.length ? Math.min(...valores).toFixed(1) : '—'
  const cor    = detectarCor(nomeParam)

  return (
    <div className="card h-100" style={{ borderTop: `3px solid ${cor.borda}` }}>
      <div className="card-body">

        {/* titulo do grafico com icone e ultimo valor */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 20 }}>{icone(nomeParam)}</span>
            <span className="fw-semibold" style={{ fontSize: 15 }}>{nomeParam}</span>
          </div>
          <span className="badge rounded-pill px-3"
            style={{ background: cor.fundo, color: cor.borda, border: `1px solid ${cor.borda}`, fontSize: 13 }}>
            {ultimo} {unidade(nomeParam)}
          </span>
        </div>

        {/* area do grafico */}
        <div style={{ height: 200, position: 'relative' }}>
          {valores.length === 0
            ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                <i className="bi bi-hourglass me-2"></i>Aguardando dados do simulador...
              </div>
            : <canvas ref={canvasRef}></canvas>
          }
        </div>

        {/* estatisticas min / media / max / leituras */}
        {valores.length > 0 && (
          <div className="d-flex justify-content-between mt-3 pt-2"
            style={{ borderTop: '1px solid #f0f0f0' }}>
            {[
              { label: 'MÍNIMO',   valor: minVal },
              { label: 'MÉDIA',    valor: media  },
              { label: 'MÁXIMO',   valor: maxVal },
              { label: 'LEITURAS', valor: valores.length },
            ].map(function(item) {
              return (
                <div key={item.label} className="text-center">
                  <div className="text-muted" style={{ fontSize: 10 }}>{item.label}</div>
                  <div className="fw-semibold" style={{ fontSize: 13, color: cor.borda }}>{item.valor}</div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default function Dashboard({ medicoes, estacoes }) {

  const [estacaoSelecionada, setEstacaoSelecionada] = useState('')

  // quando estacoes carregam seleciona a primeira automaticamente
  useEffect(function() {
    if (estacoes.length > 0 && !estacaoSelecionada) {
      setEstacaoSelecionada(String(estacoes[0].id))
    }
  }, [estacoes])

  // filtra medicoes da estacao selecionada
  const medicoesDaEstacao = medicoes.filter(function(m) {
    return String(m.id_estacao) === String(estacaoSelecionada)
  })

  // descobre os parametros com medicoes nesta estacao
  const parametros = [...new Set(
    medicoesDaEstacao.map(function(m) { return m.nome_parametro }).filter(Boolean)
  )]

  const estacao = estacoes.find(function(e) { return String(e.id) === String(estacaoSelecionada) })

  return (
    <div>

      {/* cabecalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>Dashboard
        </h4>
      </div>

      {/* select de estacao */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <label className="form-label mb-0 fw-semibold">
                <i className="bi bi-geo-alt me-1 text-success"></i>
                Estação:
              </label>
            </div>
            <div className="col-md-4">
              <select className="form-select"
                value={estacaoSelecionada}
                onChange={function(e) { setEstacaoSelecionada(e.target.value) }}>
                <option value="">Selecione uma estação...</option>
                {estacoes.map(function(e) {
                  return <option key={e.id} value={e.id}>{e.nome}</option>
                })}
              </select>
            </div>
            {estacao && (
              <div className="col">
                <span className="text-muted small me-3">
                  <i className="bi bi-broadcast me-1 text-success"></i>
                  {parametros.length} parâmetro{parametros.length !== 1 ? 's' : ''} monitorado{parametros.length !== 1 ? 's' : ''}
                </span>
                <span className="text-muted small">
                  <i className="bi bi-database me-1 text-success"></i>
                  {medicoesDaEstacao.length} leitura{medicoesDaEstacao.length !== 1 ? 's' : ''} no histórico
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* graficos — um por parametro - USEI O bi bi-bar-chart no CENTRO da tela*/}
      {!estacaoSelecionada && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-bar-chart fs-1 d-block mb-3 text-success"></i> 
          Selecione uma estação para ver os gráficos
        </div>
      )}

      {estacaoSelecionada && parametros.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-hourglass fs-1 d-block mb-3"></i>
          Aguardando dados do simulador para esta estação...
        </div>
      )}

      {estacaoSelecionada && parametros.length > 0 && (
        <div className="row g-4">
          {parametros.map(function(param) {
            return (
              <div key={param} className="col-md-6 col-xl-4">
                <GraficoParametro
                  nomeParam={param}
                  medicoes={medicoesDaEstacao}
                />
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}