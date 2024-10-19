const moment = require('moment'); // Para validar datas
moment.locale('pt-br'); // Garantir que estamos usando a localização brasileira

// Função para corrigir o formato brasileiro para número (troca vírgula por ponto)
function parseBrazilianNumber(value) {
    if (typeof value === 'string') {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    return value;
}

// Função de validação para o ciclo de faturamento
function validateBillingCycle(data) {
    const errors = [];

    // Validação de campos obrigatórios
    if (!data.name) errors.push("O campo 'name' é obrigatório.");
    if (!data.month || isNaN(data.month) || data.month < 1 || data.month > 12) {
        errors.push("O campo Més deve ser um número entre 1 e 12.");
    }
    if (!data.year || isNaN(data.year) || data.year < 1970 || data.year > 2100) {
        errors.push("O campo ano deve ser um número entre 1970 e 2100.");
    }

    // Validação de créditos
    if (!Array.isArray(data.credits) || data.credits.length === 0) {
        errors.push("Você deve informar ao menos um crédito.");
    } else {
        data.credits.forEach((credit, index) => {
            if (!credit.name) {
                errors.push(`O nome do crédito na posição ${index + 1} é obrigatório.`);
            }
            const creditValue = parseBrazilianNumber(credit.value);
            if (!creditValue || isNaN(creditValue)) {
                errors.push(`O valor do crédito na posição ${index + 1} é inválido.`);
            }
        });
    }

    // Validação de débitos
    if (!Array.isArray(data.debts) || data.debts.length === 0) {
        errors.push("Você deve informar ao menos um débito.");
    } else {
        data.debts.forEach((debt, index) => {
            if (!debt.name) {
                errors.push(`O nome do débito na posição ${index + 1} é obrigatório.`);
            }
            const debtValue = parseBrazilianNumber(debt.value);
            if (!debtValue || isNaN(debtValue)) {
                errors.push(`O valor do débito na posição ${index + 1} é inválido.`);
            }
            if (!debt.paymentday || isNaN(debt.paymentday) || debt.paymentday < 1 || debt.paymentday > 31) {
                errors.push(`O dia do pagamento do débito na posição ${index + 1} é inválido.`);
            }

            // Verificação do campo paymentDate somente se o status não for AGENDADO
            if (debt.status !== 'AGENDADO') {
                // Se o campo `paymentDate` não existir no JSON, trate isso
                if (!debt.paymentDate) {
                    errors.push(`A data de pagamento na posição ${index + 1} é obrigatória.`);
                } else if (!moment(debt.paymentDate, moment.ISO_8601, true).isValid()) {
                    // Verifica se a data está no formato ISO (no backend, já pode ter sido convertida)
                    errors.push(`A data de pagamento na posição ${index + 1} é inválida.`);
                }
            }

            if (!debt.status) {
                errors.push(`O status do débito na posição ${index + 1} é obrigatório.`);
            }
        });
    }

    return errors;
}

module.exports = {
    validateBillingCycle
};
