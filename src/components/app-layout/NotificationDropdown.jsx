import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationsContext';
import { Bell, CheckCheck, X } from 'lucide-react';

const notifUnreadBg = 'color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-surface))';
const notifUnreadHover = 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-surface))';
const notifReadHover = 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-surface))';
const notifIconWell = 'color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-card))';

const notifDropdownTitleStyle = {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--color-text-main)',
};

const notifMessageClampStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    margin: '2px 0 0',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
};

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

/**
 * @param {{ open: boolean; onRequestClose: () => void; panelAlign?: 'start' | 'end' }} props
 */
const NotificationDropdown = ({ open, onRequestClose, panelAlign = 'end' }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const navigate = useNavigate();
    const hoverTimersRef = useRef(new Map());

    const handleNotifClick = (notif) => {
        if (notif.link) {
            navigate(notif.link);
            onRequestClose();
        }
    };

    if (!open) {
        return null;
    }

    const panelPosition =
        panelAlign === 'start'
            ? { top: 'calc(100% + 8px)', left: 0, right: 'auto' }
            : { top: 'calc(100% + 8px)', right: 0, left: 'auto' };
    const panelWidth =
        panelAlign === 'start' ? 'min(400px, calc(100vw - 2rem))' : '400px';

    return (
        <div style={{
            position: 'absolute',
            ...panelPosition,
            width: panelWidth,
            maxWidth: 'calc(100vw - 2rem)',
            background: 'var(--color-bg-surface)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            zIndex: 140
        }}>
            <div style={{
                padding: '0.875rem 1rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={notifDropdownTitleStyle}>Notifications</h4>
                    {unreadCount > 0 ? (
                        <span style={{
                            padding: '1px 8px', borderRadius: '10px',
                            background: 'var(--color-primary-600)', color: 'white',
                            fontSize: '0.7rem', fontWeight: 700
                        }}>
                            {unreadCount}
                        </span>
                    ) : null}
                </div>
                {unreadCount > 0 ? (
                    <button type="button" onClick={markAllAsRead} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-primary-600)', fontSize: '0.75rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                        <CheckCheck size={14} /> Mark all read
                    </button>
                ) : null}
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                        <Bell size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No notifications</p>
                    </div>
                ) : (
                    notifications.slice(0, 8).map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            style={{
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--color-border)',
                                cursor: 'default',
                                display: 'flex', gap: '0.75rem',
                                background: notif.read ? 'transparent' : notifUnreadBg,
                                transition: 'background 0.15s',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!notif.read) {
                                    e.currentTarget.style.background = notifUnreadHover;
                                    if (!hoverTimersRef.current.has(notif.id)) {
                                        const t = window.setTimeout(() => {
                                            hoverTimersRef.current.delete(notif.id);
                                            markAsRead(notif.id);
                                        }, 250);
                                        hoverTimersRef.current.set(notif.id, t);
                                    }
                                }
                            }}
                            onMouseLeave={(e) => {
                                const t = hoverTimersRef.current.get(notif.id);
                                if (t) window.clearTimeout(t);
                                hoverTimersRef.current.delete(notif.id);
                                e.currentTarget.style.background = notif.read ? 'transparent' : notifUnreadBg;
                            }}
                        >
                            <div style={{
                                width: '2.25rem', height: '2.25rem', borderRadius: '10px',
                                background: notifIconWell,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', flexShrink: 0
                            }}>
                                {notif.icon}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <p style={{
                                        fontSize: '0.82rem', fontWeight: notif.read ? 500 : 700,
                                        color: 'var(--color-text-main)', margin: 0,
                                        lineHeight: 1.3,
                                        userSelect: 'text',
                                        cursor: 'text',
                                    }}>
                                        {notif.title}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'default',
                                            color: 'var(--color-text-muted)', padding: '2px',
                                            opacity: 0.5, flexShrink: 0
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.opacity = 1; }}
                                        onMouseOut={(e) => { e.currentTarget.style.opacity = 0.5; }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <p style={{ ...notifMessageClampStyle, userSelect: 'text', cursor: 'text' }}>{notif.message}</p>
                                <p style={{
                                    fontSize: '0.65rem', color: 'var(--color-text-muted)',
                                    margin: '4px 0 0', fontWeight: 500
                                }}>
                                    {getTimeAgo(notif.timestamp)}
                                </p>
                            </div>

                            {!notif.read ? (
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: 'var(--color-primary-600)',
                                    position: 'absolute', left: '6px', top: '50%',
                                    transform: 'translateY(-50%)'
                                }} />
                            ) : null}
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 ? (
                <div style={{
                    padding: '0.625rem', borderTop: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <button
                        type="button"
                        onClick={() => { navigate('/admin/notifications'); onRequestClose(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-primary-600)', fontSize: '0.8rem',
                            fontWeight: 600, padding: '0.25rem'
                        }}>
                        View All Notifications
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default NotificationDropdown;
