import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import LanguageMenu from '@/components/Shared/LanguageMenu';
import ThemeToggle from '@/components/Shared/ThemeToggle';

const AuthLayout = ({ children, title, subtitle }) => {
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
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 10 }}>
                <ThemeToggle size="sm" />
                <LanguageMenu align="end" size="sm" />
            </div>

            <div style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/" className="auth-logo-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
                        <div className="auth-logo-mark" style={{ width: '2.5rem', height: '2.5rem', background: 'var(--color-primary-600)', borderRadius: '0.5rem' }} />
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
            <style>{`
                .auth-logo-link {
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }

                .auth-logo-mark {
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }

                .auth-logo-link:hover {
                    transform: translateY(-1px);
                    opacity: 0.95;
                }

                .auth-logo-link:hover .auth-logo-mark {
                    transform: scale(1.06);
                    box-shadow: var(--shadow-md);
                    background: var(--color-primary-700);
                }
            `}</style>
        </div>
    );
};

export default AuthLayout;
