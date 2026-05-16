import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import { ShieldCheck } from 'lucide-react';

const TaxSlabsComplianceCard = ({ style }) => {
    const { t } = useTranslation(['hr', 'common']);
    return (
        <Card className="padding-md" style={style}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <ShieldCheck className="text-primary-600" />
                <h4 style={{ fontWeight: 600 }}>{t('taxSlabs.complianceRules')}</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-800)', lineHeight: 1.5 }}>
                {t('taxSlabs.complianceDesc')}
            </p>
        </Card>
    );
};

const TaxSlabsSummaryCard = ({ slabCount, effectiveCeiling, maxRate, style }) => {
    const { t } = useTranslation(['hr', 'common']);
    return (
        <Card className="padding-md" style={style}>
            <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('taxSlabs.quickSummary')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('taxSlabs.totalBrackets')}</span>
                    <b>{slabCount}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('taxSlabs.effectiveCeiling')}</span>
                    <b style={{ textAlign: 'right' }}>{effectiveCeiling.toLocaleString()} JOD</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('taxSlabs.maxRate')}</span>
                    <b>{maxRate}%</b>
                </div>
            </div>
        </Card>
    );
};

export { TaxSlabsComplianceCard, TaxSlabsSummaryCard };
