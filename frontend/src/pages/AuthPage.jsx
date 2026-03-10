import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
