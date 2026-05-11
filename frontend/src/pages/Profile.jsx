import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Shield, LogOut, Settings, ChevronRight, Moon, Sun } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    if (!user) return null;

    return (
        <main className="profile-page fadeIn">
            <div className="profile-header-card glass-card">
                <div className="profile-avatar-large">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Profile" />
                    ) : (
                        <User size={40} />
                    )}
                </div>
                <h2>{user.username}</h2>
                <p className="profile-email"><Mail size={14} /> {user.email || 'user@example.com'}</p>
            </div>

            <div className="profile-settings-list">
                <div className="settings-section">
                    <h3>App Settings</h3>
                    <div className="settings-item glass-card" onClick={toggleTheme}>
                        <div className="item-left">
                            <div className="item-icon-wrap theme-icon">
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </div>
                            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </div>
                        <div className={`theme-switch ${isDarkMode ? 'on' : ''}`}></div>
                    </div>
                    
                    <div className="settings-item glass-card">
                        <div className="item-left">
                            <div className="item-icon-wrap">
                                <Settings size={20} />
                            </div>
                            <span>Edit Profile</span>
                        </div>
                        <ChevronRight size={18} opacity={0.5} />
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Account</h3>
                    <div className="settings-item glass-card">
                        <div className="item-left">
                            <div className="item-icon-wrap security-icon">
                                <Shield size={20} />
                            </div>
                            <span>Privacy & Security</span>
                        </div>
                        <ChevronRight size={18} opacity={0.5} />
                    </div>

                    <div className="settings-item glass-card logout-item" onClick={logout}>
                        <div className="item-left">
                            <div className="item-icon-wrap logout-icon">
                                <LogOut size={20} />
                            </div>
                            <span>Log Out</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="profile-footer">
                <p>ClosetMate v1.0.0</p>
                <p>Designed with ❤️ for Fashion Enthusiasts</p>
            </div>
        </main>
    );
};

export default Profile;
