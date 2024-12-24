const express = require('express');
const BillingCycle = require('./billingCycle'); // Modelo Mongoose
const authMiddleware = require('../../middleware/authMiddleware'); // Middleware de autenticação JWT
const { validateBillingCycle } = require('./validationService'); // Importa a validação

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

router.post('/', authMiddleware, async (req, res) => {
    try {
        // Função de validação manual
        const validationErrors = validateBillingCycle(req.body);

        // Se houver erros, retornar antes de tentar salvar no banco
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        const billingCycle = new BillingCycle({
            ...req.body,
            user: req.user.userId
        });

        const result = await billingCycle.save();
        res.json(result);
    } catch (error) {
        res.status(500).json({ errors: ['Erro interno no servidor.'] });
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

        // Validação manual antes de atualizar
        const validationErrors = validateBillingCycle(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        // Atualizar os valores com os novos dados
        fixValues(req.body);
        
        // Realizar a atualização
        const updatedBillingCycle = await BillingCycle.findByIdAndUpdate(req.params.id, req.body, {
            new: true,            // Retorna o documento atualizado
            runValidators: true    // Aplica as validações definidas no schema do Mongoose
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

        // Buscar todos os BillingCycles do usuário autenticado
        const billingCycles = await BillingCycle.find({ user: req.user.userId });

        // Inicializar acumuladores
        let totalCredits = 0;
        let totalDebts = 0;

        // Iterar sobre os ciclos de faturamento e somar créditos e débitos
        billingCycles.forEach(billingCycle => {
            // Somar os valores de todos os créditos
            totalCredits += billingCycle.credits.reduce((acc, credit) => acc + (parseFloat(credit.value) || 0), 0);
            
            // Somar os valores de todos os débitos
            totalDebts += billingCycle.debts.reduce((acc, debt) => acc + (parseFloat(debt.value) || 0), 0);
        });

        // Calcular o valor consolidado (créditos - débitos)
        const consolidated = totalCredits - totalDebts;

        // Retornar os valores formatados em estilo brasileiro
        res.json({
            credit: formatToBrazilianNumber(totalCredits),
            debt: formatToBrazilianNumber(totalDebts),
            consol: formatToBrazilianNumber(consolidated)
        });
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

// Rota POST para duplicar um ciclo de pagamento
router.post('/duplicate/:id', authMiddleware, async (req, res) => {
    try {
        // Verificar se o ID do usuário autenticado está presente
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        // Encontrar o ciclo de pagamento pelo ID fornecido e do usuário autenticado
        const originalBillingCycle = await BillingCycle.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!originalBillingCycle) {
            return res.status(404).json({ errors: ['Ciclo de pagamento não encontrado.'] });
        }

        // Modificar os créditos e débitos para o novo ciclo
        const newCredits = originalBillingCycle.credits.map(credit => ({
            name: credit.name,
            value: 0.01 // Valor padrão
        }));

        const newDebts = originalBillingCycle.debts.map(debt => ({
            name: debt.name,
            value: 0.01, // Valor padrão
            status: 'PENDENTE', // Manter o status original
            paymentday: debt.paymentday, // Manter o dia do pagamento original
            paymentDate: new Date() // Data atual
        }));

        // Criar um novo ciclo com os dados alterados
        const newBillingCycle = new BillingCycle({
            name: `${originalBillingCycle.name} - Cópia`, // Nome do ciclo modificado
            month: originalBillingCycle.month,
            year: originalBillingCycle.year,
            credits: newCredits,
            debts: newDebts,
            user: req.user.userId // Associar ao usuário autenticado
        });

        // Salvar no banco de dados
        const result = await newBillingCycle.save();

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});

module.exports = router;