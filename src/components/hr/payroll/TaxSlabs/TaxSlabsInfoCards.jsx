import React from 'react';
import Card from '@/components/Shared/Card';
import { ShieldCheck } from 'lucide-react';

const TaxSlabsComplianceCard = ({ style }) => (
    <Card className="padding-md" style={style}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldCheck className="text-primary-600" />
            <h4 style={{ fontWeight: 600 }}>Compliance Rules</h4>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-800)', lineHeight: 1.5 }}>
            These brackets will be used to calculate Income Tax (PAYE) during payroll runs.
            Ensure brackets do not overlap to avoid calculation errors.
        </p>
    </Card>
);

const TaxSlabsSummaryCard = ({ slabCount, effectiveCeiling, maxRate, style }) => (
    <Card className="padding-md" style={style}>
        <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Quick Summary</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Total Brackets:</span>
                <b>{slabCount}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Effective Ceiling:</span>
                <b style={{ textAlign: 'right' }}>{effectiveCeiling.toLocaleString()} JOD</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Max Rate:</span>
                <b>{maxRate}%</b>
            </div>
        </div>
    </Card>
);

export { TaxSlabsComplianceCard, TaxSlabsSummaryCard };
