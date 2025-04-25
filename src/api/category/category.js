const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    description: {
        type: String,
        require: [true, 'Informe a descrição da categoria!']
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Referência ao usuário
})

module.exports = mongoose.model('Category', categorySchema);