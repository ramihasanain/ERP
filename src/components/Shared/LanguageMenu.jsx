import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, languages } from '@/context/LanguageContext';
import pill from '@/components/Shared/toolbarPill.module.css';
import styles from '@/components/Shared/LanguageMenu.module.css';

const ORDER = ['en', 'ar', 'de'];

/**
 * @param {{ align?: 'start' | 'end'; size?: 'sm' | 'md'; className?: string }} props
 */
const LanguageMenu = ({ align = 'end', size = 'sm', className = '' }) => {
    const { t } = useTranslation('common');
    const { language, changeLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                close();
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    const current = languages[language];
    const code = current?.code?.toUpperCase() ?? 'EN';

    const pick = (codeKey) => {
        changeLanguage(codeKey);
        close();
    };

    const menuClass = `${styles.menu} ${align === 'start' ? styles.menuStart : styles.menuEnd}`;
    const triggerClass = [
        pill.pill,
        size === 'md' ? pill.pillLangMd : pill.pillLangSm,
        open ? pill.pillOpen : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={wrapRef} className={`${styles.wrap} ${className}`.trim()}>
            <button
                type="button"
                className={triggerClass}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={t('language.ariaLabel')}
            >
                <Globe size={size === 'md' ? 17 : 16} strokeWidth={2} aria-hidden />
                <span className={styles.code}>{code}</span>
                <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className={`${styles.chevron} ${open ? styles.chevronUp : ''}`.trim()}
                    aria-hidden
                />
            </button>
            {open ? (
                <ul className={menuClass} role="listbox" aria-label={t('language.listboxLabel')}>
                    {ORDER.map((key) => {
                        const lang = languages[key];
                        const active = language === key;
                        return (
                            <li key={key} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    className={`${styles.item} ${active ? styles.itemActive : ''}`.trim()}
                                    onClick={() => pick(key)}
                                >
                                    <span className={styles.itemLabel}>{lang.name}</span>
                                    <span className={styles.itemCode}>{lang.code}</span>
                                    {active ? <Check className={styles.check} size={16} strokeWidth={2.5} /> : <span style={{ width: 16 }} />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default LanguageMenu;
