import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, Bell, User, LogOut } from 'lucide-react';
import { useTimeTrackerStore } from '@/store/timeTrackerStore';
import { clearTenantDomain } from '@/services/auth';

const EmployeeHeader = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const activeActivity = useTimeTrackerStore((s) => s.activeActivity);
    const stop = useTimeTrackerStore((s) => s.stop);
    const [elapsedTime, setElapsedTime] = useState(0);

    const isRunning = activeActivity?.status === 'running';
    const startedAtLabel = useMemo(() => {
        if (!isRunning) return '';
        const d = new Date(activeActivity.startTime);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString();
    }, [activeActivity?.startTime, isRunning]);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - new Date(activeActivity.startTime).getTime()) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [activeActivity?.startTime, isRunning]);

    const formatDuration = (seconds) => {
        const s = Math.max(0, Number(seconds) || 0);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleSignOut = () => {
        logout();
        clearTenantDomain();
        navigate('/auth/signin');
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', background: 'var(--color-primary-600)', borderRadius: '0.5rem' }} />
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>UnifiedCore <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Employee</span></span>
            </div>

            <nav style={{ display: 'flex', gap: '2rem' }}>
                <NavLink
                    to="/employee/dashboard"
                    end
                    style={({ isActive }) => ({
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        paddingBottom: '0.25rem',
                        borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                    })}
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/employee/requests"
                    style={({ isActive }) => ({
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        paddingBottom: '0.25rem',
                        borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                    })}
                >
                    My Requests
                </NavLink>
                <NavLink
                    to="/employee/payslips"
                    style={({ isActive }) => ({
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        paddingBottom: '0.25rem',
                        borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                    })}
                >
                    Payslips
                </NavLink>
                <NavLink
                    to="/employee/my-contract"
                    style={({ isActive }) => ({
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        paddingBottom: '0.25rem',
                        borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                    })}
                >
                    My Contract
                </NavLink>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isRunning && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '999px',
                        border: '1px solid var(--color-success)',
                        background: 'var(--color-success-dim)',
                        color: 'var(--color-success)',
                        maxWidth: 360,
                    }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '1px' }}>
                            {formatDuration(elapsedTime)}
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                        }} title={activeActivity?.description || ''}>
                            {activeActivity?.description || 'Running timer'}
                        </div>
                        {startedAtLabel && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {startedAtLabel}
                            </div>
                        )}
                        <button
                            onClick={() => stop()}
                            style={{
                                background: 'var(--color-error)',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'white',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                            }}
                            title="Stop timer"
                        >
                            Stop
                        </button>
                    </div>
                )}
                <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: 'var(--color-success-dim)', color: 'var(--color-success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.8rem'
                    }}>
                        {user?.initials || 'U'}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.name || 'Employee'}</span>
                </div>
                <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', display: 'flex', padding: '4px'
                    }}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

const EmployeeLayout = () => {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-body)' }}>
            <EmployeeHeader />
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default EmployeeLayout;
