// main.jsx — ponto de entrada do React
// cria a raiz do React dentro do elemento com id="root" que está no index.html

import React    from 'react'
import ReactDOM from 'react-dom/client'
import App      from './App'

// ReactDOM.createRoot() = cria a raiz do React no elemento #root do index.html
// .render(<App />) = monta o componente App — a partir daqui o React controla a tela
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
