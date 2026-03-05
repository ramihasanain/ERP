import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Moon, Sun, Bell, Search, Globe, ChevronDown, LogOut, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const navigate = useNavigate();
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const handleSignOut = () => {
        logout();
        navigate('/auth/signin');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTimeAgo = (timestamp) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleNotifClick = (notif) => {
        markAsRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
            setShowNotifs(false);
        }
    };

    return (
        <header style={{
            height: '4rem',
            background: 'var(--color-bg-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 30
        }}>
            {/* Search Bar */}
            <div style={{ width: '300px' }}>
                <Input
                    placeholder="Search everywhere..."
                    startIcon={<Search size={18} />}
                    style={{ height: '2.25rem', fontSize: '0.9rem' }}
                />
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Language Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                    <Globe size={18} color="var(--color-text-muted)" />
                    <select
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-main)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%'
                    }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        style={{
                            background: showNotifs ? 'var(--color-primary-50)' : 'transparent',
                            border: 'none',
                            color: showNotifs ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '2px', right: '2px',
                                minWidth: '16px', height: '16px',
                                backgroundColor: 'var(--color-error)',
                                borderRadius: '8px',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 4px',
                                border: '2px solid var(--color-bg-surface)'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifs && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)', right: 0,
                            width: '400px',
                            background: 'var(--color-bg-surface)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden',
                            zIndex: 100
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '0.875rem 1rem',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <span style={{
                                            padding: '1px 8px', borderRadius: '10px',
                                            background: 'var(--color-primary-600)', color: 'white',
                                            fontSize: '0.7rem', fontWeight: 700
                                        }}>{unreadCount}</span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-primary-600)', fontSize: '0.75rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                                    }}>
                                        <CheckCheck size={14} /> Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notification List */}
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                                        <Bell size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No notifications</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 8).map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotifClick(notif)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                display: 'flex', gap: '0.75rem',
                                                background: notif.read ? 'transparent' : 'var(--color-primary-50)',
                                                transition: 'background 0.15s',
                                                position: 'relative'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = notif.read ? 'var(--color-slate-50)' : 'var(--color-primary-100)'}
                                            onMouseOut={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--color-primary-50)'}
                                        >
                                            {/* Icon */}
                                            <div style={{
                                                width: '2.25rem', height: '2.25rem', borderRadius: '10px',
                                                background: 'var(--color-slate-100)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1rem', flexShrink: 0
                                            }}>
                                                {notif.icon}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <p style={{
                                                        fontSize: '0.82rem', fontWeight: notif.read ? 500 : 700,
                                                        color: 'var(--color-text-main)', margin: 0,
                                                        lineHeight: 1.3
                                                    }}>
                                                        {notif.title}
                                                    </p>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: 'var(--color-text-muted)', padding: '2px',
                                                            opacity: 0.5, flexShrink: 0
                                                        }}
                                                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                                                        onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                <p style={{
                                                    fontSize: '0.75rem', color: 'var(--color-text-secondary)',
                                                    margin: '2px 0 0', lineHeight: 1.4,
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {notif.message}
                                                </p>
                                                <p style={{
                                                    fontSize: '0.65rem', color: 'var(--color-text-muted)',
                                                    margin: '4px 0 0', fontWeight: 500
                                                }}>
                                                    {getTimeAgo(notif.timestamp)}
                                                </p>
                                            </div>

                                            {/* Unread dot */}
                                            {!notif.read && (
                                                <div style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: 'var(--color-primary-600)',
                                                    position: 'absolute', left: '6px', top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }} />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div style={{
                                    padding: '0.625rem', borderTop: '1px solid var(--color-border)',
                                    textAlign: 'center'
                                }}>
                                    <button
                                        onClick={() => { navigate('/admin/notifications'); setShowNotifs(false); }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--color-primary-600)', fontSize: '0.8rem',
                                            fontWeight: 600, padding: '0.25rem'
                                        }}
                                    >
                                        View All Notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '1.5rem', background: 'var(--color-border)' }} />

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        background: user?.role === 'admin' ? 'var(--color-primary-100)' : 'var(--color-success-dim)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: user?.role === 'admin' ? 'var(--color-primary-700)' : 'var(--color-success)',
                        fontWeight: 600,
                        fontSize: '0.86rem'
                    }}>
                        {user?.initials || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || 'User'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role || 'Guest'}</span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        title="Sign Out"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-muted)', padding: '4px',
                            borderRadius: '4px', display: 'flex'
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
