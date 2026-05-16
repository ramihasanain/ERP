import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import i18n from '@/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const languages = {
    en: { name: 'English', dir: 'ltr', code: 'en' },
    ar: { name: 'العربية', dir: 'rtl', code: 'ar' },
    de: { name: 'Deutsch', dir: 'ltr', code: 'de' },
};

const applyDocumentLanguage = (langCode) => {
    const { dir, code } = languages[langCode] || languages.en;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', code);
    localStorage.setItem('language', langCode);
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('language');
        const code = saved && languages[saved] ? saved : i18n.language || 'en';
        if (i18n.language !== code) {
            i18n.changeLanguage(code);
        }
        applyDocumentLanguage(code);
        return code;
    });

    useEffect(() => {
        const onLanguageChanged = (lng) => {
            if (lng && languages[lng] && lng !== language) {
                setLanguage(lng);
            }
            applyDocumentLanguage(lng);
        };

        i18n.on('languageChanged', onLanguageChanged);
        return () => {
            i18n.off('languageChanged', onLanguageChanged);
        };
    }, [language]);

    const changeLanguage = useCallback((langCode) => {
        if (languages[langCode]) {
            i18n.changeLanguage(langCode);
        }
    }, []);

    return (
        <LanguageContext.Provider
            value={{ language, changeLanguage, dir: languages[language].dir }}
        >
            {children}
        </LanguageContext.Provider>
    );
};
