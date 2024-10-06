const mongoose = require('mongoose');
const { Schema } = mongoose; // Adicione esta linha

// Função de conversão para formatar o valor brasileiro
function parseBrazilianCurrency(value) {
    if (typeof value === 'string') {
        // Remove pontos e troca a vírgula por ponto
        value = value.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(value);
}

const creditSchema = new Schema({
    name: { type: String, required: true },
    value: { 
        type: Number, 
        min: 0, 
        required: true,
        set: parseBrazilianCurrency 
    }
});

const debtSchema = new Schema({
    name: { type: String, required: true },
    value: { 
        type: Number, 
        min: 0, 
        required: [true, 'Informe o valor do débito!'],
        set: parseBrazilianCurrency
    },
    status: { 
        type: String, 
        required: false, 
        uppercase: true,
        enum: ['PAGO', 'PENDENTE', 'AGENDADO'] 
    },
    paymentday: {
        type: Number,
        required: [true, 'Informe o dia do pagamento!'],
        min: 1,
        Max: 31
    },
    paymentDate: {
        type: Date,
        required: false
    }
});

const billingCycleSchema = new Schema({
    name: { type: String, required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, min: 1970, max: 2100, required: true },
    credits: [creditSchema],
    debts: [debtSchema],
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true } // Referência ao usuário
});

module.exports = mongoose.model('BillingCycle', billingCycleSchema);
