import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, languages } from '../context/LanguageContext';
import { Moon, Sun } from 'lucide-react';
import Button from '../components/common/Button';
import HeroSection from './landing/HeroSection';
import FeaturesSection from './landing/FeaturesSection';
import PricingSection from './landing/PricingSection';
import Footer from './landing/Footer';

const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();

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

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'none', md: 'flex', gap: '1.5rem' }}>
                            {/* Desktop Links could go here */}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingLeft: '1rem', borderLeft: '1px solid var(--color-border)' }}>
                            <button
                                onClick={toggleTheme}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', padding: '0.5rem' }}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <select
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-main)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit'
                                }}
                            >
                                <option value="en">EN</option>
                                <option value="ar">AR</option>
                                <option value="de">DE</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link to="/auth/signin">
                                <Button variant="ghost" size="sm">Log In</Button>
                            </Link>
                            <Link to="/auth/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
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
