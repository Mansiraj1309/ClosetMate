import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader, X as XIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

// Detect if running inside a Capacitor native app (Android / iOS)
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

const AuthPage = () => {
    const { login, register, googleLogin } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Gmail modal (web fallback)
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [gmailInput, setGmailInput] = useState('');
    const [gmailError, setGmailError] = useState('');
    const [gmailLoading, setGmailLoading] = useState(false);

    // ── Email / Password ──────────────────────────────────────────────────
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

    // ── Native Google Sign-In (Android & iOS) ─────────────────────────────
    const handleNativeGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            // Dynamically import to avoid build errors on web
            const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

            const platform = window.Capacitor?.getPlatform() || 'web';
            const iosClientId = '1044175339595-8fkaen8fdchjps04quvd8kgnehj08r7h.apps.googleusercontent.com';
            const webClientId = '1044175339595-gptets0htodu6uq5u568p1l2v5gjnoks.apps.googleusercontent.com';
            const activeClientId = platform === 'ios' ? iosClientId : webClientId;

            // Initialize (safe to call multiple times)
            await GoogleAuth.initialize({
                clientId: activeClientId,
                scopes: ['profile', 'email'],
                grantOfflineAccess: false,
            });

            const user = await GoogleAuth.signIn();

            const gEmail = user?.email || user?.authentication?.idToken;
            const gName  = user?.name  || user?.displayName || 'Google User';

            if (!user?.email) {
                throw new Error('Could not retrieve email from Google. Please try again.');
            }

            await googleLogin(gName, user.email);
        } catch (err) {
            if (err?.message?.includes('cancelled') || err?.message?.includes('cancel') || err?.code === '12501') {
                // User cancelled — no error message needed
                setLoading(false);
                return;
            }
            console.error('Native Google Sign-In error:', err);
            setError('Google Sign-In configuration error. Opening manual fallback.');
            
            // Graceful fallback: Open manual input modal if native SDK fails
            setTimeout(() => {
                openGoogleModal();
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    // ── Web Gmail Modal (browser fallback) ───────────────────────────────
    const openGoogleModal = () => {
        setGmailInput('');
        setGmailError('');
        setShowGoogleModal(true);
    };

    const closeGoogleModal = () => {
        if (gmailLoading) return;
        setShowGoogleModal(false);
        setGmailInput('');
        setGmailError('');
    };

    const handleGmailSubmit = async (e) => {
        e.preventDefault();
        const trimmed = gmailInput.trim().toLowerCase();
        if (!trimmed) { setGmailError('Please enter your Gmail address.'); return; }
        if (!trimmed.includes('@')) { setGmailError('Please enter a valid email address.'); return; }

        setGmailError('');
        setGmailLoading(true);
        try {
            const localPart = trimmed.split('@')[0];
            const derivedName = localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            await googleLogin(derivedName, trimmed);
            setShowGoogleModal(false);
        } catch (err) {
            setGmailError(err.message || 'Sign-in failed. Please try again.');
        } finally {
            setGmailLoading(false);
        }
    };

    // ── Web Google Sign-In Popup ──────────────────────────────────────────
    const handleWebGoogleSignIn = () => {
        setError('');
        setLoading(true);

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1044175339595-gptets0htodu6uq5u568p1l2v5gjnoks.apps.googleusercontent.com';
        const redirectUri = window.location.origin;
        const scope = 'openid email profile';
        const responseType = 'token';
        
        // Build Google OAuth2 authorization URL
        // Using prompt=select_account forces Google to show their active account chooser list
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&prompt=select_account`;
        
        // Center the popup window on screen
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
            authUrl,
            'GoogleSignIn',
            `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,status=no,location=no`
        );
        
        if (!popup) {
            setError('Popup blocked! Please allow popups for this site to sign in with Google.');
            setLoading(false);
            return;
        }
        
        const checkPopupInterval = setInterval(async () => {
            if (!popup || popup.closed) {
                clearInterval(checkPopupInterval);
                setLoading(false);
                return;
            }
            
            try {
                // Check if popup has redirected back to our origin
                const popupUrl = popup.location.href;
                
                if (popupUrl && popupUrl.startsWith(redirectUri)) {
                    clearInterval(checkPopupInterval);
                    const hash = popup.location.hash;
                    popup.close();
                    
                    if (hash) {
                        const params = new URLSearchParams(hash.substring(1));
                        const accessToken = params.get('access_token');
                        
                        if (accessToken) {
                            // Fetch real user info from Google's userinfo API
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
                        } else {
                            throw new Error('Google Sign-In failed to retrieve token.');
                        }
                    } else {
                        throw new Error('Failed to retrieve authentication token from Google.');
                    }
                }
            } catch (err) {
                // Cross-origin exceptions are expected until Google redirects back to our origin.
                if (err.name && err.name !== 'SecurityError' && !err.message.includes('Permission denied') && !err.message.includes('Block a frame')) {
                    clearInterval(checkPopupInterval);
                    setError(err.message);
                    setLoading(false);
                }
            }
        }, 500);
    };

    // Route the button to native or web handler
    const handleGoogleBtn = () => {
        if (isNative()) {
            handleNativeGoogleSignIn();
        } else {
            // On desktop/mobile web, open the genuine Google Accounts selector popup
            handleWebGoogleSignIn();
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-ambient-glow"></div>

            {/* ── Web Gmail Modal (shown only on browsers) ─────────────── */}
            {showGoogleModal && (
                <div className="google-modal-overlay" onClick={closeGoogleModal}>
                    <div className="google-modal glass-card" onClick={e => e.stopPropagation()}>
                        <div className="google-modal-header">
                            <svg viewBox="0 0 24 24" className="google-modal-logo">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <div>
                                <h3 className="google-modal-title">Sign in with Google</h3>
                                <p className="google-modal-subtitle">Enter your Gmail address to continue</p>
                            </div>
                            <button className="google-modal-close" onClick={closeGoogleModal} disabled={gmailLoading}>
                                <XIcon size={18} />
                            </button>
                        </div>

                        <div className="google-account-hint">
                            <span className="account-hint-icon">✉️</span>
                            <span className="account-hint-text">Use your existing Google / Gmail account</span>
                        </div>

                        <form onSubmit={handleGmailSubmit} className="google-modal-form">
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="yourname@gmail.com"
                                    value={gmailInput}
                                    onChange={e => setGmailInput(e.target.value)}
                                    autoFocus
                                    autoComplete="email"
                                    disabled={gmailLoading}
                                    inputMode="email"
                                />
                            </div>
                            {gmailError && <div className="auth-error">{gmailError}</div>}
                            <button type="submit" className="cta-button auth-submit" disabled={gmailLoading || !gmailInput.trim()}>
                                {gmailLoading ? <Loader className="spin" size={20} /> : <><span>Continue</span><ArrowRight size={18} /></>}
                            </button>
                        </form>

                        <p className="google-modal-note">
                            New users are registered automatically. Existing accounts are recognised instantly.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Main Auth Card ───────────────────────────────────── */}
            <div className="auth-container">
                <div className="auth-brand">
                    <Sparkles size={40} className="auth-logo-icon" />
                    <h1 className="gradient-text">ClosetMate</h1>
                    <p className="auth-tagline">Your AI-powered virtual wardrobe</p>
                </div>

                <div className="auth-card glass-card">
                    <div className="auth-tabs">
                        <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>
                            Sign In
                        </button>
                        <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLogin && (
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
                            </div>
                        )}
                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                        </div>
                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading} />
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="cta-button auth-submit" disabled={loading}>
                            {loading ? <Loader className="spin" size={20} /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
                        </button>

                        <div className="google-divider">OR</div>

                        <button type="button" className="google-btn" onClick={handleGoogleBtn} disabled={loading}>
                            <svg viewBox="0 0 24 24" className="google-logo">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
                            <button 
                                type="button" 
                                className="auth-switch-btn" 
                                onClick={openGoogleModal}
                                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                            >
                                🔑 Having issues? Sign in manually with Gmail
                            </button>
                        </div>
                    </form>

                    <p className="auth-footer">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button className="auth-switch-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
