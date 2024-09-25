const express = require('express');
const billingCycleRoutes = require('../api/billingCycle/billingCycleService');

module.exports = function(server) {
    // Definir URL base para todas as rotas
    const router = express.Router();
    server.use('/api', router);  // Prefixo /api para todas as rotas

    // Registrar as rotas do BillingCycle
    router.use('/billingCycles', billingCycleRoutes);
};
