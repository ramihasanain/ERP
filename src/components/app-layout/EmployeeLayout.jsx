import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Moon, Sun, Bell, User, LogOut } from 'lucide-react';

const EmployeeHeader = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        logout();
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
                <Link to="/employee/dashboard" style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Dashboard</Link>
                <Link to="/employee/requests" style={{ color: 'var(--color-text-secondary)' }}>My Requests</Link>
                <Link to="/employee/payslips" style={{ color: 'var(--color-text-secondary)' }}>Payslips</Link>
                <Link to="/employee/my-contract" style={{ color: 'var(--color-text-secondary)' }}>My Contract</Link>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
