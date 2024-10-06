const express = require('express');
const BillingCycle = require('./billingCycle'); // Modelo Mongoose
const authMiddleware = require('../../middleware/authMiddleware'); // Middleware de autenticação JWT

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

// Rota GET para listar os BillingCycles ordenados (Protegida)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Verifica se o ID do usuário autenticado está disponível em req.user
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Filtrar os ciclos de faturamento pelo ID do usuário logado
        const result = await BillingCycle.find({ user: req.user.userId }).sort({ year: -1, month: -1 });

        const formattedResult = result.map(billingCycle => {
            // Formatação dos créditos
            const formattedCredits = billingCycle.credits.map(credit => ({
                ...credit._doc,
                value: formatToBrazilianNumber(credit.value)
            }));

            // Formatação dos débitos
            const formattedDebts = billingCycle.debts.map(debt => ({
                ...debt._doc,
                value: formatToBrazilianNumber(debt.value)
            }));

            // Somar o total de créditos usando reduce
            let totalCredits = billingCycle.credits.reduce((acc, credit) => acc + credit.value, 0);

            // Somar o total de débitos usando reduce
            let totalDebits = billingCycle.debts.reduce((acc, debt) => acc + debt.value, 0);

            // Calcular o valor consolidado (consol = totalCredits - totalDebits)
            let consolidated = totalCredits - totalDebits;

            // Somar apenas os débitos com status "PENDENTE"
            let totalPendingDebts = billingCycle.debts
                .filter(debt => debt.status === 'PENDENTE')  // Filtrar apenas os débitos pendentes
                .reduce((acc, debt) => acc + debt.value, 0);  // Somar os valores dos débitos pendentes

            // Formatar para o número brasileiro após somar (se necessário)
            totalCredits = formatToBrazilianNumber(totalCredits);
            totalDebits = formatToBrazilianNumber(totalDebits);
            consolidated = formatToBrazilianNumber(consolidated);
            totalPendingDebts = formatToBrazilianNumber(totalPendingDebts);

            return {
                ...billingCycle._doc,
                credits: formattedCredits,
                debts: formattedDebts,
                totalCredits: totalCredits,  // Total de créditos somado
                totalDebits: totalDebits,    // Total de débitos somado
                consol: consolidated,       // Valor consolidado (créditos - débitos)
                pending: totalPendingDebts
            };
        });

        res.json(formattedResult);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota POST para criar um BillingCycle (Protegida)
router.post('/', authMiddleware, async (req, res) => {
    try {
        fixValues(req.body);

        // Verifica se o ID do usuário autenticado está disponível em req.user
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Cria um novo BillingCycle e inclui o ID do usuário autenticado
        const billingCycle = new BillingCycle({
            ...req.body,          // Inclui todos os outros campos enviados no body
            user: req.user.userId  // Associa o ciclo ao usuário autenticado
        });

        const result = await billingCycle.save();
        res.json(result);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota PUT para atualizar um BillingCycle (Protegida)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // Verificar se o ID do usuário autenticado está presente
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Verificar se o ciclo de faturamento pertence ao usuário autenticado
        const billingCycle = await BillingCycle.findOne({ _id: req.params.id, user: req.user.userId });
        
        if (!billingCycle) {
            return res.status(404).json({ errors: ['Ciclo de faturamento não encontrado ou não pertence ao usuário.'] });
        }

        // Atualizar os valores com os novos dados
        fixValues(req.body);
        const updatedBillingCycle = await BillingCycle.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json(updatedBillingCycle);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota DELETE para remover um BillingCycle (Protegida)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Verificar se o ID do usuário autenticado está presente
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Verificar se o ciclo de faturamento pertence ao usuário autenticado
        const billingCycle = await BillingCycle.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
        
        if (!billingCycle) {
            return res.status(404).json({ errors: ['Ciclo de faturamento não encontrado ou não pertence ao usuário.'] });
        }

        res.status(204).send();  // Sucesso, sem conteúdo
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});


// Rota GET para o summary (agregação de créditos e débitos)
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        // Verificar se o ID do usuário autenticado está presente
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Agregar apenas os ciclos de faturamento do usuário autenticado
        const result = await BillingCycle.aggregate([
            { $match: { user: req.user.userId } },  // Filtrar os ciclos do usuário autenticado
            { $project: { credit: { $sum: "$credits.value" }, debt: { $sum: "$debts.value" } } },
            { $group: { _id: null, credit: { $sum: "$credit" }, debt: { $sum: "$debt" } } },
            { $project: { _id: 0, credit: 1, debt: 1 } }
        ]);

        const summaryResult = result[0] || { credit: 0, debt: 0 };
        let consolidated = summaryResult.credit - summaryResult.debt;

        res.json({
            credit: formatToBrazilianNumber(summaryResult.credit),
            debt: formatToBrazilianNumber(summaryResult.debt),
            consol: formatToBrazilianNumber(consolidated)
        });
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

module.exports = router;