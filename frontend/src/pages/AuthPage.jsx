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

    // Google simulated login state variables
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);

    const handleGoogleSignIn = async (gName, gEmail) => {
        if (!gEmail.trim()) { alert('Email is required'); return; }
        setError('');
        setLoading(true);
        setShowGoogleModal(false);
        setShowCustomForm(false);

        try {
            await googleLogin(gName || 'Google User', gEmail);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                            onClick={() => { setShowGoogleModal(true); setError(''); }}
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

            {/* Simulated Google Account Chooser Modal Overlay */}
            {showGoogleModal && (
                <div className="google-modal-overlay">
                    <div className="google-modal-content">
                        <button className="google-modal-close" onClick={() => { setShowGoogleModal(false); setShowCustomForm(false); }}>
                            <XIcon size={18} />
                        </button>

                        <div className="google-header-logo">
                            <svg viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-1.07-1.37-1.39-2.18z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                        </div>

                        <h2 className="google-modal-title">Choose an account</h2>
                        <p className="google-modal-subtitle">to continue to <strong style={{color:'var(--accent-primary)'}}>ClosetMate</strong></p>

                        <div className="google-account-list">
                            {/* Option 1: Abhinav Anand */}
                            <button 
                                className="google-account-item" 
                                onClick={() => handleGoogleSignIn('Abhinav Anand', 'abhinavanand26@gmail.com')}
                                disabled={loading}
                            >
                                <div className="google-avatar">A</div>
                                <div className="google-account-details">
                                    <span className="google-account-name">Abhinav Anand</span>
                                    <span className="google-account-email">abhinavanand26@gmail.com</span>
                                </div>
                            </button>

                            {/* Option 2: Use another account */}
                            {!showCustomForm ? (
                                <button 
                                    className="google-account-item" 
                                    onClick={() => setShowCustomForm(true)}
                                    disabled={loading}
                                >
                                    <div className="google-avatar-icon">👤</div>
                                    <div className="google-account-details">
                                        <span className="google-account-name" style={{color:'#1a73e8'}}>Use another account</span>
                                        <span className="google-account-email">Sign in with a different Gmail</span>
                                    </div>
                                </button>
                            ) : (
                                <div className="google-custom-account-form">
                                    <input 
                                        type="text" 
                                        placeholder="Full Name" 
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        className="google-custom-input"
                                        required
                                    />
                                    <input 
                                        type="email" 
                                        placeholder="email@gmail.com" 
                                        value={customEmail}
                                        onChange={(e) => setCustomEmail(e.target.value)}
                                        className="google-custom-input"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="google-custom-submit"
                                        onClick={() => handleGoogleSignIn(customName, customEmail)}
                                        disabled={loading}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="google-modal-footer">
                            To continue, Google will share your name, email address, profile picture, and language preference with ClosetMate. See their <a href="#privacy">Privacy Policy</a> and <a href="#terms">Terms of Service</a>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
