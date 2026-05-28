import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader, X as XIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
    const { login, register, googleLogin } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dynamic Google Access Token Login handler
    const handleAccessTokenLogin = async (accessToken) => {
        setError('');
        setLoading(true);
        try {
            // Fetch real user info from Google's People API
            const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            if (!response.ok) throw new Error('Failed to fetch profile details from Google');
            
            const profileData = await response.json();
            const { name: gName, email: gEmail } = profileData;
            
            if (gEmail) {
                // Authenticate / register via our backend
                await googleLogin(gName || 'Google User', gEmail);
            } else {
                throw new Error('No email address returned from Google account');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Listen for Google Auth callback messaging & storage hooks
    useEffect(() => {
        // 1. Popup cross-origin message listener
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                const token = event.data.accessToken;
                if (token) {
                    handleAccessTokenLogin(token);
                }
            } else if (event.data && event.data.type === 'GOOGLE_AUTH_FAILURE') {
                setError(event.data.error || 'Google Sign-In failed');
            }
        };

        window.addEventListener('message', handleMessage);

        // 2. Full-page redirect storage listener fallback (e.g. mobile Safari/Chrome)
        const token = localStorage.getItem('google_auth_access_token');
        if (token) {
            localStorage.removeItem('google_auth_access_token');
            handleAccessTokenLogin(token);
        }

        const authError = localStorage.getItem('google_auth_error');
        if (authError) {
            localStorage.removeItem('google_auth_error');
            setError(authError);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleGoogleSignIn = () => {
        setError('');
        setLoading(true);

        const clientId = '1042784534726-25f01n88j0p6o2bphl9r7tbe99k4v27t.apps.googleusercontent.com';
        
        // Dynamically determine the redirect URI based on environment
        const redirectUri = window.location.hostname === 'localhost' 
            ? 'http://localhost:5173/google-callback.html' 
            : 'https://closetmate-n5l2.onrender.com/google-callback.html';
            
        const scope = 'openid email profile';
        const responseType = 'token';
        
        // Build Google OAuth2 authorization URL
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&prompt=select_account`;
        
        // Attempt popup opening centered on screen
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        try {
            const popup = window.open(
                authUrl,
                'GoogleSignIn',
                `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,status=no,location=no`
            );
            
            // If the popup is blocked, fall back instantly to direct full page redirection
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                console.log('Popup blocked or failed. Redirecting directly...');
                window.location.href = authUrl;
            } else {
                // Periodically check if popup was closed by user without signing in
                const checkClosedInterval = setInterval(() => {
                    if (!popup || popup.closed) {
                        clearInterval(checkClosedInterval);
                        setLoading(false);
                    }
                }, 1000);
            }
        } catch (e) {
            console.log('Exception while opening popup, redirecting directly:', e);
            window.location.href = authUrl;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!name.trim()) throw new Error('Name is required');
                await register(name, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-ambient-glow"></div>

            <div className="auth-container">
                <div className="auth-brand">
                    <Sparkles size={40} className="auth-logo-icon" />
                    <h1 className="gradient-text">ClosetMate</h1>
                    <p className="auth-tagline">Your AI-powered virtual wardrobe</p>
                </div>

                <div className="auth-card glass-card">
                    {/* Tab Switcher */}
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => { setIsLogin(true); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => { setIsLogin(false); setError(''); }}
                        >
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Name field — only on register */}
                        {!isLogin && (
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="cta-button auth-submit" disabled={loading}>
                            {loading
                                ? <Loader className="spin" size={20} />
                                : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                            }
                        </button>

                        <div className="google-divider">OR</div>

                        <button 
                            type="button" 
                            className="google-btn" 
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" className="google-logo">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-1.07-1.37-1.39-2.18z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <p className="auth-footer">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            className="auth-switch-btn"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
