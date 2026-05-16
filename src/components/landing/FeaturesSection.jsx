import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import { Layers, Users, Package, ShieldCheck, Globe2, BarChart3 } from 'lucide-react';

const FEATURE_KEYS = ['accounting', 'hr', 'inventory', 'security', 'localization', 'analytics'];
const FEATURE_ICONS = [
    <Layers size={24} key="layers" />,
    <Users size={24} key="users" />,
    <Package size={24} key="package" />,
    <ShieldCheck size={24} key="shield" />,
    <Globe2 size={24} key="globe" />,
    <BarChart3 size={24} key="chart" />,
];

const FeaturesSection = () => {
    const { t } = useTranslation('landing');

    const features = useMemo(
        () =>
            FEATURE_KEYS.map((key, index) => ({
                icon: FEATURE_ICONS[index],
                title: t(`features.${key}.title`),
                description: t(`features.${key}.description`),
            })),
        [t],
    );

    return (
        <section style={{ padding: '4rem 0', background: 'var(--color-bg-body)' }}>
            <div className="container">
                <FeaturesHeader t={t} />
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

function FeaturesHeader({ t }) {
    return (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 700 }}>
                {t('features.title')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                {t('features.subtitle')}
            </p>
        </div>
    );
}

export default FeaturesSection;
