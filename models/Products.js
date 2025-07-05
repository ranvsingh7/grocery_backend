const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // Price of the product
    stock: { type: Number, default: 0 }, // Stock quantity
    image: { type: String }, // URL to product image
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
