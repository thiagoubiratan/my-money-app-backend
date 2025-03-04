const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definir o esquema do usuário
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 }
});

// Método para criptografar a senha antes de salvar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();  // Verifica se a senha foi modificada
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);  // Re-hasha a senha
    next();
});

// Método para verificar a senha do usuário
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
