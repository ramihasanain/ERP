import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Shared/Button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HeroSection = () => {
    const { t } = useTranslation('landing');
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <section style={{
            padding: '6rem 0 4rem',
            background: 'linear-gradient(180deg, var(--color-bg-body) 0%, var(--color-bg-surface) 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-10%',
                [isRtl ? 'left' : 'right']: '-5%',
                width: '40%',
                height: '60%',
                background: 'radial-gradient(circle, var(--color-primary-600) 0%, transparent 70%)',
                opacity: 0.12,
                zIndex: 0,
                filter: 'blur(60px)'
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '2rem',
                    marginBottom: '2rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-primary-700)',
                    fontWeight: 500
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-success)'
                    }} />
                    {t('hero.badge')}
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text-main)'
                }}>
                    {t('hero.title')} <br />
                    <span style={{ color: 'var(--color-primary-600)' }}>{t('hero.titleHighlight')}</span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto 2.5rem',
                    lineHeight: 1.6
                }}>
                    {t('hero.subtitle')}
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/auth/signup">
                        <Button size="lg" icon={<ArrowRight size={20} />} style={{ borderRadius: '2rem' }}>
                            {t('hero.startTrial')}
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" icon={<PlayCircle size={20} />} style={{ borderRadius: '2rem', borderWidth: '2px' }}>
                        {t('hero.watchDemo')}
                    </Button>
                </div>

                <div style={{
                    marginTop: '4rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    background: 'var(--color-bg-surface)',
                    aspectRatio: '16/9',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-bg-body)'
                    }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem' }}>{t('hero.dashboardPreview')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
