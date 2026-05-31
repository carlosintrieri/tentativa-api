import { useState, useEffect, useRef } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Estacoes   from './pages/Estacoes'
import Parametros from './pages/Parametros'
import Alertas    from './pages/Alertas'
import Medicoes   from './pages/Medicoes'
import Usuarios   from './pages/Usuarios'
import Dashboard  from './pages/Dashboard'

const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const INTERVALO = 10000

// limites por tipo de parametro — valores acima ou abaixo disparam o toast
const LIMITES = {
  temperatura: { max: 38,   min: 5,   unidade: '°C',  iconeMax: '🔥', iconeMin: '🥶' },
  umidade:     { max: 90,   min: 20,  unidade: '%',   iconeMax: '💧', iconeMin: '🏜️' },
  pressao:     { max: 1030, min: 980, unidade: 'hPa', iconeMax: '⬆️', iconeMin: '⬇️' },
  chuva:       { max: 60,   min: null, unidade: 'mm', iconeMax: '🌧️', iconeMin: null },
  vento:       { max: 90,   min: null, unidade: 'km/h', iconeMax: '🌪️', iconeMin: null },
}

// identifica o tipo do parametro pelo nome
function detectarChave(nome) {
  if (!nome) return null
  const n = nome.toLowerCase()
  if (n.includes('temperatura')) return 'temperatura'
  if (n.includes('umidade'))     return 'umidade'
  if (n.includes('pressao') || n.includes('pressão')) return 'pressao'
  if (n.includes('chuva'))       return 'chuva'
  if (n.includes('vento'))       return 'vento'
  return null
}

// dispara o toast verde musgo se o valor for extremo
function verificarExtremo(medicao) {
  const chave = detectarChave(medicao.nome_parametro)
  if (!chave) return
  const lim = LIMITES[chave]
  const v   = Number(medicao.valor)
 
  if (lim.max !== null && v > lim.max) {
    toast(
      // o iconeMax mostra os emojis direto do Unicode!
      `${lim.iconeMax} ${medicao.nome_estacao} — ${medicao.nome_parametro}: ${v.toFixed(1)} ${lim.unidade} (máximo: ${lim.max})`,
      {
        style:           { background: '#146c43', color: '#fff', fontWeight: 500 },
        progressStyle:   { background: 'rgba(255,255,255,0.4)' },
        icon:            false,
        autoClose:       8000,
        position:        'bottom-right',
      }
    )
    // o iconeMin é usado por Unicode para mostrar o emoji
  } else if (lim.min !== null && v < lim.min) {
    toast(
      `${lim.iconeMin} ${medicao.nome_estacao} — ${medicao.nome_parametro}: ${v.toFixed(1)} ${lim.unidade} (mínimo: ${lim.min})`,
      {
        style:           { background: '#146c43', color: '#fff', fontWeight: 500 },
        progressStyle:   { background: 'rgba(255,255,255,0.4)' },
        icon:            false,
        autoClose:       8000,
        position:        'bottom-right',
      }
    )
  }
}

async function api(rota, metodo, dados) {
  const cabecalho = { Authorization: 'Bearer ' + localStorage.getItem('token') }
  if (dados) cabecalho['Content-Type'] = 'application/json'
  const res = await fetch(BASE_URL + rota, {
    method:  metodo || 'GET',
    headers: cabecalho,
    body:    dados ? JSON.stringify(dados) : undefined
  })
  return res.json()
}

function buscar(rota, setter) {
  api(rota).then(r => setter(Array.isArray(r) ? r : []))
}

function Login({ onEntrar }) {
  const [form, setForm] = useState({ email: 'admin@enviro.com', senha: 'admin123' })
  const [erro, setErro] = useState('')
  const [load, setLoad] = useState(false)
  async function submit(e) {
    e.preventDefault(); setLoad(true); setErro('')
    const r = await api('/auth/login', 'POST', form)
    if (r.erro) { setErro(r.erro); setLoad(false); return }
    localStorage.setItem('token', r.token)
    localStorage.setItem('usuario', JSON.stringify(r.usuario))
    onEntrar(r.usuario); setLoad(false)
  }
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: 360 }}>
        <h4 className="text-center mb-1">EnviroSense</h4>
        <p className="text-center text-muted mb-4">Sistema de Estações Meteorológicas</p>
        {erro && <div className="alert alert-danger py-2">{erro}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} required onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div className="mb-3"><label className="form-label">Senha</label>
            <input className="form-control" type="password" value={form.senha} required onChange={e => setForm({...form, senha: e.target.value})} /></div>
          <button className="btn btn-success w-100" disabled={load}>{load ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [usuario,    setUsuario]    = useState(JSON.parse(localStorage.getItem('usuario') || 'null'))
  const [aba,        setAba]        = useState('dashboard')
  const [estacoes,   setEstacoes]   = useState([])
  const [tipos,      setTipos]      = useState([])
  const [parametros, setParametros] = useState([])
  const [alertas,    setAlertas]    = useState([])
  const [usuarios,   setUsuarios]   = useState([])
  const [medicoes,   setMedicoes]   = useState([])
  const medicoesVistas = useRef(new Set())

  useEffect(function() {
    if (!usuario) return
    buscar('/estacoes',   setEstacoes)
    buscar('/tipos',      setTipos)
    buscar('/parametros', setParametros)
    buscar('/alertas',    setAlertas)
    buscar('/usuarios',   setUsuarios)
    buscar('/medicoes',   setMedicoes)
  }, [usuario?.id])

  useEffect(function() {
    if (!usuario) return
    const t = setInterval(function() {
      buscar('/alertas', setAlertas)
      api('/medicoes').then(function(novas) {
        if (!Array.isArray(novas)) return
        setMedicoes(novas)
        // verifica cada medicao nova — se for extremo dispara o toast
        novas.forEach(function(m) {
          if (medicoesVistas.current.has(m.id)) return
          medicoesVistas.current.add(m.id)
          verificarExtremo(m)
        })
      })
    }, INTERVALO)
    return function() { clearInterval(t) }
  }, [usuario?.id])

  function sair() { localStorage.clear(); setUsuario(null) }

  if (!usuario) return <Login onEntrar={setUsuario} />

  const ehAdmin = usuario.nivel === 'admin'
  const abas = [
    { id: 'dashboard',  texto: 'Dashboard'  },
    { id: 'estacoes',   texto: 'Estações'   },
    { id: 'parametros', texto: 'Parâmetros' },
    { id: 'alertas',    texto: 'Alertas'    },
    { id: 'medicoes',   texto: 'Medições'   },
    { id: 'usuarios',   texto: 'Usuários', soAdmin: true },
  ]

  const crud = {
    salvarEstacaoComRetorno: async function(id, f) { const r = id ? await api('/estacoes/'+id,'PUT',f) : await api('/estacoes','POST',f); buscar('/estacoes', setEstacoes); return r },
    salvarEstacao:    async function(id, f) { id ? await api('/estacoes/'+id,'PUT',f)  : await api('/estacoes','POST',f);   buscar('/estacoes',   setEstacoes)   },
    deletarEstacao:   async function(id)    { if (!confirm('Deletar estação?')) return; await api('/estacoes/'+id,'DELETE'); buscar('/estacoes',   setEstacoes)   },
    salvarTipo:       async function(id, f) { id ? await api('/tipos/'+id,'PUT',f) : await api('/tipos','POST',f); api('/tipos').then(d => setTipos(Array.isArray(d)?d:[])) },
    salvarTipoComRetorno: async function(f) { const r = await api('/tipos','POST',f); api('/tipos').then(d => setTipos(Array.isArray(d)?d:[])); return r },
    deletarTipo:      async function(id)    { if (!confirm('Deletar tipo?')) return; await api('/tipos/'+id,'DELETE'); buscar('/tipos', setTipos) },
    salvarParametro:  async function(f)     { await api('/parametros','POST',f); api('/parametros').then(d => setParametros(Array.isArray(d)?d:[])) },
    deletarParametro: async function(id)    { await api('/parametros/'+id,'DELETE'); buscar('/parametros', setParametros) },
    recarregarParametros: function()        { buscar('/parametros', setParametros) },
    salvarAlerta:     async function(id, f) { id ? await api('/alertas/'+id,'PUT',f) : await api('/alertas','POST',f); buscar('/alertas', setAlertas) },
    deletarAlerta:    async function(id)    { if (!confirm('Deletar alerta?')) return; await api('/alertas/'+id,'DELETE'); buscar('/alertas', setAlertas) },
    salvarUsuario:    async function(id, f) { id ? await api('/usuarios/'+id,'PUT',f) : await api('/usuarios','POST',f); buscar('/usuarios', setUsuarios) },
    deletarUsuario:   async function(id)    { if (!confirm('Deletar usuário?')) return; await api('/usuarios/'+id,'DELETE'); buscar('/usuarios', setUsuarios) },
  }

  return (
    <>
      <nav className="navbar px-3 d-flex justify-content-between align-items-center" style={{ background: '#146c43' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          <i className="bi bi-cloud me-2"></i>EnviroSense
        </span>
        <div className="d-flex gap-3 align-items-center">
          {abas.map(function(a) {
            if (a.soAdmin && !ehAdmin) return null
            return (
              <span key={a.id} onClick={function() { setAba(a.id) }}
                style={{ color: '#fff', cursor: 'pointer', fontSize: 14, userSelect: 'none', fontWeight: aba === a.id ? 'bold' : 'normal' }}>
                {a.texto}
              </span>
            )
          })}
          <span onClick={sair} style={{ color: '#fff', cursor: 'pointer', fontSize: 14, userSelect: 'none' }}>Sair</span>
        </div>
      </nav>

      <div className="container-fluid p-4" style={{ maxWidth: 1200 }}>
        {aba === 'dashboard'  && <Dashboard  medicoes={medicoes} estacoes={estacoes} />}
        {aba === 'estacoes'   && <Estacoes   estacoes={estacoes} parametros={parametros} tipos={tipos} ehAdmin={ehAdmin} crud={crud} />}
        {aba === 'parametros' && <Parametros tipos={tipos} ehAdmin={ehAdmin} crud={crud} />}
        {aba === 'alertas'    && <Alertas    alertas={alertas} estacoes={estacoes} parametros={parametros} ehAdmin={ehAdmin} crud={crud} />}
        {aba === 'medicoes'   && <Medicoes   medicoes={medicoes} estacoes={estacoes} />}
        {aba === 'usuarios'   && <Usuarios   usuarios={usuarios} usuarioLogado={usuario} crud={crud} />}
      </div>

      {/* toasts aparecem no canto inferior direito em verde musgo */}
      <ToastContainer
        position="bottom-right"
        newestOnTop
        closeOnClick
        pauseOnHover
        limit={5}
      />
    </>
  )
}