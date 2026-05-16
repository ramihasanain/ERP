import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation('landing');

    return (
        <footer style={{ background: 'var(--color-slate-900)', color: 'var(--color-slate-300)', padding: '4rem 0 2rem' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('footer.brand')}</h3>
                        <p style={{ lineHeight: 1.6 }}>{t('footer.tagline')}</p>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>{t('footer.product')}</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>{t('footer.accounting')}</li>
                            <li>{t('footer.hrPayroll')}</li>
                            <li>{t('footer.inventory')}</li>
                            <li>{t('footer.integrations')}</li>
                        </ul>
                    </div>

                    <ResourcesColumn t={t} />

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>{t('footer.legal')}</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>{t('footer.privacy')}</li>
                            <li>{t('footer.terms')}</li>
                            <li>{t('footer.security')}</li>
                        </ul>
                    </div>
                </div>

                <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--color-slate-800)', textAlign: 'center', fontSize: '0.875rem' }}>
                    {t('footer.copyright', { year: new Date().getFullYear() })}
                </div>
            </div>
        </footer>
    );
};

function ResourcesColumn({ t }) {
    return (
        <div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>{t('footer.resources')}</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>{t('footer.documentation')}</li>
                <li>{t('footer.apiReference')}</li>
                <li>{t('footer.blog')}</li>
                <li>{t('footer.community')}</li>
            </ul>
        </div>
    );
}

export default Footer;
