import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { User } from 'lucide-react';
import btn from '@/components/Shared/Button.module.css';
import LanguageMenu from '@/components/Shared/LanguageMenu';
import ThemeToggle from '@/components/Shared/ThemeToggle';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

const LandingPage = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
          .landing-actions-desktop { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
          .landing-mobile-menu-wrap { display: none; position: relative; }
          .landing-mobile-trigger {
            width: 2.25rem;
            height: 2.25rem;
            border: 1px solid var(--color-border);
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg-surface);
            color: var(--color-text-main);
            cursor: pointer;
          }
          .landing-mobile-dropdown {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            min-width: 14rem;
            border: 1px solid var(--color-border);
            border-radius: 0.75rem;
            background: var(--color-bg-surface);
            box-shadow: 0 12px 30px rgba(2, 6, 23, 0.15);
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .landing-mobile-appearance {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--color-border);
          }
          .landing-mobile-cta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .landing-mobile-cta .button {
            width: 100%;
            justify-content: center;
          }
          @media (max-width: 767px) {
            .landing-actions-desktop { display: none; }
            .landing-mobile-menu-wrap { display: block; }
          }
        `}</style>

                <div className="container" style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '2rem', height: '2rem', background: 'var(--color-primary-600)', borderRadius: '0.5rem' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>UnifiedCore</span>
                    </div>

                    <div className="landing-actions-desktop">
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

                    <div ref={mobileMenuRef} className="landing-mobile-menu-wrap">
                        <button
                            type="button"
                            className="landing-mobile-trigger"
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Open user menu"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        >
                            <User size={18} />
                        </button>

                        {isMobileMenuOpen && (
                            <div className="landing-mobile-dropdown">
                                <div className="landing-mobile-appearance">
                                    <ThemeToggle size="sm" />
                                    <LanguageMenu align="end" size="sm" />
                                </div>
                                <div className="landing-mobile-cta">
                                    <Link
                                        to="/auth/signin"
                                        className={clsx(btn.button, btn.surface, btn.toolbar)}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/auth/signup"
                                        className={clsx(btn.button, btn.primary, btn.toolbar)}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        )}
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
