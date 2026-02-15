import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Check } from 'lucide-react';

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
        <section style={{ padding: '4rem 0 6rem', background: 'var(--color-slate-50)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 700 }}>
                        Simple, transparent pricing
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>
                        Choose the plan that fits your business scale.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className="padding-lg"
                            style={{
                                position: 'relative',
                                border: plan.popular ? '2px solid var(--color-primary-500)' : undefined,
                                transform: plan.popular ? 'scale(1.05)' : undefined,
                                zIndex: plan.popular ? 1 : 0
                            }}
                        >
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'var(--color-primary-600)',
                                    color: 'white',
                                    padding: '0.25rem 1rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    Most Popular
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
                                {plan.price !== 'Custom' && <span style={{ color: 'var(--color-text-muted)' }}>/mo</span>}
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{plan.description}</p>

                            <Link to={plan.price === 'Custom' ? '/contact' : '/auth/signup'} style={{ width: '100%', marginBottom: '2rem', display: 'block' }}>
                                <Button
                                    variant={plan.popular ? 'primary' : 'outline'}
                                    style={{ width: '100%' }}
                                >
                                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                </Button>
                            </Link>

                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {plan.features.map((feature, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.95rem' }}>
                                        <Check size={18} color="var(--color-success)" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
