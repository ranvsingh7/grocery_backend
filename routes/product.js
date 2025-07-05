const express = require('express');
const Product = require('../models/Products');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware);
// Create a new product
router.post('/create-product', adminMiddleware, async (req, res) => {
    try {
        // Expecting req.body to have name, category, description, image, price, stock
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update the /products endpoint to ensure proper data handling
router.get('/products', async (req, res) => {
    try {
        const { name, category, sortBy, order, minPrice, maxPrice, minStock, maxStock, limit = 24, page = 1 } = req.query;

        // Build a query object
        const query = {};
        if (name) query.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        if (minStock || maxStock) {
            query.stock = {};
            if (minStock) query.stock.$gte = parseInt(minStock);
            if (maxStock) query.stock.$lte = parseInt(maxStock);
        }

        // Sorting
        const sort = {};
        if (sortBy) sort[sortBy] = order === 'desc' ? -1 : 1;

        // Pagination
        const pageLimit = parseInt(limit);
        const pageSkip = (parseInt(page) - 1) * pageLimit;

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sort)
            .skip(pageSkip)
            .limit(pageLimit);

        // Ensure products is always an array
        res.status(200).json({ products: products || [], totalProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a product (including variants)
router.put('/products/:id', adminMiddleware, async (req, res) => {
    try {
        // Expecting req.body.variants to be an array if updating variants
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a product
router.delete('/products/:id', adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new route to fetch products for the customer dashboard with enhanced filtering
router.get('/customer-products', async (req, res) => {
    try {
        const { limit = 24, page = 1, category, minPrice, maxPrice } = req.query;

        // Build a query object for filtering
        const query = {};
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Pagination
        const pageLimit = parseInt(limit);
        const pageSkip = (parseInt(page) - 1) * pageLimit;

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip(pageSkip)
            .limit(pageLimit);

        res.status(200).json({ products, totalProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get all product for customer with search functionality
router.get('/customer-products/search', async (req, res) => {
    try {
        const { searchTerm, limit = 24, page = 1 } = req.query;

        // Build a query object for searching
        const query = {};
        if (searchTerm) {
            query.name = { $regex: searchTerm, $options: 'i' }; // Case-insensitive search
        }

        // Pagination
        const pageLimit = parseInt(limit);
        const pageSkip = (parseInt(page) - 1) * pageLimit;

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip(pageSkip)
            .limit(pageLimit);

        res.status(200).json({ products, totalProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
