import React, { useMemo, useRef, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { Download, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CASH_FLOW_URL = '/accounting/reports/cash-flow/?start_date=2026-5-1&end_date=2026-5-30';

const CashFlowStatement = () => {
    const navigate = useNavigate();
    const printableRef = useRef(null);
    const [startDate, setStartDate] = useState('2026-05-01');
    const [endDate, setEndDate] = useState('2026-05-30');

    const queryUrl = useMemo(() => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
        });
        return `/accounting/reports/cash-flow/?${params.toString()}`;
    }, [startDate, endDate]);

    const { data, isLoading, isError } = useCustomQuery(queryUrl, ['report-cash-flow', startDate, endDate]);

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
                <p style={{ color: 'var(--color-error)' }}>Failed to load cash flow report.</p>
            </Card>
        );
    }

    return (
        <div ref={printableRef} className="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/reports')} aria-label="Back" />
                    <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Cash Flow Statement</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{data.company_name} • {data.start_date} to {data.end_date}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>From: {startDate}</span>
                        <div style={{ position: 'relative', width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'grid', placeItems: 'center', background: 'var(--color-bg-card)' }} className="cursor-pointer">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                aria-label="Start date"
                                className="cursor-pointer"
                                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>To: {endDate}</span>
                        <div style={{ position: 'relative', width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'grid', placeItems: 'center', background: 'var(--color-bg-card)' }} className="cursor-pointer">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                aria-label="End date"
                                className="cursor-pointer"
                                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                    <Button variant="outline" icon={<Download size={18} />} onClick={handleExportPdf}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <SectionHeader title="Operating Activities" />
                    <Row label={data?.operating_activities?.label || 'Net Cash from Operations'} amount={data?.operating_activities?.amount || 0} currency={data.currency} isTotal />

                    <div style={{ height: '1.5rem' }}></div>
                    <SectionHeader title="Investing Activities" />
                    <Row label={data?.investing_activities?.label || 'Net Cash from Investing'} amount={data?.investing_activities?.amount || 0} currency={data.currency} isTotal />

                    <div style={{ height: '1.5rem' }}></div>
                    <SectionHeader title="Financing Activities" />
                    <Row label={data?.financing_activities?.label || 'Net Cash from Financing'} amount={data?.financing_activities?.amount || 0} currency={data.currency} isTotal />

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid var(--color-border)' }}>
                        <Row label="Net Increase/Decrease in Cash" amount={data?.net_increase_decrease_in_cash || 0} currency={data.currency} isBold />
                        <Row label="Cash at Beginning of Period" amount={data?.cash_at_beginning || 0} currency={data.currency} />
                        <Row label="Cash at End of Period" amount={data?.cash_at_end || 0} currency={data.currency} isDoubleUnderline />
                    </div>
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

const SectionHeader = ({ title }) => (
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>
        {title}
    </h3>
);

const Row = ({ label, amount, currency, isTotal, isBold, isDoubleUnderline }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: isTotal ? '1px solid var(--color-border)' : 'none',
            fontSize: isBold || isTotal ? '1rem' : '0.9rem',
            fontWeight: isBold || isTotal ? 600 : 400,
        }}>
            <span>{label}</span>
            <span style={{
                borderBottom: isDoubleUnderline ? '3px double var(--color-text-main)' : 'none',
                color: amount < 0 ? 'var(--color-error)' : 'inherit'
            }}>
                {amount < 0 ? '(' : ''}{currency || 'ARS'} {Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{amount < 0 ? ')' : ''}
            </span>
        </div>
    );
};

export default CashFlowStatement;
