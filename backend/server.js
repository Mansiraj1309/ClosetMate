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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0d0f1a 0%, #1a1035 100%);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
            padding: 20px;
        }
        .logo { font-size: 2rem; margin-bottom: 16px; }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #8b5cf6;
            animation: spin 0.9s linear infinite;
            margin-bottom: 24px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h3 { font-size: 1.2rem; margin-bottom: 8px; }
        p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="logo">✨</div>
    <div class="spinner"></div>
    <h3>Signing you in...</h3>
    <p>Please wait, redirecting back to ClosetMate.</p>

    <script>
        (function() {
            var hash = window.location.hash;
            if (!hash || hash.length <= 1) {
                // No hash — cancelled or error before redirect
                document.querySelector('h3').textContent = 'Sign-in cancelled';
                document.querySelector('p').textContent = 'Redirecting back to ClosetMate...';
                setTimeout(function() {
                    window.location.replace('https://closet-mate.vercel.app/auth');
                }, 1500);
                return;
            }

            var params = new URLSearchParams(hash.substring(1));
            var accessToken = params.get('access_token');
            var error = params.get('error');

            if (accessToken) {
                if (window.opener && !window.opener.closed) {
                    // ✅ Desktop popup flow — post message to parent tab and close
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', accessToken: accessToken }, '*');
                    setTimeout(function() { window.close(); }, 500);
                } else {
                    // ✅ Mobile full-page redirect flow (Android/iOS external browser)
                    // Pass token as a URL query parameter — localStorage is cross-origin blocked
                    // The frontend reads ?gat= on load and processes the login
                    window.location.replace('https://closet-mate.vercel.app/auth?gat=' + encodeURIComponent(accessToken));
                }
            } else if (error) {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_FAILURE', error: error }, '*');
                    setTimeout(function() { window.close(); }, 500);
                } else {
                    window.location.replace('https://closet-mate.vercel.app/auth?gerror=' + encodeURIComponent(error));
                }
            } else {
                setTimeout(function() {
                    window.location.replace('https://closet-mate.vercel.app/auth');
                }, 1500);
            }
        })();
    </script>
</body>
</html>`);
});

// Start Server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
});
