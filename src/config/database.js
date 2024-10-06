const mongoose = require('mongoose');

// Usar o `Promise` global
mongoose.Promise = global.Promise;

// Configurar a URL de conexão MongoDB sem as opções descontinuadas
if (process.env.MONGODB_URI) {
    module.exports = mongoose.connect(process.env.MONGODB_URI);
} else {
    module.exports = mongoose.connect('mongodb+srv://Thiago_Lima:RmzTC8BMhHvuOzn4@mymoneyapp.5tlxrh6.mongodb.net/gestao360?retryWrites=true&w=majority');
}

// Mensagens de erro personalizadas
mongoose.Error.messages.general.required = "O atributo '{PATH}' é obrigatório.";
mongoose.Error.messages.Number.min = "O '{VALUE}' informado é menor que o limite mínimo de '{MIN}'.";
mongoose.Error.messages.Number.max = "O '{VALUE}' informado é maior que o limite máximo de '{MAX}'.";
mongoose.Error.messages.String.enum = "'{VALUE}' não é válido para o atributo '{PATH}'.";
mongoose.Error.messages.Number.min = "O '{VALUE} informado é menor que o limite mímino de {MIN}'";
mongoose.Error.messages.Number.max = "O '{VALUE} informado é menor que o limite mímino de {MAX}'";