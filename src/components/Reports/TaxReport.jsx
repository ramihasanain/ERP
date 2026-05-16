import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { useAccounting } from '@/context/AccountingContext';
import { ArrowLeft, Download, Filter, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';

const TaxReport = () => {
    const { t } = useTranslation(['reports', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { invoices, taxJurisdictions, taxRules } = useAccounting();

    // Filter State
    const [jurisdictionId, setJurisdictionId] = useState(taxJurisdictions[0]?.id || '');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    // Active Objects
    const activeJurisdiction = taxJurisdictions.find(j => j.id === jurisdictionId);
    const rulesInJurisdiction = taxRules.filter(r => r.jurisdictionId === jurisdictionId);

    // Calculation Logic
    const reportData = useMemo(() => {
        // 1. Filter Invoices by Date and Status
        const filteredInvoices = invoices.filter(inv => {
            if (!inv.date) return false;
            const invDate = new Date(inv.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return invDate >= start && invDate <= end && inv.status !== 'Draft';
        });

        // 2. Aggregate Sales Tax (Output VAT)
        // Note: In a real system, we'd also aggregate Purchase Tax (Input VAT) from Bills
        // For this MVP, we focus on Sales Tax from Invoices.

        const summaryByRule = rulesInJurisdiction.map(rule => {
            let netSales = 0;
            let taxCollected = 0;

            filteredInvoices.forEach(inv => {
                // Check if invoice lines use this rule
                // Assuming invoice items have 'taxRuleId'. 
                // Since our current invoice mock might not have granular lines stored in context yet (it's in CreateInvoice state),
                // we will simulate aggregation based on the 'total' and 'tax' fields if lines aren't available, 
                // OR ideally, we'd pull from `journalEntries`.

                // fallback: if we only have totals, we can't easily split by rule unless we stored it.
                // Let's assume for this report we are using the `journalEntries` which is the source of truth for accounting.
                // However, accessing context `entries` is better. 
                // Let's stick to a simpler approach for the MVP demo: 
                // We'll calculate based on the `invoices` array assuming they have a `taxAmount` and we attribute it to the Standard rule if not specified.

                if (inv.taxAmount > 0) {
                    // simplified distribution for demo
                    if (rule.type === 'Standard') {
                        netSales += inv.subtotal || 0;
                        taxCollected += inv.taxAmount || 0;
                    }
                }
            });

            return {
                ruleId: rule.id,
                ruleName: rule.name,
                netSales,
                taxCollected
            };
        });

        const totalNetSales = summaryByRule.reduce((sum, r) => sum + r.netSales, 0);
        const totalTaxCollected = summaryByRule.reduce((sum, r) => sum + r.taxCollected, 0);
        const totalTaxPaid = 0; // Placeholder for Purchases input tax
        const netPayable = totalTaxCollected - totalTaxPaid;

        return {
            summaryByRule,
            totalNetSales,
            totalTaxCollected,
            totalTaxPaid,
            netPayable
        };
    }, [invoices, rulesInJurisdiction, startDate, endDate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/reports`)}>{t('common:actions.back')}</Button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('taxReport.title')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{t('taxReport.subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={18} />}>{t('taxReport.exportXml')}</Button>
                    <Button icon={<Download size={18} />}>{t('taxReport.exportPdf')}</Button>
                </div>
            </div>

            <Card className="padding-lg">
                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '2rem', alignItems: 'end', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('taxReport.jurisdiction')}</label>
                        <select
                            value={jurisdictionId}
                            onChange={e => setJurisdictionId(e.target.value)}
                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        >
                            {taxJurisdictions.map(j => (
                                <option key={j.id} value={j.id}>{j.name} ({j.taxType})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label={t('taxReport.startDate')} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input label={t('taxReport.endDate')} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <Button variant="outline" icon={<Filter size={16} />} style={{ marginBottom: '2px' }}>{t('taxReport.applyFilters')}</Button>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('taxReport.totalSalesExclTax')}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeJurisdiction?.currency} {reportData.totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('taxReport.totalTaxCollected')}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>{activeJurisdiction?.currency} {reportData.totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card))', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-primary-600)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('taxReport.netTaxPayable')}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{activeJurisdiction?.currency} {reportData.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                {/* Detailed Table */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('taxReport.breakdownTitle')}</h3>
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: 'var(--color-bg-table-header)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('taxReport.ruleName')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('taxReport.netSales')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('taxReport.taxRate')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('taxReport.taxAmount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.summaryByRule.map(row => (
                                <tr key={row.ruleId} style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.ruleName}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                        {/* Find rate from rule definition for display */}
                                        {rulesInJurisdiction.find(r => r.id === row.ruleId)?.rate}%
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{row.taxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-table-header)', fontWeight: 700 }}>
                                <td style={{ padding: '0.75rem 1rem' }}>{t('taxReport.total')}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{reportData.totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>-</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{reportData.totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TaxReport;
