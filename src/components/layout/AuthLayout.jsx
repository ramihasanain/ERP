import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-body)',
            position: 'relative',
            padding: '1rem'
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.4,
                backgroundImage: 'radial-gradient(var(--color-slate-200) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                zIndex: 0
            }} />

            {/* Top Bar for controls */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                <button
                    onClick={toggleTheme}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-main)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="en">EN</option>
                    <option value="ar">AR</option>
                    <option value="de">DE</option>
                </select>
            </div>

            <div style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', background: 'var(--color-primary-600)', borderRadius: '0.5rem' }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>UnifiedCore</span>
                    </Link>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h1>
                    {subtitle && <p style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
                </div>

                <Card className="padding-lg" style={{ boxShadow: 'var(--shadow-xl)' }}>
                    {children}
                </Card>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    &copy; {new Date().getFullYear()} UnifiedCore
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
