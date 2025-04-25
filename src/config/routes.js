const express = require('express');
const billingCycleRouter = require('../api/billingCycle/billingCycleService');
const authRouter = require('../api/auth/auth'); // Rota de autenticação
const categoryRouter = require('../api/category/categoryService');

module.exports = function (server) {
    const router = express.Router();
    server.use('/api', router);

    router.use('/auth', authRouter);
    router.use('/billingCycles', billingCycleRouter);
    router.use('/category', categoryRouter);
};
