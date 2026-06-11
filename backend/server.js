require('dotenv').config()
const express = require('express')
const path = require('path')
const { conectarMongo } = require('./conexao')

const app = express()
const PORTA = process.env.PORT || 3001

app.use(require('cors')())
app.use(express.json())

conectarMongo().then(() => console.log('MongoDB conectado')).catch(e => console.log('MongoDB offline'))

// Inicia transferência MongoDB → PostgreSQL
require('./servico_transferencia')

// Rotas
app.use('/auth', require('./rotas/auth'))
app.use('/estacoes', require('./rotas/estacoes'))
app.use('/tipos', require('./rotas/tipos'))
app.use('/parametros', require('./rotas/parametros'))
app.use('/alertas', require('./rotas/alertas'))
app.use('/usuarios', require('./rotas/usuarios'))
app.use('/medicoes', require('./rotas/medicoes'))
app.use('/logs-alertas', require('./rotas/logs'))
app.use('/', require('./rotas/leituras'))

app.use(express.static(path.join(__dirname, '../frontend/dist')))
app.get('/{*path}', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')))

app.listen(PORTA, () => console.log(`[OK] Servidor na porta ${PORTA}`))