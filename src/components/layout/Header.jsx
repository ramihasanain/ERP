import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Moon, Sun, Bell, Search, Globe, ChevronDown } from 'lucide-react';
import Input from '../common/Input';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();

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
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        position: 'relative'
                    }}
                >
                    <Bell size={20} />
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--color-error)',
                        borderRadius: '50%'
                    }} />
                </button>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '1.5rem', background: 'var(--color-border)' }} />

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        background: 'var(--color-primary-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary-700)',
                        fontWeight: 600,
                        fontSize: '0.86rem'
                    }}>
                        JD
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>John Doe</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Admin</span>
                    </div>
                    <ChevronDown size={14} color="var(--color-text-muted)" />
                </div>
            </div>
        </header>
    );
};

export default Header;
