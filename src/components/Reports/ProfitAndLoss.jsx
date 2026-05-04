import React, { useMemo, useRef, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { Download, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PROFIT_AND_LOSS_URL = '/accounting/reports/profit-loss/?start_date=2026-5-1&end_date=2026-5-30&include_zero_lines=false';

const ProfitAndLoss = () => {
    const navigate = useNavigate();
    const printableRef = useRef(null);
    const [startDate, setStartDate] = useState('2026-05-01');
    const [endDate, setEndDate] = useState('2026-05-30');

    const queryUrl = useMemo(() => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            include_zero_lines: 'false',
        });
        return `/accounting/reports/profit-loss/?${params.toString()}`;
    }, [startDate, endDate]);

    const { data, isLoading, isError } = useCustomQuery(queryUrl, ['report-profit-and-loss', startDate, endDate]);

    const handleExportPdf = () => {
        window.print();
    };

    const formatMoney = (amount) => {
        const currency = data?.currency || 'ARS';
        return `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                <p style={{ color: 'var(--color-error)' }}>Failed to load profit and loss report.</p>
            </Card>
        );
    }

    return (
        <div ref={printableRef} className="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/reports')} aria-label="Back" />
                    <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Profit & Loss</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Income Statement.</p>
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
                    <Button variant="outline" icon={<Download size={16} />} onClick={handleExportPdf}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.company_name}</h2>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Profit and Loss</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{data.period_label}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <SectionHeader title="Income" />
                    <LinesBlock lines={data?.income?.sections?.flatMap((section) => section.lines || []) || []} formatter={formatMoney} />
                    <TotalRow label="Total Income" amount={data?.income?.total || 0} formatter={formatMoney} />

                    <SectionHeader title="Cost of Goods Sold" marginTop="1.5rem" />
                    <LinesBlock lines={data?.cost_of_goods_sold?.lines || []} formatter={formatMoney} />
                    <TotalRow label="Total COGS" amount={data?.cost_of_goods_sold?.total || 0} formatter={formatMoney} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', padding: '1rem 0', color: 'var(--color-primary-600)' }}>
                        <span>Gross Profit</span>
                        <span>{formatMoney(data?.gross_profit || 0)}</span>
                    </div>

                    <SectionHeader title="Operating Expenses" marginTop="1rem" />
                    <LinesBlock lines={data?.operating_expenses?.sections?.flatMap((section) => section.lines || []) || []} formatter={formatMoney} />
                    <TotalRow label="Total Operating Expenses" amount={data?.operating_expenses?.total || 0} formatter={formatMoney} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', padding: '0.5rem 0', marginTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <span>Operating Income</span>
                        <span>{formatMoney(data?.operating_income || 0)}</span>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Net Income</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: (data?.net_income || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {formatMoney(data?.net_income || 0)}
                        </span>
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

const SectionHeader = ({ title, marginTop = '0' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem', marginTop }}>
        <span>{title}</span>
    </div>
);

const Row = ({ label, amount, formatter }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
        <span>{label}</span>
        <span>{formatter(amount)}</span>
    </div>
);

const LinesBlock = ({ lines, formatter }) => {
    if (!lines.length) {
        return <div style={{ paddingLeft: '1rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No lines</div>;
    }

    return lines.map((line) => (
        <Row
            key={`${line.account_id || line.code}-${line.name}`}
            label={[line.code, line.name].filter(Boolean).join(' - ') || line.name}
            amount={line.amount || 0}
            formatter={formatter}
        />
    ));
};

const TotalRow = ({ label, amount, formatter }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, padding: '0.5rem 0', background: 'var(--color-bg-table-header)', borderRadius: 'var(--radius-sm)' }}>
        <span style={{ paddingLeft: '1rem' }}>{label}</span>
        <span style={{ paddingRight: '1rem' }}>{formatter(amount)}</span>
    </div>
);

export default ProfitAndLoss;
