console.log("--> Starting server.js script execution...");
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — fixes ECONNREFUSED on ISPs that block Atlas SRV records
// dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
console.log('Loading /api/auth');
app.use('/api/auth', require('./routes/auth'));
console.log('Loading /api/wardrobe');
app.use('/api/wardrobe', require('./routes/wardrobe'));
console.log('Loading /api/stylist');
app.use('/api/stylist', require('./routes/stylist'));
console.log('Loading /api/stats');
app.use('/api/stats', require('./routes/stats'));
console.log('Loading /api/logs');
app.use('/api/logs', require('./routes/logs'));
console.log('All routes loaded.');

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/closetmate')
    .then((conn) => console.log(`✅ Connected to MongoDB: ${conn.connection.host}`))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('ClosetMate API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
