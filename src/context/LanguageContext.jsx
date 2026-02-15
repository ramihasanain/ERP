import React, { createContext, useContext, useEffect, useState } from 'react';

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

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved && languages[saved] ? saved : 'en';
    });

    useEffect(() => {
        const { dir, code } = languages[language];
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', code);
        localStorage.setItem('language', language);
    }, [language]);

    const changeLanguage = (langCode) => {
        if (languages[langCode]) {
            setLanguage(langCode);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, dir: languages[language].dir }}>
            {children}
        </LanguageContext.Provider>
    );
};
