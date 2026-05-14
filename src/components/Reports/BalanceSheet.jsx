import React, { useMemo, useRef, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { Download, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';

const BALANCE_SHEET_URL = '/accounting/reports/balance-sheet/?as_of=2026-02-08&include_zero_lines=false';

const BalanceSheet = () => {
    const navigate = useNavigate();
    const basePath = useBasePath();
    const printableRef = useRef(null);
    const [asOfDate, setAsOfDate] = useState('2026-02-08');

    const queryUrl = useMemo(() => {
        const params = new URLSearchParams({
            as_of: asOfDate,
            include_zero_lines: 'false',
        });
        return `/accounting/reports/balance-sheet/?${params.toString()}`;
    }, [asOfDate]);

    const { data, isLoading, isError } = useCustomQuery(queryUrl, ['report-balance-sheet', asOfDate]);

    const handleExportPdf = () => {
        window.print();
    };

    const formatMoney = (amount = 0) => {
        const currency = data?.currency || 'ARS';
        return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                <p style={{ color: 'var(--color-error)' }}>Failed to load balance sheet report.</p>
            </Card>
        );
    }

    const assetSections = data?.assets?.sections || [];
    const liabilitySections = data?.liabilities_and_equity?.liabilities?.sections || [];
    const equityLines = data?.liabilities_and_equity?.equity?.lines || [];

    return (
        <div ref={printableRef} className="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/reports`)} aria-label="Back" />
                    <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Balance Sheet</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Financial position.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>As of: {asOfDate}</span>
                        <div style={{ position: 'relative', width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'grid', placeItems: 'center', background: 'var(--color-bg-card)' }} className="cursor-pointer">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                                aria-label="As of date"
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Balance Sheet</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>As of {data.as_of}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '2px solid var(--color-primary-600)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Assets</h3>
                        {assetSections.map((section) => (
                            <SectionBlock
                                key={section.key}
                                title={section.title}
                                lines={section.lines}
                                total={section.total}
                                formatMoney={formatMoney}
                            />
                        ))}
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ height: '1.25rem' }} />
                            <GrandTotalRow label="Total Assets" amount={data?.assets?.total || 0} formatter={formatMoney} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '2px solid var(--color-error)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Liabilities & Equity</h3>

                        {liabilitySections.map((section) => (
                            <SectionBlock
                                key={section.key}
                                title={section.title}
                                lines={section.lines}
                                total={section.total}
                                formatMoney={formatMoney}
                            />
                        ))}

                        <SectionBlock
                            title="Equity"
                            lines={equityLines}
                            total={data?.liabilities_and_equity?.equity?.total || 0}
                            formatMoney={formatMoney}
                        />

                        <Row label="Net Income (Current Year)" amount={data?.liabilities_and_equity?.net_income_current_year || 0} formatter={formatMoney} highlight />

                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ height: '1.25rem' }} />
                            <GrandTotalRow
                                label="Total Liab. & Equity"
                                amount={data?.liabilities_and_equity?.total_liabilities_and_equity || 0}
                                formatter={formatMoney}
                            />
                        </div>
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

const SectionBlock = ({ title, lines = [], total = 0, formatMoney }) => (
    <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{title}</div>
        {lines.length === 0 ? (
            <div style={{ paddingLeft: '1rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No lines</div>
        ) : (
            lines.map((line) => (
                <Row
                    key={`${line.account_id || line.code}-${line.name}`}
                    label={[line.code, line.name].filter(Boolean).join(' - ') || line.name}
                    amount={line.amount}
                    formatter={formatMoney}
                />
            ))
        )}
        <TotalRow label={`Total ${title}`} amount={total} formatter={formatMoney} />
    </div>
);

const Row = ({ label, amount, formatter, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', marginBottom: '0.35rem', color: highlight ? 'var(--color-success)' : 'inherit' }}>
        <span>{label}</span>
        <span>{formatter(amount || 0)}</span>
    </div>
);

const TotalRow = ({ label, amount, formatter }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, background: 'var(--color-bg-table-header)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
        <span>{label}</span>
        <span>{formatter(amount)}</span>
    </div>
);

const GrandTotalRow = ({ label, amount, formatter }) => (
    <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
        <span>{label}</span>
        <span>{formatter(amount)}</span>
    </div>
);

export default BalanceSheet;
