const express = require('express');
const BillingCycle = require('./billingCycle'); // Modelo Mongoose
// const authMiddleware = require('../../middleware/authMiddleware'); // Middleware de autenticação JWT

const router = express.Router();

// Função para corrigir valores de créditos e débitos no formato brasileiro
function fixValues(billingCycle) {
    if (billingCycle.credits) {
        billingCycle.credits.forEach(credit => {
            credit.value = parseFloat(String(credit.value).replace(/[^\d,-]/g, '').replace(',', '.'));
        });
    }

    if (billingCycle.debts) {
        billingCycle.debts.forEach(debt => {
            debt.value = parseFloat(String(debt.value).replace(/[^\d,-]/g, '').replace(',', '.'));
        });
    }
}

// Função para formatar números no estilo brasileiro, sem o "R$"
function formatToBrazilianNumber(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Rota GET para listar os BillingCycles ordenados
router.get('/', async (req, res) => {
    try {
        const result = await BillingCycle.find().sort({ year: -1, month: -1 });
        const formattedResult = result.map(billingCycle => {
            const formattedCredits = billingCycle.credits.map(credit => ({
                ...credit._doc,
                value: formatToBrazilianNumber(credit.value)
            }));

            const formattedDebts = billingCycle.debts.map(debt => ({
                ...debt._doc,
                value: formatToBrazilianNumber(debt.value)
            }));

            return {
                ...billingCycle._doc,
                credits: formattedCredits,
                debts: formattedDebts
            };
        });

        res.json(formattedResult);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota POST para criar um BillingCycle (Protegida)
router.post('/', async (req, res) => {
    try {
        fixValues(req.body);
        const billingCycle = new BillingCycle(req.body);
        const result = await billingCycle.save();
        res.json(result);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota PUT para atualizar um BillingCycle (Protegida)
router.put('/:id', async (req, res) => {
    try {
        fixValues(req.body);
        const billingCycle = await BillingCycle.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.json(billingCycle);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota DELETE para remover um BillingCycle (Protegida)
router.delete('/:id', async (req, res) => {
    try {
        await BillingCycle.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota GET para o summary (agregação de créditos e débitos)
router.get('/summary', async (req, res) => {
    try {
        const result = await BillingCycle.aggregate([
            { $project: { credit: { $sum: "$credits.value" }, debt: { $sum: "$debts.value" } } },
            { $group: { _id: null, credit: { $sum: "$credit" }, debt: { $sum: "$debt" } } },
            { $project: { _id: 0, credit: 1, debt: 1 } }
        ]);

        const summaryResult = result[0] || { credit: 0, debt: 0 };
        res.json({
            credit: formatToBrazilianNumber(summaryResult.credit),
            debt: formatToBrazilianNumber(summaryResult.debt)
        });
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

module.exports = router;
