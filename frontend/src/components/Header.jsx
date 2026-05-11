import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user } = useAuth();

    return (
        <header className="app-header glass-card">
            <div className="header-left">
                <Link to="/" className="app-logo">
                    <span className="logo-text">Closet<span>Mate</span></span>
                </Link>
            </div>
            
            <div className="header-right">
                <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <button className="icon-btn notifications" aria-label="Notifications">
                    <Bell size={20} />
                </button>
                
                <Link to="/profile" className="profile-btn" aria-label="Profile">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="avatar-img" />
                    ) : (
                        <div className="avatar-placeholder">
                            <User size={20} />
                        </div>
                    )}
                </Link>
            </div>
        </header>
    );
};

export default Header;
