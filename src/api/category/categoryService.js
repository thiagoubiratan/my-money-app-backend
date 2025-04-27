const express = require('express');
const Category = require('../category/category');
const BillingCycles = require('../billingCycle/billingCycle');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateCategory } = require('./validationService');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ errors: ['Usuário não autenticado.'] });
    }

    const { description } = req.body;

    const validationErros = validateCategory(description);

    if (validationErros.length > 0) {
        return res.status(400).json({ errors: validationErros });
    }

    const existingCategory = await Category.findOne({ description });

    if (existingCategory) {
        return res.status(400).json({ message: 'Categoria já registrado.' });
    }

    try {

        const category = new Category({ description: description, user: req.user.userId });
        await category.save();

        res.json({ description: category.description });

    } catch (error) {
        console.error('Erro ao registrar categoria:', error);
        res.status(500).json({ message: `Erro ao registrar o categoria: ${error.message}` });
    }
});

router.get('/', authMiddleware, async (req, res) => {

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ errors: ['Usuário não autenticado.'] });
    }

    try {

        var categories = await Category.find({ user: req.user.userId })
            .collation({ locale: 'pt', strength: 1 })
            .sort({ description: 1 });


        return res.json({ categories })

    } catch (error) {
        console.error('Erro ao obter categoria:', error);
        res.status(500).json({ message: `Erro ao obter categoria: ${error.message}` });
    }
})

router.put('/:id', authMiddleware, async (req, res) => {
    try {

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        const category = await Category.findOne({ _id: req.params.id, user: req.user.userId });

        if (!category)
            return res.status(404).json({ errors: ['Categoria não encontrado ou não pertence ao usuário.'] });

        const validationErros = validateCategory(req.body.description);
        if (validationErros.length > 0)
            return res.status(400).json({ errors: validationErros });

        category.description = req.body.description;

        var updateCategory = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })

        res.json(updateCategory);

    } catch (error) {

    }
})

router.delete('/:id', authMiddleware, async (req, res) => {
    try {

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ errors: ['Usuário não autenticado.'] });
        }

        var categoryItem = await Category.findById({ _id: req.params.id, user: req.user.userId });

        var checkRelationship = await BillingCycles.exists({
            user: req.user.userId,
            'debts.category': categoryItem.description
        });

        if (checkRelationship) {
            return res.status(200).json({ mensage: 'Operação bloqueada, categoria relacionada com um ciclo de pagamento.' });
        }

        var categoryDelete = await Category.findByIdAndDelete({ _id: req.params.id, user: req.user.userId });

        if (!categoryDelete) {
            return res.status(404).json({ errors: ['Categoria de faturamento não encontrado ou não pertence ao usuário.'] });
        }

        res.status(204).send();

    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
});


module.exports = router;