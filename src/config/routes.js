const express = require('express');
const billingCycleRouter = require('../api/billingCycle/billingCycleService');
const authRouter = require('../api/auth/auth'); // Rota de autenticação

module.exports = function (server) {
    const router = express.Router();
    server.use('/api', router);

    // Rota de autenticação (inclui /register e /login)
    router.use('/auth', authRouter);

    // Rotas protegidas (só acessíveis com autenticação JWT)
    router.use('/billingCycles', billingCycleRouter);
};
