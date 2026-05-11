import React, { useState, useEffect, useCallback } from 'react';
import API_BASE from '../api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, X, Shirt, ChevronLeft, Trash2 } from 'lucide-react';
import './OutfitCalendar.css';

const OutfitCalendar = () => {
    const { token } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [monthLogs, setMonthLogs] = useState([]); // all logs for current month
    const [selectedLog, setSelectedLog] = useState(null); // log for clicked day
    const [loadingLog, setLoadingLog] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get YYYY-MM for current calendar month
    const getMonthStr = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    };

    const fetchMonthLogs = useCallback(async (date) => {
        if (!token) return;
        const month = getMonthStr(date);
        try {
            const res = await fetch(`${API_BASE}/api/logs?month=${month}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMonthLogs(data);
            }
        } catch (err) {
            console.error('Error fetching month logs:', err);
        }
    }, [token]);

    useEffect(() => {
        fetchMonthLogs(selectedDate);
    }, [fetchMonthLogs]);

    // Check if a date has a log
    const getLogForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return monthLogs.find(log => {
            const logStr = new Date(log.date).toISOString().split('T')[0];
            return logStr === dateStr;
        });
    };

    const handleDateClick = async (date) => {
        setSelectedDate(date);
        const existingLog = getLogForDate(date);
        if (existingLog) {
            setSelectedLog(existingLog);
            setPanelOpen(true);
        } else {
            if (!isMobile) {
                setPanelOpen(false);
                setSelectedLog(null);
            }
        }
    };

    const handleMonthChange = ({ activeStartDate }) => {
        fetchMonthLogs(activeStartDate);
    };

    const handleDeleteLog = async () => {
        if (!selectedLog) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/logs/${selectedLog._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMonthLogs(prev => prev.filter(l => l._id !== selectedLog._id));
                setSelectedLog(null);
                setPanelOpen(false);
            }
        } catch (err) {
            console.error('Error deleting log:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const log = getLogForDate(date);
        if (!log) return null;
        return (
            <div className="cal-dot-wrapper">
                <div className="cal-dot" />
            </div>
        );
    };

    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        const log = getLogForDate(date);
        return log ? 'has-log' : '';
    };

    const formatDisplayDate = (date) => {
        return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="calendar-page fadeIn">
            <header className="calendar-header">
                <CalendarDays size={40} className="header-icon" />
                <h1 className="gradient-text">Outfit Calendar</h1>
                <p className="subtitle">Your personal fashion journal. Every outfit, every day.</p>
            </header>

            <div className="calendar-layout">
                {/* Calendar */}
                <div className="calendar-wrapper glass-card">
                    <Calendar
                        onChange={handleDateClick}
                        value={selectedDate}
                        onActiveStartDateChange={handleMonthChange}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                        maxDate={new Date()}
                        locale="en-IN"
                    />
                    <div className="cal-legend">
                        <div className="legend-dot" />
                        <span>Outfit logged</span>
                    </div>
                </div>

                {/* Side Panel (Desktop) or Bottom Drawer (Mobile) */}
                {isMobile && panelOpen && (
                    <div className="drawer-backdrop" onClick={() => setPanelOpen(false)} />
                )}
                
                <div className={`log-panel glass-card ${isMobile ? 'bottom-drawer' : ''} ${panelOpen ? 'panel-open' : 'panel-empty'}`}>
                    {isMobile && <div className="drawer-handle" />}
                    
                    {panelOpen && selectedLog ? (
                        <div className="panel-inner fadeIn">
                            <div className="panel-header">
                                <div>
                                    <h3>What you wore</h3>
                                    <p className="panel-date">{formatDisplayDate(selectedDate)}</p>
                                </div>
                                <button className="icon-btn close-panel" onClick={() => setPanelOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="log-scroll-area">
                                {selectedLog.occasion && (
                                    <div className="log-occasion-tag">
                                        🎯 {selectedLog.occasion}
                                    </div>
                                )}

                                <div className="log-items-grid">
                                    {selectedLog.itemIds?.map(item => (
                                        <div key={item._id} className="log-item-card">
                                            <div className="log-item-img-wrap">
                                                <img src={item.imageUrl} alt={item.name || item.category} />
                                            </div>
                                            <div className="log-item-info">
                                                <span className="log-item-name">{item.name || `${item.color} ${item.type || item.category}`}</span>
                                                <span className="log-item-cat">{item.category}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedLog.notes && (
                                    <div className="log-notes-section">
                                        <p className="log-notes">📝 {selectedLog.notes}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="delete-log-btn"
                                onClick={handleDeleteLog}
                                disabled={deleteLoading}
                            >
                                <Trash2 size={16} />
                                {deleteLoading ? 'Removing...' : 'Remove from History'}
                            </button>
                        </div>
                    ) : !isMobile ? (
                        <div className="panel-placeholder">
                            <Shirt size={48} className="placeholder-icon" />
                            <p>Select a day with a <span className="highlight">●</span> dot to view your outfit.</p>
                            <p className="placeholder-hint">Log outfits from the AI Stylist page.</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Monthly summary */}
            {monthLogs.length > 0 && (
                <section className="month-summary glass-card">
                    <h3>This Month's Outfits <span className="log-count">{monthLogs.length} logged</span></h3>
                    <div className="month-log-list">
                        {monthLogs.map(log => (
                            <div
                                key={log._id}
                                className="month-log-row"
                                onClick={() => {
                                    const d = new Date(log.date);
                                    setSelectedDate(d);
                                    setSelectedLog(log);
                                    setPanelOpen(true);
                                }}
                            >
                                <span className="month-log-date">
                                    {new Date(log.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="month-log-occasion">{log.occasion || 'No occasion set'}</span>
                                <div className="month-log-thumbs">
                                    {log.itemIds?.slice(0, 3).map(item => (
                                        <img key={item._id} src={item.imageUrl} alt="" className="month-thumb" />
                                    ))}
                                    {log.itemIds?.length > 3 && (
                                        <span className="thumb-more">+{log.itemIds.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default OutfitCalendar;
