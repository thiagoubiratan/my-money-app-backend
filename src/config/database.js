const mongoose = require('mongoose');

// Usar o `Promise` global
mongoose.Promise = global.Promise;

// Configurar a URL de conexão MongoDB sem as opções descontinuadas
if (process.env.MONGODB_URI) {
    module.exports = mongoose.connect(process.env.MONGODB_URI);
} else {
    module.exports = mongoose.connect('mongodb+srv://Thiago_Lima:RmzTC8BMhHvuOzn4@mymoneyapp.5tlxrh6.mongodb.net/gestao360?retryWrites=true&w=majority');
}