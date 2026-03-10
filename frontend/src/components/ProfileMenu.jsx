import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Share2, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfileMenu.css';

const ProfileMenu = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleShare = async () => {
        try {
            await navigator.share({
                title: 'ClosetMate',
                text: 'Check out ClosetMate — your AI-powered virtual wardrobe!',
                url: window.location.origin
            });
        } catch {
            navigator.clipboard.writeText(window.location.origin);
            alert('Link copied to clipboard!');
        }
        setIsOpen(false);
    };

    const handleLogout = () => {
        setIsOpen(false);
        logout();
    };

    // Get initials for avatar
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div className="profile-menu-wrapper" ref={menuRef}>
            <button
                className="profile-avatar"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Profile menu"
            >
                <span className="avatar-initials">{initials}</span>
            </button>

            {isOpen && (
                <div className="profile-dropdown">
                    <div className="dropdown-header">
                        <div className="dropdown-avatar">
                            <span className="avatar-initials-sm">{initials}</span>
                        </div>
                        <div>
                            <p className="dropdown-name">{user?.name || 'User'}</p>
                            <p className="dropdown-email">{user?.email || ''}</p>
                        </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item">
                        <User size={16} /> My Profile
                    </button>
                    <button className="dropdown-item">
                        <Settings size={16} /> Settings
                    </button>
                    <button className="dropdown-item" onClick={handleShare}>
                        <Share2 size={16} /> Share ClosetMate
                    </button>
                    <button className="dropdown-item">
                        <HelpCircle size={16} /> Help & Support
                    </button>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                        <LogOut size={16} /> Log Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;
