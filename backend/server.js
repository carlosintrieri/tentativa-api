// server.js — inicializa o servidor e registra as rotas

require('dotenv').config()
const express            = require('express')
const path               = require('path')
const { conectarMongo }  = require('./conexao')

const app   = express()
const PORTA = process.env.PORT || 8080

app.use(require('cors')())
app.use(express.json())

// conecta no MongoDB
conectarMongo()
  .then(() => console.log('MongoDB conectado'))
  .catch(erro => console.log('MongoDB offline — continuando sem ele:', erro.message))

// rotas da API
app.use('/auth',       require('./rotas/auth'))
app.use('/estacoes',   require('./rotas/estacoes'))
app.use('/tipos',      require('./rotas/tipos'))
app.use('/parametros', require('./rotas/parametros'))
app.use('/alertas',    require('./rotas/alertas'))
app.use('/usuarios',   require('./rotas/usuarios'))

// serve o frontend em produção
app.use(express.static(path.join(__dirname, '../frontend/dist')))
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

app.listen(PORTA, () => console.log('Servidor rodando na porta ' + PORTA))
