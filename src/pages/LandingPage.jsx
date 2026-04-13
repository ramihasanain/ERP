import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import btn from '../components/Shared/Button.module.css';
import LanguageMenu from '../components/Shared/LanguageMenu';
import ThemeToggle from '../components/Shared/ThemeToggle';
import HeroSection from './landing/HeroSection';
import FeaturesSection from './landing/FeaturesSection';
import PricingSection from './landing/PricingSection';
import Footer from './landing/Footer';

const LandingPage = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navigation Bar */}
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'var(--color-bg-surface)',
                borderBottom: '1px solid var(--color-border)',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }}>
                {/* Dark mode override for nav bg */}
                <style>{`
          [data-theme="dark"] nav { background-color: rgba(30, 41, 59, 0.8) !important; }
        `}</style>

                <div className="container" style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '2rem', height: '2rem', background: 'var(--color-primary-600)', borderRadius: '0.5rem' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>UnifiedCore</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <div style={{ display: 'none', md: 'flex', gap: '1.5rem' }}>
                            {/* Desktop Links could go here */}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingLeft: '1rem', borderLeft: '1px solid var(--color-border)' }}>
                            <ThemeToggle size="sm" />
                            <LanguageMenu align="end" size="sm" />
                        </div>

                        <Link
                            to="/auth/signin"
                            className={clsx(btn.button, btn.surface, btn.toolbar)}
                        >
                            Log In
                        </Link>
                        <Link
                            to="/auth/signup"
                            className={clsx(btn.button, btn.primary, btn.toolbar)}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                <HeroSection />
                <FeaturesSection />
                <PricingSection />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
