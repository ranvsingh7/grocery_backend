
const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Products');
const User = require('../models/User');
const {authMiddleware} = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { hash } = require('crypto');
require('dotenv').config();

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// Place a new order
router.post('/orders', async (req, res) => {
    try {
        const { addressId, paymentMode = 'Cash on Delivery' } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!addressId) {
            return res.status(400).json({ error: 'Address is required' });
        }

        // Get user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price stock');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Get user details and selected address
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const selectedAddress = user.addresses.id(addressId);
        if (!selectedAddress) {
            return res.status(400).json({ error: 'Invalid address selected' });
        }

        // Validate stock and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const cartItem of cart.items) {
            const product = cartItem.productId;
            
            if (!product) {
                return res.status(400).json({ error: 'Product not found in cart' });
            }

            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}` 
                });
            }

            const itemTotal = product.price * cartItem.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                productId: product._id,
                quantity: cartItem.quantity,
                price: product.price
            });

            // Update product stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;



        // Delivery charge logic
        let deliveryCharge = 0;
        if (totalAmount < 599) {
            deliveryCharge = 20;
        }

        // Handling charge from .env
        const handlingCharge = parseFloat(process.env.HANDLING_CHARGE) || 0;
        console.log('Handling Charge:', handlingCharge);
        const grandTotal = totalAmount + deliveryCharge + handlingCharge;

        // Add deliveryCharge and handlingCharge to order object
        const newOrder = new Order({
            userId,
            orderId,
            items: orderItems,
            totalAmount: grandTotal,
            deliveryCharge,
            handlingCharge,
            addresses: [selectedAddress],
            paymentMode,
            paymentStatus: paymentMode === 'Cash on Delivery' ? 'Pending' : 'Paid'
        });


        await newOrder.save();

        // Emit newOrder event to all connected admins via Socket.IO
        if (req.app && req.app.get('io')) {
            // You can customize the payload as needed
            req.app.get('io').emit('newOrder', {
                orderId: newOrder.orderId,
                user: {
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile
                },
                totalAmount: newOrder.totalAmount,
                createdAt: newOrder.createdAt
            });
        }

        // Clear user's cart
        await Cart.findOneAndDelete({ userId });

        // Populate the order with product details for response
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('items.productId', 'name price')
            .populate('userId', 'name email mobile');

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order: populatedOrder 
        });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get all orders for the authenticated user
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 24;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.productId', 'name price image')
            .populate('userId', 'name email mobile');

        // Transform orders to include product name and image alongside productId
        const transformedOrders = orders.map(order => {
            const obj = order.toObject();
            return {
                ...obj,
                items: order.items.map(item => ({
                    productId: item.productId?._id || item.productId,
                    productName: item.productId?.name || 'Unknown Product',
                    productImage: item.productId?.image || '',
                    quantity: item.quantity,
                    price: item.price,
                })),
            };
        });

        res.status(200).json(transformedOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get details of a specific order
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId', 'name price');
        if (!order || order.userId.toString() !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (Admin only)
router.put('/orders/:id/status', adminMiddleware, async (req, res) => {
    const { status } = req.body;

    if (!status || !['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = status;
        await order.save();

        res.status(200).json({ message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel an order
router.delete('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order || order.userId.toString() !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            return res.status(400).json({ error: 'Order is already cancelled' });
        }

        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orders by user ID (Admin only)
router.get('/orders/user/:userId', adminMiddleware, async (req, res) => {
    const { userId } = req.params;  
    try {
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'items.productId',
                select: 'name', // Fetch only the product name from the Product model
            });

        if (orders.length === 0) {
            // return the error msg no orders found
            return res.status(404).json({ error: 'No orders found for this user' });
        }

        // Transform orders to include product name alongside productId
        const transformedOrders = orders.map(order => ({
            ...order.toObject(),
            items: order.items.map(item => ({
                productId: item.productId?._id || item.productId, // Keep the productId
                productName: item.productId?.name || 'Unknown Product', // Include the name
                quantity: item.quantity,
                price: item.price,
            })),
        }));

        res.status(200).json(transformedOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get all orders (Admin only)
router.get('/all-orders', adminMiddleware, async (req, res) => {
    const { page = 1, limit = 24, status } = req.query;

    try {
        const query = {};
        if (status) {
            query.status = status;
        }

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        if (page > totalPages) {
            return res.status(200).json({ orders: [], totalPages });
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'name email mobile')
            .populate({
                path: 'items.productId',
                select: 'name price',
            });

        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderId: order.orderId,
            userId: order.userId,
            status: order.status,
            items: order.items.map(item => ({
                productId: item.productId?._id || item.productId,
                productName: item.productId?.name || 'Unknown Product',
                quantity: item.quantity,
                price: item.price,
            })),
            deliveryCharge: order.deliveryCharge,
            handlingCharge: order.handlingCharge,
            totalAmount: order.totalAmount,
            address: order.addresses[0]?.street || 'No address provided',
            paymentMode: order.paymentMode,
            createdAt: order.createdAt,
        }));

        res.status(200).json({ orders: transformedOrders, totalPages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
