import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import pill from '@/components/Shared/toolbarPill.module.css';

/**
 * @param {{ size?: 'sm' | 'md'; className?: string }} props
 */
const ThemeToggle = ({ size = 'sm', className = '' }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const layout = size === 'md' ? pill.pillIconMd : pill.pillIconSm;
    const btnClass = `${pill.pill} ${layout} ${className}`.trim();

    return (
        <button
            type="button"
            className={btnClass}
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
            {isDark ? <Sun size={size === 'md' ? 18 : 17} strokeWidth={2} /> : <Moon size={size === 'md' ? 18 : 17} strokeWidth={2} />}
        </button>
    );
};

export default ThemeToggle;
