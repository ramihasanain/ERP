import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useNotifications } from '@/context/NotificationsContext';
import { Bell, CheckCheck, Trash2, Filter, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const notifUnreadBg = 'color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-surface))';
const notifUnreadHover = 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-surface))';
const notifReadHover = 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-surface))';

const typeColors = {
    invoice: { bg: 'color-mix(in srgb, var(--color-info) 22%, var(--color-bg-card))', color: 'var(--color-info)' },
    leave: { bg: 'color-mix(in srgb, var(--color-warning) 22%, var(--color-bg-card))', color: 'var(--color-warning)' },
    audit: { bg: 'color-mix(in srgb, var(--color-secondary-600) 22%, var(--color-bg-card))', color: 'var(--color-secondary-400)' },
    payroll: { bg: 'color-mix(in srgb, var(--color-success) 22%, var(--color-bg-card))', color: 'var(--color-success)' },
    system: { bg: 'color-mix(in srgb, var(--color-text-muted) 18%, var(--color-bg-card))', color: 'var(--color-text-secondary)' },
    inventory: { bg: 'color-mix(in srgb, var(--color-error) 22%, var(--color-bg-card))', color: 'var(--color-error)' },
    payment: { bg: 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-card))', color: 'var(--color-primary-500)' },
    approval: { bg: 'color-mix(in srgb, var(--color-success) 22%, var(--color-bg-card))', color: 'var(--color-success)' },
    contract: { bg: 'color-mix(in srgb, var(--color-warning) 22%, var(--color-bg-card))', color: 'var(--color-warning)' },
    report: { bg: 'color-mix(in srgb, var(--color-info) 22%, var(--color-bg-card))', color: 'var(--color-info)' }
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
    const [filter, setFilter] = useState('all'); // all | unread | read

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const getTimeAgo = (timestamp) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Notifications</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'All caught up!'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" icon={<CheckCheck size={14} />} onClick={markAllAsRead}>
                            Mark All Read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearAll} style={{ color: 'var(--color-error)' }}>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)' }}>
                {[
                    { id: 'all', label: `All (${notifications.length})` },
                    { id: 'unread', label: `Unread (${unreadCount})` },
                    { id: 'read', label: `Read (${notifications.length - unreadCount})` }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                        padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer',
                        borderBottom: filter === tab.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: filter === tab.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', marginBottom: '-2px'
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {filtered.length === 0 ? (
                <Card className="padding-lg" style={{ textAlign: 'center' }}>
                    <Bell size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>No notifications</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {filter === 'unread' ? 'All caught up! No unread notifications.' : 'Your notification inbox is empty.'}
                    </p>
                </Card>
            ) : (
                <Card className="padding-none">
                    {filtered.map((notif, index) => {
                        const tc = typeColors[notif.type] || typeColors.system;
                        return (
                            <div
                                key={notif.id}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: index < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                    background: notif.read ? 'transparent' : notifUnreadBg,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s'
                                }}
                                onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) navigate(notif.link);
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = notif.read ? notifReadHover : notifUnreadHover; }}
                                onMouseOut={e => { e.currentTarget.style.background = notif.read ? 'transparent' : notifUnreadBg; }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                                    background: tc.bg, color: tc.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem', flexShrink: 0
                                }}>
                                    {notif.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ fontWeight: notif.read ? 500 : 700, fontSize: '0.9rem', marginBottom: '0.2rem', color: 'var(--color-text-main)' }}>{notif.title}</h4>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{notif.message}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{getTimeAgo(notif.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px',
                                            background: tc.bg, color: tc.color, fontWeight: 600, textTransform: 'capitalize'
                                        }}>
                                            {notif.type}
                                        </span>
                                        {!notif.read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--color-primary-600)', fontSize: '0.7rem', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0
                                                }}
                                            >
                                                <Check size={12} /> Mark read
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--color-text-muted)', fontSize: '0.7rem',
                                                display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0,
                                                marginLeft: 'auto'
                                            }}
                                        >
                                            <X size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </Card>
            )}
        </div>
    );
};

export default NotificationsPage;
