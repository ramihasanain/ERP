import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const HeroSection = () => {
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <section style={{
            padding: '6rem 0 4rem',
            background: 'linear-gradient(180deg, var(--color-bg-body) 0%, var(--color-primary-50) 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                [isRtl ? 'left' : 'right']: '-5%',
                width: '40%',
                height: '60%',
                background: 'radial-gradient(circle, var(--color-primary-200) 0%, transparent 70%)',
                opacity: 0.4,
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
                    border: '1px solid var(--color-primary-200)',
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
                    v2.0 is now live with enhanced Analytics
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(to right, var(--color-slate-900), var(--color-slate-700))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Unified Management for <br />
                    <span style={{ color: 'var(--color-primary-600)', WebkitTextFillColor: 'var(--color-primary-600)' }}>
                        Global Enterprise
                    </span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto 2.5rem',
                    lineHeight: 1.6
                }}>
                    Seamlessly integrate Accounting, HR, and Inventory across borders.
                    Built for teams in Jordan, KSA, Germany, and beyond with native compliance.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/auth/signup">
                        <Button size="lg" icon={<ArrowRight size={20} />} style={{ borderRadius: '2rem' }}>
                            Start Free Trial
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" icon={<PlayCircle size={20} />} style={{ borderRadius: '2rem', borderWidth: '2px' }}>
                        Watch Demo
                    </Button>
                </div>

                {/* Mockup Placeholder */}
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
                        background: 'var(--color-slate-50)'
                    }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem' }}>Dashboard Preview Image</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
