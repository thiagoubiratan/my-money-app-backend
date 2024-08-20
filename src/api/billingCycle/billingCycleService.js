const BillingCycle = require('./billingCycle')
const errorHandler = require('../common/errorHandler')

BillingCycle.methods(['get', 'post', 'put', 'delete'])
BillingCycle.updateOptions({ new: true, runValidators: true })
BillingCycle.after('post', errorHandler).after('put', errorHandler)

BillingCycle.route('get', (req, res, next) => {
    BillingCycle.find().sort({ year: -1, month: -1 }).exec((error, result) => {
        if (error) {
            res.status(500).json({ errors: [error] });
        } else {
            res.json(result);
        }
    });
});

BillingCycle.route('count', (req, res, next) => {
    BillingCycle.count((error, value) => {
        if (error) {
            res.status(500).json({ errors: [error] })
        } else {
            res.json({ value })
        }
    })
})

BillingCycle.route('summary', (req, res, next) => {
    BillingCycle.aggregate([{
        $project: { credit: { $sum: "$credits.value" }, debt: { $sum: "$debts.value" } }
    }, {
        $group: { _id: null, credit: { $sum: "$credit" }, debt: { $sum: "$debt" } }
    }, {
        $project: { _id: 0, credit: 1, debt: 1 }
    }], (error, result) => {
        if (error) {
            res.status(500).json({ errors: [error] })
        } else {
            res.json(result[0] || { credit: 0, debt: 0 })
        }
    })
})



function fixValues(billingCycle) {
    // Corrigir os valores dos débitos
    if (billingCycle.debts) {
        console.log('Valores dos débitos antes da correção:', billingCycle.debts);
        billingCycle.debts.forEach(debt => {
            debt.value = parseFloat(String(debt.value).replace(',', '.'));
        });
        console.log('Valores dos débitos após a correção:', billingCycle.debts);
    }

    // Corrigir os valores dos créditos
    if (billingCycle.credits) {
        console.log('Valores dos créditos antes da correção:', billingCycle.credits);
        billingCycle.credits.forEach(credit => {
            credit.value = parseFloat(String(credit.value).replace(',', '.'));
        });
        console.log('Valores dos créditos após a correção:', billingCycle.credits);
    }
}



// Rota para inserir um novo registro
BillingCycle.route('put', (req, res, next) => {
    // Corrigir os valores dos débitos e créditos antes de inserir
    fixValues(req.body);

    BillingCycle.create(req.body, (error, result) => {
        if (error) {
            res.status(500).json({ errors: [error] });
        } else {
            res.json(result);
        }
    });
});


module.exports = BillingCycle