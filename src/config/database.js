const mongoose = require('mongoose')
mongoose.Promise = global.Promise
//module.exports = mongoose.connect('mongodb+srv://Thiago_Lima:RmzTC8BMhHvuOzn4@mymoneyapp.5tlxrh6.mongodb.net/mymoney?retryWrites=true&w=majority', { useNewUrlParser: true })
//module.exports = mongoose.connect('mongodb://localhost/mymoney', { useNewUrlParser: true })

if (process.env.MONGODB_URI) {
    module.exports = mongoose.connect('mongodb+srv://Thiago_Lima:RmzTC8BMhHvuOzn4@mymoneyapp.5tlxrh6.mongodb.net/mymoney?retryWrites=true&w=majority', { useNewUrlParser: true })
} else {
    module.exports = mongoose.connect('mongodb://localhost/mymoney', { useNewUrlParser: true })
}


mongoose.Error.messages.general.required = "O atributo '{PATH}' é obrigatório."
mongoose.Error.messages.Number.min =
    "O '{VALUE}' informado é menor que o limite mínimo de '{MIN}'."
mongoose.Error.messages.Number.max =
    "O '{VALUE}' informado é maior que o limite máximo de '{MAX}'."
mongoose.Error.messages.String.enum =
    "'{VALUE}' não é válido para o atributo '{PATH}'."