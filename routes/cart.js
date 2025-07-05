const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Products');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure authentication
router.use(authMiddleware);

// Add an item to the cart
router.post('/cart/add', async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid product ID or quantity' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ userId: req.user.id, items: [] });
        }

        // Check if the product already exists in the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            // Update quantity if product exists
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Add new product to cart
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Product added to cart', cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get the cart for the authenticated user
router.get('/cart', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId', 'name price');
        if (!cart) {
            // Return empty cart instead of 404
            return res.status(200).json({ items: [] });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update item quantity in the cart
router.put('/cart/update', async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid product ID or quantity' });
    }

    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ userId: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            // Add new item if it doesn't exist
            cart.items.push({ productId, quantity });
        } else {
            // Update quantity if item exists
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated', cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove an item from the cart
router.delete('/cart/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            // Return success if cart doesn't exist (already "removed")
            return res.status(200).json({ message: 'Product removed from cart', cart: { items: [] } });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        res.status(200).json({ message: 'Product removed from cart', cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear all items in the cart
router.delete('/clear-cart', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        console.log(cart);
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        cart.items = [];
        await cart.save();
        console.log('Cart cleared:', cart);
        res.status(200).json({ message: 'Cart cleared', cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
