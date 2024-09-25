const port = process.env.PORT ? process.env.PORT : 3030;

const bodyParser = require('body-parser');
const express = require('express');
const server = express();
const allowCors = require('./cors');
const queryParser = require('express-query-int');

// Middlewares
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(allowCors);
server.use(queryParser());

// Importar o arquivo de rotas
const routes = require('./routes'); // Caminho onde o arquivo de rotas está
routes(server);  // Passar o `server` para as rotas

// Iniciar o servidor
server.listen(port, function () {
    console.log(`BACKEND is running on port ${port}.`);
});

module.exports = server;
