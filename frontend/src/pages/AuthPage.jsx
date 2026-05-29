import React, { useState } from 'react';
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

    // ── Google Gmail Modal state ──────────────────────────────────────────
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [gmailInput, setGmailInput] = useState('');
    const [gmailError, setGmailError] = useState('');
    const [gmailLoading, setGmailLoading] = useState(false);

    // ── Handlers ──────────────────────────────────────────────────────────

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

        if (!trimmed) {
            setGmailError('Please enter your Gmail address.');
            return;
        }
        if (!trimmed.includes('@')) {
            setGmailError('Please enter a valid email address.');
            return;
        }

        setGmailError('');
        setGmailLoading(true);
        try {
            // Derive a display name from the email (e.g. john.doe@gmail.com → John Doe)
            const localPart = trimmed.split('@')[0];
            const derivedName = localPart
                .replace(/[._-]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            await googleLogin(derivedName, trimmed);
            setShowGoogleModal(false);
        } catch (err) {
            setGmailError(err.message || 'Sign-in failed. Please try again.');
        } finally {
            setGmailLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-ambient-glow"></div>

            {/* ── Google Gmail Modal ───────────────────────────────── */}
            {showGoogleModal && (
                <div className="google-modal-overlay" onClick={closeGoogleModal}>
                    <div
                        className="google-modal glass-card"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
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

                        {/* Account chips — visual hints */}
                        <div className="google-account-hint">
                            <span className="account-hint-icon">✉️</span>
                            <span className="account-hint-text">Use your existing Google / Gmail account</span>
                        </div>

                        {/* Email input form */}
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

                            {gmailError && (
                                <div className="auth-error">{gmailError}</div>
                            )}

                            <button
                                type="submit"
                                className="cta-button auth-submit"
                                disabled={gmailLoading || !gmailInput.trim()}
                            >
                                {gmailLoading
                                    ? <Loader className="spin" size={20} />
                                    : <><span>Continue</span><ArrowRight size={18} /></>
                                }
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
                        {!isLogin && (
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
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
                                onChange={e => setEmail(e.target.value)}
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
                                onChange={e => setPassword(e.target.value)}
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
                            onClick={openGoogleModal}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" className="google-logo">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22z" />
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
