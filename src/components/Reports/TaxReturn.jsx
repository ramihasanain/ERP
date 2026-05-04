import React, { useMemo, useRef, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { Download, Calendar, FileCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TAX_RETURN_URL = '/accounting/reports/tax-return/?period_start=2026-01-01&period_end=2026-03-31';

const TaxReturn = () => {
    const navigate = useNavigate();
    const printableRef = useRef(null);
    const [periodStart, setPeriodStart] = useState('2026-01-01');
    const [periodEnd, setPeriodEnd] = useState('2026-03-31');

    const queryUrl = useMemo(() => {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });
        return `/accounting/reports/tax-return/?${params.toString()}`;
    }, [periodStart, periodEnd]);

    const { data, isLoading, isError } = useCustomQuery(queryUrl, ['report-tax-return', periodStart, periodEnd]);

    const formatMoney = (amount) =>
        `${data?.currency || 'ARS'} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleExportPdf = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '320px', display: 'grid', placeItems: 'center' }}>
                <Spinner />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <Card className="padding-lg">
                <p style={{ color: 'var(--color-error)' }}>Failed to load tax return report.</p>
            </Card>
        );
    }

    return (
        <div ref={printableRef} className="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/reports')} aria-label="Back" />
                    <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tax Return (VAT/GST)</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Tax liability report for government filing.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>From: {periodStart}</span>
                        <div style={{ position: 'relative', width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'grid', placeItems: 'center', background: 'var(--color-bg-card)' }} className="cursor-pointer">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                aria-label="Period start date"
                                className="cursor-pointer"
                                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>To: {periodEnd}</span>
                        <div style={{ position: 'relative', width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'grid', placeItems: 'center', background: 'var(--color-bg-card)' }} className="cursor-pointer">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                aria-label="Period end date"
                                className="cursor-pointer"
                                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                    <Button variant="outline" icon={<Download size={16} />} onClick={handleExportPdf}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--color-blue-50)', borderRadius: 'var(--radius-md)', color: 'var(--color-blue-700)' }}>
                    <FileCheck size={24} />
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ready for Filing</h3>
                        <p style={{ fontSize: '0.85rem' }}>{data.company_name} • {data.period_start} to {data.period_end}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Sales (Output Tax)</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Sales (Excl. Tax)</span>
                            <span>{formatMoney(data?.sales?.total_sales_excluding_tax || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <span>VAT Collected from Invoices</span>
                            <span style={{ color: 'var(--color-text-main)' }}>{formatMoney(data?.sales?.vat_collected_from_invoices || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <span>VAT Collected for Net</span>
                            <span style={{ color: 'var(--color-text-main)' }}>{formatMoney(data?.sales?.vat_collected_for_net || 0)}</span>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>2. Purchases (Input Tax)</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Purchases (Excl. Tax)</span>
                            <span>{formatMoney(data?.purchases?.total_purchases_excluding_tax || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <span>VAT Paid (Reclaimable)</span>
                            <span style={{ color: 'var(--color-text-main)' }}>{formatMoney(data?.purchases?.vat_paid_reclaimable || 0)}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Net Tax Payable</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: (data?.net_tax_payable || 0) > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                {formatMoney(data?.net_tax_payable || 0)}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{`${data.period_start} to ${data.period_end}`}</p>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost">Mark as Filed</Button>
                    <Button>File Return Now</Button>
                </div>
            </Card>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            size: A4;
                            margin: 8mm;
                        }
                        .no-print { display: none !important; }
                        body * { visibility: hidden !important; }
                        .printable-area, .printable-area * { visibility: visible !important; }
                        .printable-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                        }
                    }
                    `,
                }}
            />
        </div>
    );
};

export default TaxReturn;
