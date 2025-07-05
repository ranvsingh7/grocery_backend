const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register a new user
router.post("/signup", async (req, res) => {
    const { name, email, password, mobile, username, userType } = req.body;

    try {
        const existingEmail = await User.findOne({ email });
        const existingMobile = await User.findOne({ mobile });
        // const existingUsername = await User.findOne({ username });
        const mobileLength = mobile.length !== 10;
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (existingMobile) {
            return res.status(400).json({ message: "Mobile already exists" });
        }
        // if (existingUsername) {
        //     return res.status(400).json({ message: "User name already exists" });
        // }
        if(mobileLength){
            return res.status(400).json({ message: "Mobile number should be 10 digit" });
        }

        const user = new User({ name, email, password, mobile, username, userType });
        await user.save();

        // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        //     expiresIn: "1d",
        // });

        res.status(201).json( {message: "Account created successfull"} );
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Login a user
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role: user.userType,  }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.status(200).json({ token, message: "Login successfull" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
