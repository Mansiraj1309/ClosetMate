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
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Diagnosis Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
    next();
});

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
console.log('Loading /api/community');
app.use('/api/community', require('./routes/community'));
console.log('All routes loaded.');

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/closetmate')
    .then((conn) => console.log(`✅ Connected to MongoDB: ${conn.connection.host}`))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('ClosetMate API is running!');
});

// Google Auth Callback serving route
app.get('/google-callback.html', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authenticating with Google...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #121214;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #6366f1;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <h3>Connecting your Google Account...</h3>
    <p style="color: #a1a1aa; font-size: 14px;">Please wait while we redirect you back to ClosetMate.</p>

    <script>
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const error = params.get('error');

            if (accessToken) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', accessToken }, '*');
                    setTimeout(() => { window.close(); }, 500);
                } else {
                    localStorage.setItem('google_auth_access_token', accessToken);
                    window.location.href = 'closetmate://google-auth#' + hash.substring(1);
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            } else if (error) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_FAILURE', error }, '*');
                    setTimeout(() => { window.close(); }, 500);
                } else {
                    localStorage.setItem('google_auth_error', error);
                    window.location.href = 'closetmate://google-auth#error=' + error;
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            }
        } else {
            document.body.innerHTML = "<h3>Error</h3><p style='color: #ef4444;'>No authentication details received from Google. Closing...</p>";
        }
    </script>
</body>
</html>`);
});

// Start Server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
});
