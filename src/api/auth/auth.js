const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../users/user'); // Modelo de usuário
const bcrypt = require('bcryptjs');

const router = express.Router();

// Rota de registro
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Este e-mail já está registrado.' });
    }

    try {
        // Criar um novo usuário
        const hashedPassword = await bcrypt.hash(password, 10); // Hash da senha
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Gerar o token JWT
        const token = jwt.sign(
            { name: user.name, userId: user._id, email: user.email },
            process.env.JWT_SECRET,  // Certifique-se de que o segredo JWT está configurado no .env
            { expiresIn: '1h' }
        );

        // Retornar o token e as informações do usuário
        res.json({ token, name: user.name, email: user.email, userId: user._id });
    } catch (error) {
        // Logar o erro e retornar a mensagem exata para ajudar na depuração
        console.error('Erro ao registrar o usuário:', error);
        res.status(500).json({ message: `Erro ao registrar o usuário: ${error.message}` });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar se o usuário existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        // Adicione logs para verificar os valores de senha
        console.log("Senha enviada pelo usuário:", password);   // Senha em texto plano
        console.log("Senha armazenada no banco (hash):", user.password);   // Senha hashada

        // Verificar se a senha está correta
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta' });
        }

        // Gerar o token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Retornar o token e informações do usuário
        res.json({ name: user.name, email, token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: `Erro no login: ${error.message}` });
    }
});


// Rota para validar o token JWT
router.post('/validateToken', (req, res) => {
    const { token } = req.body;  // Recebe o token do corpo da requisição

    if (!token) {
        return res.status(400).json({ valid: false, message: 'Token não fornecido.' });
    }

    // Verificar o token usando jwt.verify
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Token inválido ou expirado
            return res.status(401).json({ valid: false, message: 'Token inválido ou expirado.' });
        }

        // Token válido
        res.status(200).json({ valid: true });
    });
});

module.exports = router;
