const express = require('express');
const {authMiddleware} = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware);

// Get all customer list
router.get('/customers', adminMiddleware, async (req, res) => {
    try {
        const customers = await User.find({ userType: 'user' }).select('-password -__v');
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer details by ID
router.get('/customers/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const customer = await User.findById(id).select('-password -__v');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer details by ID
router.put('/customers/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    try {
        const customer = await User.findByIdAndUpdate(id, { name, email, phone }, { new: true }).select('-password -__v');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a customer by ID
router.delete('/customers/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await User.findByIdAndDelete(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;