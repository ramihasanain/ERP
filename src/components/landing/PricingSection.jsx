import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Check } from 'lucide-react';

const PLAN_KEYS = ['starter', 'pro', 'enterprise'];
const FEATURE_KEYS_BY_PLAN = {
    starter: ['singleCompany', 'basicAccounting', 'upTo5Users', 'emailSupport'],
    pro: ['multiCompany', 'advancedAccountingHr', 'upTo20Users', 'prioritySupport', 'inventoryManagement'],
    enterprise: ['unlimitedCompanies', 'allModules', 'unlimitedUsers', 'accountManager', 'customIntegrations', 'sla'],
};

const sectionBackground =
    'linear-gradient(180deg, var(--color-bg-body) 0%, var(--color-bg-surface) 100%)';

const PricingSection = () => {
    const { t } = useTranslation('landing');

    const plans = useMemo(
        () =>
            PLAN_KEYS.map((key) => ({
                key,
                name: t(`pricing.plans.${key}.name`),
                price: t(`pricing.plans.${key}.price`),
                description: t(`pricing.plans.${key}.description`),
                popular: key === 'pro',
                features: FEATURE_KEYS_BY_PLAN[key].map((featureKey) =>
                    t(`pricing.plans.${key}.features.${featureKey}`),
                ),
            })),
        [t],
    );

    const customPriceLabel = t('pricing.plans.enterprise.price');

    return (
        <section style={{ padding: '4rem 0 6rem', background: sectionBackground }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 700 }}>
                        {t('pricing.title')}
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '640px', margin: '0 auto' }}>
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    alignItems: 'stretch'
                }}>
                    {plans.map((plan) => (
                        <div
                            key={plan.key}
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
                                            {t('pricing.mostPopular')}
                                        </span>
                                    ) : null}
                                </div>

                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plan.name}</h3>
                                <PriceRow plan={plan} customPriceLabel={customPriceLabel} t={t} />
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{plan.description}</p>

                                <Link
                                    to={plan.price === customPriceLabel ? '/contact' : '/auth/signup'}
                                    style={{ width: '100%', marginBottom: '1.5rem', display: 'block', flexShrink: 0 }}
                                >
                                    <Button
                                        variant={plan.popular ? 'primary' : 'outline'}
                                        style={{ width: '100%' }}
                                    >
                                        {plan.price === customPriceLabel ? t('pricing.contactSales') : t('pricing.getStarted')}
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

function PriceRow({ plan, customPriceLabel, t }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
            {plan.price !== customPriceLabel && (
                <span style={{ color: 'var(--color-text-muted)' }}>{t('pricing.perMonth')}</span>
            )}
        </div>
    );
}

export default PricingSection;
