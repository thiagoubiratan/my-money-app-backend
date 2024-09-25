const restful = require('node-restful');
const mongoose = restful.mongoose;

// Função de conversão para formatar o valor brasileiro
function parseBrazilianCurrency(value) {
    if (typeof value === 'string') {
        // Remove pontos e troca a vírgula por ponto
        value = value.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(value);
}

const creditSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { 
        type: Number, 
        min: 0, 
        required: true,
        // Usa setter para converter o formato brasileiro de moeda
        set: parseBrazilianCurrency 
    }
});

const debtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { 
        type: Number, 
        min: 0, 
        required: [true, 'Informe o valor do débito!'],
        // Usa setter para converter o formato brasileiro de moeda
        set: parseBrazilianCurrency
    },
    status: { 
        type: String, 
        required: false, 
        uppercase: true,
        enum: ['PAGO', 'PENDENTE', 'AGENDADO'] 
    }
});

const billingCycleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, min: 1970, max: 2100, required: true },
    credits: [creditSchema],
    debts: [debtSchema]
});

module.exports = restful.model('BillingCycle', billingCycleSchema);
