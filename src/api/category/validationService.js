
function validateCategory(value){
    const errors = [];

    if (!value) 
        errors.push("O campo 'descrição' é obrigatório.");

    return errors;
}

module.exports = {
    validateCategory
};