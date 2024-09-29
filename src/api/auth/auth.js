const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../users/user'); // Modelo de usuário
const bcrypt = require('bcryptjs');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Este e-mail já está registrado.' });
    }

    try {
        // Criar um novo usuário
        const user = new User({ name, email, password });
        await user.save();

        // Gerar o token JWT
        const token = jwt.sign(
            { name: user.name, userId: user._id, email: user.email },
            process.env.JWT_SECRET,  // Certifique-se de que o segredo JWT está configurado no .env
            { expiresIn: '1h' }
        );

        // Retornar o token e as informações do usuário
        res.status(201).json({ token, user: { name: user.name, email: user.email, userId: user._id } });
    } catch (error) {
        // Logar o erro e retornar a mensagem exata para ajudar na depuração
        console.error('Erro ao registrar o usuário:', error);
        res.status(500).json({ message: `Erro ao registrar o usuário: ${error.message}` });
    }
});

router.post('/login', async (req, res) => {
    const { name, email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se a senha está correta
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Senha incorreta' });
    }

    // Gerar o token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retornar o token
    var nomeUsuario = user.name;
    res.json({ name: nomeUsuario, email, token });
});

module.exports = router;
