import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { CheckCircle, Lock, Download } from 'lucide-react';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';

const formatMoney = (value, currency) => {
    const { t } = useTranslation(['hr', 'common']);
    const num = Number(value);
    if (Number.isNaN(num)) return `— ${currency}`;
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

/**
 * Finalize payroll summary card. Expects data from `GET /api/hr/payroll/periods/:id/finalize-summary/` (parent fetches).
 * Finalize action is performed by the parent (POST `.../finalize/`).
 */
const FinalizePayrollStep = ({
    finalizeSummary,
    isLoading,
    isError,
    loadError,
    onFinalize,
    onBack,
    isFinalizing = false,
    canFinalize = true,
}) => {

    const data = finalizeSummary;
    const currency = data?.currency ?? 'USD';
    const periodLabel = data?.period_name ?? '—';
    const basePayroll = Number(data?.base_payroll);
    const totalAdjustments = Number(data?.total_adjustments);
    const finalTotal = Number(data?.final_total_payable);
    const employees = data?.employees ?? 0;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.75rem' }}>
                <Spinner />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <ResourceLoadError
                error={loadError}
                message={!isError && !data ? 'No finalize summary was returned for this period.' : undefined}
                title="Could not load finalize summary"
                onGoBack={onBack}
            />
        );
    }

    return (
        <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '1.35rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '0.65rem', background: 'var(--color-success-50)', borderRadius: '50%', color: 'var(--color-success-600)' }}>
                    <Lock size={26} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 0.2rem' }}>Finalize Payroll</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.45, margin: 0 }}>
                        This will lock the period, generate payslips, and post journal entries.
                    </p>
                </div>

                <div style={{ background: 'var(--color-slate-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Period:</span>
                        <b style={{ fontSize: '0.95rem' }}>{periodLabel}</b>
                    </div>
                    <div
                        style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            marginBottom: '0.35rem',
                            borderTop: '1px solid var(--color-border)',
                            paddingTop: '0.5rem',
                        }}
                    >
                        Financial Summary
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                        <span>Base Payroll:</span>
                        <b>{formatMoney(basePayroll, currency)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                        <span>Total Adjustments:</span>
                        <b style={{ color: totalAdjustments >= 0 ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
                            {totalAdjustments >= 0 ? '+' : ''}
                            {formatMoney(totalAdjustments, currency)}
                        </b>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '0.35rem',
                            borderTop: '2px solid var(--color-border)',
                            paddingTop: '0.5rem',
                            alignItems: 'baseline',
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Final Total Payable:</span>
                        <b style={{ fontSize: '1.1rem', color: 'var(--color-primary-700)' }}>{formatMoney(finalTotal, currency)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Employees:</span>
                        <b>{employees}</b>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.65rem' }}>
                    <Button
                        className="cursor-pointer"
                        onClick={onFinalize}
                        size="lg"
                        icon={<CheckCircle size={18} />}
                        style={{ background: 'var(--color-primary-900)' }}
                        disabled={isFinalizing || !canFinalize}
                        title={!canFinalize ? 'Finalize summary must load before you can finalize.' : undefined}
                    >
                        {isFinalizing ? 'Finalizing…' : 'Finalize & Post Journal Entries'}
                    </Button>
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        size="md"
                        icon={<Download size={18} />}
                        onClick={() => alert('Preparing all payslips for bulk download (ZIP)...')}
                    >
                        Download All Payslips (ZIP)
                    </Button>
                    <Button variant="ghost" className="cursor-pointer" onClick={onBack}>
                        Back to Review
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default FinalizePayrollStep;
