import React from 'react';
import Card from '@/components/Shared/Card';
import { Layers, Users, Package, ShieldCheck, Globe2, BarChart3 } from 'lucide-react';

const features = [
    {
        icon: <Layers size={24} />,
        title: 'Advanced Accounting',
        description: 'Multi-currency, tax-compliant ledgers for Jordan, KSA, and Germany.'
    },
    {
        icon: <Users size={24} />,
        title: 'Global HR & Payroll',
        description: 'Manage diverse teams with country-specific labor laws and payroll rules.'
    },
    {
        icon: <Package size={24} />,
        title: 'Smart Inventory',
        description: 'Real-time stock tracking across multiple warehouses and locations.'
    },
    {
        icon: <ShieldCheck size={24} />,
        title: 'Enterprise Security',
        description: 'Role-based access control (RBAC), audit logs, and data encryption.'
    },
    {
        icon: <Globe2 size={24} />,
        title: 'Native Localization',
        description: 'Built-in RTL support for Arabic and localized date/number formats.'
    },
    {
        icon: <BarChart3 size={24} />,
        title: 'Real-time Analytics',
        description: 'Actionable insights with customizable dashboards and reports.'
    }
];

const FeaturesSection = () => {
    return (
        <section style={{ padding: '4rem 0', background: 'var(--color-bg-body)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 700 }}>
                        Everything you need to run your business
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                        UnifiedCore brings all your critical business functions into one seamless platform.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {features.map((feature, index) => (
                        <Card key={index} hoverable className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-primary-50)',
                                color: 'var(--color-primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{feature.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {feature.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
