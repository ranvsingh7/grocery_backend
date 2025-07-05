const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at the time of order
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, unique: true }, // Unique order identifier
    items: [orderItemSchema], // List of items in the order
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    handlingCharge: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    addresses: [
        {
            label: { type: String, default: 'Home' },
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' },
            landmark: String,
            mobile: String,
            isDefault: { type: Boolean, default: false },
            location: {
                lat: { type: Number },
                lng: { type: Number }
            }
        }
    ],
    paymentMode: { type: String, enum: ['Cash on Delivery', 'Online'], default: 'Cash on Delivery' },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
