// App.jsx — arquivo central do sistema
//
// O que faz:
// 1. Controla login e logout
// 2. Busca todos os dados do backend ao fazer login
// 3. Guarda as funções CRUD e passa para cada página
// 4. Decide qual página mostrar conforme o item clicado na navbar
// 5. Atualiza medições automaticamente a cada 10 segundos

import { useState, useEffect } from 'react'
import Login      from './pages/Login'
import Estacoes   from './pages/Estacoes'
import Parametros from './pages/Parametros'
import Alertas    from './pages/Alertas'
import Usuarios   from './pages/Usuarios'
import Medicoes   from './pages/Medicoes'

// URL base da API — usa variável de ambiente em produção, localhost em desenvolvimento
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// intervalo de atualização das medições em milissegundos (10 segundos)
const INTERVALO_MEDICOES = 10000

// FUNÇÃO API
async function api(rota, metodo, dados) {
  const cabecalho = { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  if (dados) cabecalho['Content-Type'] = 'application/json'
  const resposta = await fetch(BASE + rota, {
    method:  metodo || 'GET',
    headers: cabecalho,
    body:    dados ? JSON.stringify(dados) : undefined
  })
  return resposta.json()
}

// FUNÇÃO BUSCAR
function buscar(rota, salvar) {
  api(rota).then(function(dados) { salvar(Array.isArray(dados) ? dados : []) })
}

export default function App() {

  const [usuario,    setUsuario]    = useState(JSON.parse(localStorage.getItem('usuario') || 'null'))
  const [pagina,     setPagina]     = useState('estacoes')
  const [estacoes,   setEstacoes]   = useState([])
  const [tipos,      setTipos]      = useState([])
  const [parametros, setParametros] = useState([])
  const [alertas,    setAlertas]    = useState([])
  const [usuarios,   setUsuarios]   = useState([])
  const [medicoes,   setMedicoes]   = useState([])

  // BUSCA INICIAL — roda ao fazer login
  useEffect(function() {
    if (!usuario) return
    buscar('/estacoes',   setEstacoes)
    buscar('/tipos',      setTipos)
    buscar('/parametros', setParametros)
    buscar('/alertas',    setAlertas)
    buscar('/usuarios',   setUsuarios)
    buscar('/medicoes',   setMedicoes)
  }, [usuario?.id])

  // ATUALIZAÇÃO AUTOMÁTICA DAS MEDIÇÕES — a cada 10 segundos
  // useEffect com setInterval garante que as medições sempre estejam atualizadas
  // clearInterval no return = limpa o intervalo quando o componente desmonta (logout)
  useEffect(function() {
    if (!usuario) return
    const intervalo = setInterval(function() {
      buscar('/medicoes', setMedicoes)
      // atualiza alertas também para mostrar os disparados pelo receptor Python
      buscar('/alertas', setAlertas)
    }, INTERVALO_MEDICOES)
    return function() { clearInterval(intervalo) }
  }, [usuario?.id])

  async function entrar(email, senha) {
    const r = await api('/auth/login', 'POST', { email, senha })
    if (r.erro) return r.erro
    localStorage.setItem('token',   r.token)
    localStorage.setItem('usuario', JSON.stringify(r.usuario))
    setUsuario(r.usuario)
    return null
  }

  function sair() { localStorage.clear(); setUsuario(null) }

  const crud = {
    salvarEstacaoComRetorno: async function(id, f) {
      const r = id ? await api('/estacoes/'+id,'PUT',f) : await api('/estacoes','POST',f)
      buscar('/estacoes', setEstacoes)
      return r
    },
    salvarEstacao:    async function(id, f) { id ? await api('/estacoes/'+id,'PUT',f)  : await api('/estacoes','POST',f);   buscar('/estacoes',   setEstacoes)   },
    deletarEstacao:   async function(id)    { if (!confirm('Deletar estação?')) return; await api('/estacoes/'+id,'DELETE'); buscar('/estacoes',   setEstacoes)   },

    salvarTipo: async function(id, f) {
      if (id) { await api('/tipos/'+id, 'PUT', f) }
      else    { await api('/tipos',     'POST', f) }
      await api('/tipos').then(function(dados) { setTipos(Array.isArray(dados) ? dados : []) })
    },
    salvarTipoComRetorno: async function(f) {
      const r = await api('/tipos', 'POST', f)
      await api('/tipos').then(function(dados) { setTipos(Array.isArray(dados) ? dados : []) })
      return r
    },
    deletarTipo:      async function(id)    { if (!confirm('Deletar tipo?')) return;    await api('/tipos/'+id,'DELETE');    buscar('/tipos',      setTipos)      },

    salvarParametro: async function(f) {
      await api('/parametros', 'POST', f)
      await api('/parametros').then(function(dados) { setParametros(Array.isArray(dados) ? dados : []) })
    },
    deletarParametro:     async function(id) { await api('/parametros/'+id,'DELETE');                                         buscar('/parametros', setParametros) },
    recarregarParametros: function()         { buscar('/parametros', setParametros) },

    salvarAlerta:     async function(id, f) { id ? await api('/alertas/'+id,'PUT',f)   : await api('/alertas','POST',f);   buscar('/alertas',    setAlertas)    },
    deletarAlerta:    async function(id)    { if (!confirm('Deletar alerta?')) return;  await api('/alertas/'+id,'DELETE');  buscar('/alertas',    setAlertas)    },
    salvarUsuario:    async function(id, f) { id ? await api('/usuarios/'+id,'PUT',f)  : await api('/usuarios','POST',f);  buscar('/usuarios',   setUsuarios)   },
    deletarUsuario:   async function(id)    { if (!confirm('Deletar usuário?')) return; await api('/usuarios/'+id,'DELETE'); buscar('/usuarios',   setUsuarios)   },
  }

  if (!usuario) return <Login onEntrar={entrar} />

  const ehAdmin = usuario.nivel === 'admin'

  const abas = [
    { id: 'estacoes',   texto: 'Estações'   },
    { id: 'parametros', texto: 'Parâmetros' },
    { id: 'alertas',    texto: 'Alertas'    },
    { id: 'medicoes',   texto: 'Medições'   },
    { id: 'usuarios',   texto: 'Usuários',  soAdmin: true },
  ]

  const estiloAba = { color: '#ffffff', cursor: 'pointer', fontSize: 14, userSelect: 'none' }

  return (
    <>
      <nav className="navbar px-3 d-flex justify-content-between align-items-center"
        style={{ background: '#146c43' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          <i className="bi bi-cloud me-2"></i>EnviroSense
        </span>
        <div className="d-flex gap-3 align-items-center">
          {abas.map(function(aba) {
            if (aba.soAdmin && !ehAdmin) return null
            return (
              <span key={aba.id}
                onClick={function() { setPagina(aba.id) }}
                style={{ ...estiloAba, fontWeight: pagina === aba.id ? 'bold' : 'normal' }}>
                {aba.texto}
                {/* ponto indicador de medições novas */}
                {aba.id === 'medicoes' && medicoes.length > 0 && pagina !== 'medicoes' && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#86efac', display: 'inline-block',
                    marginLeft: 4, verticalAlign: 'middle'
                  }}></span>
                )}
              </span>
            )
          })}
          <span onClick={sair} style={estiloAba}>Sair</span>
        </div>
      </nav>

      <div className="container-fluid p-4" style={{ maxWidth: 1200 }}>
        {pagina === 'estacoes'   && <Estacoes   estacoes={estacoes} parametros={parametros} tipos={tipos} ehAdmin={ehAdmin} crud={crud} />}
        {pagina === 'parametros' && <Parametros tipos={tipos} ehAdmin={ehAdmin} crud={crud} />}
        {pagina === 'alertas'    && <Alertas    alertas={alertas} estacoes={estacoes} parametros={parametros} ehAdmin={ehAdmin} crud={crud} />}
        {pagina === 'medicoes'   && <Medicoes   medicoes={medicoes} estacoes={estacoes} />}
        {pagina === 'usuarios'   && <Usuarios   usuarios={usuarios} usuarioLogado={usuario} crud={crud} />}
      </div>
    </>
  )
}
