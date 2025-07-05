const express = require('express');
const {authMiddleware} = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');


const router = express.Router();

router.use(authMiddleware);

// Get a customer by ID (with addresses)
router.get('/get-customer/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const customer = await User.findById(id).select('-password -__v');
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// update customer details by ID
router.put('/customers/edit/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile) {
        return res.status(400).json({ error: 'Name, email, and mobile are required' });
    }
    // check if the email and mobile is already in use by another customer
    const existingEmail = await User.findOne({ email });
            const existingMobile = await User.findOne({ mobile });
    if (existingEmail && existingEmail._id.toString() !== id) {
        return res.status(400).json({ error: 'Email is already in use by another customer' });
    }
    if (existingMobile && existingMobile._id.toString() !== id) {
        return res.status(400).json({ error: 'Mobile number is already in use by another customer' });
    }



    try {
        const customer = await User.findByIdAndUpdate(id, { name, email, mobile }, { new: true }).select('-password -__v');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
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

// Add address to a customer
router.post('/customers/:id/addresses', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const address = req.body;
    try {
        const customer = await User.findByIdAndUpdate(
            id,
            { $push: { addresses: address } },
            { new: true }
        ).select('-password -__v');
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an address for a customer
router.put('/customers/:id/addresses/:addressId', authMiddleware, async (req, res) => {
    const { id, addressId } = req.params;
    const address = req.body;
    try {
        const customer = await User.findOneAndUpdate(
            { _id: id, 'addresses._id': addressId },
            { $set: { 'addresses.$': address } },
            { new: true }
        ).select('-password -__v');
        if (!customer) return res.status(404).json({ error: 'Customer or address not found' });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete an address for a customer
router.delete('/customers/:id/addresses/:addressId', authMiddleware, async (req, res) => {
    const { id, addressId } = req.params;
    try {
        const customer = await User.findByIdAndUpdate(
            id,
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        ).select('-password -__v');
        if (!customer) return res.status(404).json({ error: 'Customer or address not found' });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;