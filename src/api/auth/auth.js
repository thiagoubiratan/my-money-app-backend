const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../users/user'); // Modelo de usuário
const bcrypt = require('bcryptjs');
const authMiddleware = require('../../middleware/authMiddleware');
const nodemailer = require('nodemailer')
require('dotenv').config();

const router = express.Router();

// Configura o transporte SMTP (Brevo)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,          // smtp-relay.brevo.com
    port: parseInt(process.env.SMTP_PORT),// 587
    secure: false,                        // STARTTLS (false)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // para evitar problemas de certificado em dev
    }
})

// Rota de registro
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Este e-mail já está registrado.' });
    }

    try {
        // Criar um novo usuário diretamente sem hash manual
        const user = new User({ name, email, password });

        await user.save();  // O pre('save') vai hash a senha automaticamente

        // Gerar o token JWT
        const token = jwt.sign(
            { name: user.name, userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, name: user.name, email: user.email, userId: user._id });
    } catch (error) {
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

router.put('/updateUser', authMiddleware, async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        // Verifica se a senha antiga bate
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha anterior incorreta' });
        }

        // Criptografa a nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Atualiza diretamente no banco
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { password: hashedPassword },
            { new: true, runValidators: true }
        );

        res.json({ updatedUser, message: 'Senha atualizada com sucesso.' });

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ message: `Erro ao atualizar: ${error.message}` });
    }
});



// Rota para solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado.' })

    const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    )

    const resetLink = `${process.env.FRONTEND_URL}/#/reset-password/${resetToken}`

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Redefinição de Senha Meu Dinheiro 360',
            html: `
          <p>Olá ${user.name || ''},</p>
          <p>Você solicitou a redefinição de senha do aplicativo Meu Dinheiro 360. Clique no botão abaixo para continuar:</p>
          <p><a href="${resetLink}" style="padding:10px 15px; background:#007bff; color:white; text-decoration:none; border-radius:4px;">Redefinir Senha</a></p>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
        `
        })

        res.json({ message: 'E-mail de recuperação enviado com sucesso.' })
    } catch (err) {
        console.error('Erro ao enviar e-mail:', err)
        res.status(500).json({ message: 'Erro ao enviar e-mail de recuperação.' })
    }
})

// Rota para redefinir senha
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId)
        if (!user) return res.status(400).json({ message: 'Usuário inválido.' })

        // Criptografa a nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Atualiza diretamente no banco
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { password: hashedPassword },
            { new: true, runValidators: true }
        );

        res.json({ updatedUser, message: 'Senha atualizada com sucesso.' });

    } catch (err) {
        return res.status(400).json({ message: 'Token inválido ou expirado.' })
    }
})


module.exports = router;
