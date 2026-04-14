import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Check } from 'lucide-react';

const sectionBackground =
    'linear-gradient(180deg, var(--color-bg-body) 0%, var(--color-bg-surface) 100%)';

const plans = [
    {
        name: 'Starter',
        price: '$49',
        description: 'Essential tools for small businesses.',
        features: ['Single Company', 'Basic Accounting', 'Up to 5 Users', 'Email Support']
    },
    {
        name: 'Pro',
        price: '$99',
        description: 'Perfect for growing companies.',
        popular: true,
        features: ['Multi-Company (up to 3)', 'Advanced Accounting & HR', 'Up to 20 Users', 'Priority Support', 'Inventory Management']
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations.',
        features: ['Unlimited Companies', 'All Modules Included', 'Unlimited Users', 'Dedicated Account Manager', 'Custom Integrations', 'SLA']
    }
];

const PricingSection = () => {
    return (
        <section style={{ padding: '4rem 0 6rem', background: sectionBackground }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 700 }}>
                        Simple, transparent pricing
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '640px', margin: '0 auto' }}>
                        Choose the plan that fits your business scale.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    alignItems: 'stretch'
                }}>
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0,
                                height: '100%'
                            }}
                        >
                            <Card
                                className="padding-lg"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0,
                                    border: plan.popular ? '2px solid var(--color-primary-500)' : undefined,
                                    boxShadow: plan.popular ? 'var(--shadow-md)' : undefined
                                }}
                            >
                                {/* Same-height slot on every card: badge only on Pro; empty on others keeps rows aligned */}
                                <div
                                    style={{
                                        flexShrink: 0,
                                        minHeight: '2.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '0.75rem'
                                    }}
                                >
                                    {plan.popular ? (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                background: 'var(--color-primary-600)',
                                                color: 'white',
                                                padding: '0.35rem 1rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                letterSpacing: '0.02em',
                                                boxShadow: '0 4px 14px rgb(79 70 229 / 0.35)'
                                            }}
                                        >
                                            Most Popular
                                        </span>
                                    ) : null}
                                </div>

                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plan.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
                                    {plan.price !== 'Custom' && <span style={{ color: 'var(--color-text-muted)' }}>/mo</span>}
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{plan.description}</p>

                                <Link to={plan.price === 'Custom' ? '/contact' : '/auth/signup'} style={{ width: '100%', marginBottom: '1.5rem', display: 'block', flexShrink: 0 }}>
                                    <Button
                                        variant={plan.popular ? 'primary' : 'outline'}
                                        style={{ width: '100%' }}
                                    >
                                        {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                    </Button>
                                </Link>

                                <ul style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    flex: 1,
                                    margin: 0,
                                    padding: 0,
                                    listStyle: 'none'
                                }}>
                                    {plan.features.map((feature, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.95rem' }}>
                                            <Check size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
