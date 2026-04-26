import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/Shared/Input';
import NotificationDropdown from '@/components/app-layout/NotificationDropdown';
import LanguageMenu from '@/components/Shared/LanguageMenu';
import ThemeToggle from '@/components/Shared/ThemeToggle';

const headerBarStyle = {
    height: '4rem',
    background: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 30,
};

const searchColStyle = { width: '300px' };
const inputStyle = { height: '2.25rem', fontSize: '0.9rem' };
const rightActionsStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };
const notifWrapStyle = { position: 'relative' };
const bellBadgeStyle = {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '16px',
    height: '16px',
    backgroundColor: 'var(--color-error)',
    borderRadius: '8px',
    fontSize: '0.6rem',
    fontWeight: 500,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid var(--color-bg-surface)',
};
const dividerStyle = { width: '1px', height: '1.5rem', background: 'var(--color-border)' };
const profileRowStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' };
const profileTextColStyle = { display: 'flex', flexDirection: 'column', lineHeight: 1.1 };
const profileNameStyle = { fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' };
const profileRoleStyle = { fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' };
const signOutBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
};

const AppHeader = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [showNotifs, setShowNotifs] = useState(false);
    const [isCompactHeader, setIsCompactHeader] = useState(() => window.innerWidth < 1000);
    const notifRef = useRef(null);

    const handleSignOut = () => {
        logout();
        navigate('/auth/signin');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsCompactHeader(window.innerWidth < 1000);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const compactHeaderStyle = isCompactHeader
        ? { padding: '0 1rem', height: '3.5rem' }
        : { padding: headerBarStyle.padding, height: headerBarStyle.height };
    const compactSearchColStyle = isCompactHeader ? { width: '210px' } : searchColStyle;
    const compactInputStyle = isCompactHeader ? { ...inputStyle, height: '2rem', fontSize: '0.82rem' } : inputStyle;
    const compactRightActionsStyle = isCompactHeader ? { ...rightActionsStyle, gap: '0.625rem' } : rightActionsStyle;
    const compactToolbarGroupStyle = isCompactHeader ? { display: 'flex', alignItems: 'center', gap: '0.375rem' } : { display: 'flex', alignItems: 'center', gap: '0.5rem' };
    const compactDividerStyle = isCompactHeader ? { ...dividerStyle, height: '1.2rem' } : dividerStyle;
    const compactProfileRowStyle = isCompactHeader ? { ...profileRowStyle, gap: '0.5rem' } : profileRowStyle;
    const compactProfileNameStyle = isCompactHeader ? { ...profileNameStyle, fontSize: '0.82rem' } : profileNameStyle;
    const compactProfileRoleStyle = isCompactHeader ? { ...profileRoleStyle, fontSize: '0.68rem' } : profileRoleStyle;

    const avatarStyle = {
        width: isCompactHeader ? '1.75rem' : '2rem',
        height: isCompactHeader ? '1.75rem' : '2rem',
        background: user?.role === 'admin' ? 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-card))' : 'var(--color-success-dim)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: user?.role === 'admin' ? 'var(--color-primary-500)' : 'var(--color-success)',
        fontWeight: 500,
        fontSize: isCompactHeader ? '0.78rem' : '0.86rem',
    };

    const notifBellBtnStyle = {
        background: showNotifs ? 'color-mix(in srgb, var(--color-primary-600) 15%, var(--color-bg-surface))' : 'transparent',
        border: 'none',
        color: showNotifs ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        padding: isCompactHeader ? '0.42rem' : '0.5rem',
        borderRadius: '50%',
        position: 'relative',
        transition: 'all 0.2s',
    };

    const bellUnreadBadge = unreadCount
        ? React.createElement('span', { style: bellBadgeStyle }, unreadCount)
        : null;

    return (
        <header style={{ ...headerBarStyle, ...compactHeaderStyle }}>
            <div style={compactSearchColStyle}>
                <Input
                    placeholder="Search everywhere..."
                    startIcon={React.createElement(Search, { size: isCompactHeader ? 16 : 18 })}
                    style={compactInputStyle}
                />
            </div>

            <div style={compactRightActionsStyle}>
                <div style={compactToolbarGroupStyle}>
                    <ThemeToggle size={isCompactHeader ? 'sm' : 'md'} />
                    <LanguageMenu align="end" size={isCompactHeader ? 'sm' : 'md'} />
                </div>

                <div ref={notifRef} style={notifWrapStyle}>
                    <button type="button" onClick={() => setShowNotifs(!showNotifs)} style={notifBellBtnStyle}>
                        {React.createElement(Bell, { size: isCompactHeader ? 18 : 20 })}
                        {bellUnreadBadge}
                    </button>

                    <NotificationDropdown open={showNotifs} onRequestClose={() => setShowNotifs(false)} />
                </div>

                <div style={compactDividerStyle} />

                <div style={compactProfileRowStyle}>
                    <div style={avatarStyle}>{user?.initials || 'U'}</div>
                    <div style={profileTextColStyle}>
                        <span style={compactProfileNameStyle}>{user?.name || 'User'}</span>
                        <span style={compactProfileRoleStyle}>{user?.role || 'Guest'}</span>
                    </div>
                    <button type="button" onClick={handleSignOut} title="Sign Out" style={signOutBtnStyle}>
                        {React.createElement(LogOut, { size: isCompactHeader ? 14 : 16 })}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
