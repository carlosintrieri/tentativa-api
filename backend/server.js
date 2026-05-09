// server.js — inicializa o servidor e registra as rotas

require('dotenv').config()
const express            = require('express')
const { conectarMongo }  = require('./conexao')

const app   = express()
const PORTA = process.env.PORT || 3001

app.use(require('cors')())
app.use(express.json())

// conecta no MongoDB — se falhar, avisa mas não derruba o servidor
conectarMongo()
  .then(() => console.log('MongoDB conectado'))
  .catch(erro => console.log('MongoDB offline — continuando sem ele:', erro.message))

// registra todas as rotas
app.use('/auth',       require('./rotas/auth'))
app.use('/estacoes',   require('./rotas/estacoes'))
app.use('/tipos',      require('./rotas/tipos'))
app.use('/parametros', require('./rotas/parametros'))
app.use('/alertas',    require('./rotas/alertas'))
app.use('/usuarios',   require('./rotas/usuarios'))

app.listen(PORTA, () => console.log('Servidor rodando na porta ' + PORTA))
