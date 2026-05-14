import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('closetmate_token'));
    const [loading, setLoading] = useState(true);

    // On mount, verify existing token
    useEffect(() => {
        if (token) {
            fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setUser(data))
                .catch(() => { logout(); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            localStorage.setItem('closetmate_token', data.token);
            setToken(data.token);
            setUser(data.user);
        } catch (err) {
            alert(`Login Error: ${err.message}. API URL: ${API_BASE}`);
            throw err;
        }
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        localStorage.setItem('closetmate_token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('closetmate_token');
        setToken(null);
        setUser(null);
    };

    const updateBudget = async (budget) => {
        const res = await fetch(`${API_BASE}/api/auth/budget`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ budget })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setUser(prev => ({ ...prev, budget: data.budget }));
        return data.budget;
    };

    const updateProfile = async (name) => {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setUser(data.user);
        return data.user;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateBudget, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
