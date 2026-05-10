import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import ThemeToggle from '@/components/Shared/ThemeToggle';
import LanguageMenu from '@/components/Shared/LanguageMenu';
import NotificationDropdown from '@/components/app-layout/NotificationDropdown';

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

/**
 * Theme, language, and notifications cluster (shared by AppHeader and mobile drawer).
 * @param {{
 *   compact?: boolean;
 *   notifPanelAlign?: 'start' | 'end';
 *   layout?: 'row' | 'stack';
 * }} props
 */
const HeaderIconTools = ({ compact = false, notifPanelAlign = 'end', layout = 'row' }) => {
    const { unreadCount } = useNotifications();
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const notifBellBtnStyle = {
        background: showNotifs ? 'color-mix(in srgb, var(--color-primary-600) 15%, var(--color-bg-surface))' : 'transparent',
        border: 'none',
        color: showNotifs ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        padding: compact ? '0.42rem' : '0.5rem',
        borderRadius: '50%',
        position: 'relative',
        transition: 'all 0.2s',
    };

    const bellUnreadBadge = unreadCount
        ? React.createElement('span', { style: bellBadgeStyle }, unreadCount)
        : null;

    const themeLang = (
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.375rem' : '0.5rem' }}>
            <ThemeToggle size={compact ? 'sm' : 'md'} />
            <LanguageMenu align="end" size={compact ? 'sm' : 'md'} />
        </div>
    );

    const notif = (
        <div ref={notifRef} style={{ position: 'relative' }}>
            <button type="button" onClick={() => setShowNotifs(!showNotifs)} style={notifBellBtnStyle}>
                {React.createElement(Bell, { size: compact ? 18 : 20 })}
                {bellUnreadBadge}
            </button>
            <NotificationDropdown
                open={showNotifs}
                onRequestClose={() => setShowNotifs(false)}
                panelAlign={notifPanelAlign}
            />
        </div>
    );

    if (layout === 'stack') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {themeLang}
                {notif}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.5rem' : '0.75rem' }}>
            {themeLang}
            {notif}
        </div>
    );
};

export default HeaderIconTools;
