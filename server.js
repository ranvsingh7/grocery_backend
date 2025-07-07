const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const customerRoutes = require("./routes/customer");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const salesAnalyticsRoutes = require("./routes/sales-analytics");
const uploadRoutes = require('./routes/upload');


// CORS configuration (move up)
const allowedOrigins = [
    "http://localhost:3000", // Local frontend
    "https://rocketstore.ranveersingh.me", // Deployed frontend
  ];
  
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);


// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Admin connected via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});


const url = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://grocery-frontend-rosy.vercel.app";


// CORS configuration
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});


// Middleware
app.use(bodyParser.json());

// Database Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", productsRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use("/api", customerRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", salesAnalyticsRoutes);
app.use('/api', uploadRoutes);


const PORT = process.env.PORT || 6000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
