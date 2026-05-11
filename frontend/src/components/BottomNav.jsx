import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shirt, Sparkles, CalendarDays, BarChart2 } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Home size={22} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/wardrobe" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Shirt size={22} />
                <span>Wardrobe</span>
            </NavLink>
            <NavLink to="/stylist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Sparkles size={22} />
                <span>AI Stylist</span>
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <CalendarDays size={22} />
                <span>Calendar</span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BarChart2 size={22} />
                <span>Stats</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
