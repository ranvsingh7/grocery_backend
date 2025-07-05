const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    // username: { type: String, required: true, unique: true},
    userType: { 
        type: String, 
        required: true,
        enum: ['admin', 'user'],
        default: 'user'
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
    ]
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
