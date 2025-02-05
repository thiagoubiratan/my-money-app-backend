const mongoose = require('mongoose');
require('dotenv').config();  // Carrega as variáveis do .env

// Usar o `Promise` global
mongoose.Promise = global.Promise;

// Verificar qual ambiente está rodando
const environment = process.env.NODE_ENV || 'development';
console.log(`######################################`);
console.log(`## Rodando em ambiente: ${environment} ##`);
console.log(`######################################`);

// Conectar ao MongoDB usando a variável de ambiente
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log(`Conectado ao MongoDB com sucesso!`))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

module.exports = mongoose;