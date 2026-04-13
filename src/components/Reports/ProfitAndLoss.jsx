import React, { useState, useMemo } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Calendar } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';

const ProfitAndLoss = () => {
    const { accounts, getAccountBalance, companyProfile } = useAccounting();
    const [period, setPeriod] = useState('This Year');

    const reportData = useMemo(() => {
        const getBalance = (filterFn) => {
            const targetAccounts = accounts.filter(filterFn);
            if (targetAccounts.length === 0) return 0;
            return targetAccounts.reduce((sum, acc) => {
                if (acc.isGroup) return sum;
                return sum + getAccountBalance(acc.id);
            }, 0);
        };

        // Revenue
        const operatingRevenue = getBalance(a => a.parentCode === '4100' && !a.isGroup);
        const otherIncome = getBalance(a => a.parentCode === '4200' && !a.isGroup);
        const totalIncome = operatingRevenue + otherIncome;

        // COGS
        const totalCOGS = getBalance(a => a.type === 'COGS' && !a.isGroup);

        const grossProfit = totalIncome - totalCOGS;

        // Expenses
        const adminExpenses = getBalance(a => a.parentCode === '6100' && !a.isGroup);
        const salesExpenses = getBalance(a => a.parentCode === '6200' && !a.isGroup);
        const techExpenses = getBalance(a => a.parentCode === '6300' && !a.isGroup);
        const hrExpenses = getBalance(a => a.parentCode === '6400' && !a.isGroup);
        const financeExpenses = getBalance(a => a.parentCode === '6500' && !a.isGroup);
        const depreciation = getBalance(a => a.parentCode === '6600' && !a.isGroup);

        const totalOperatingExpenses = adminExpenses + salesExpenses + techExpenses + hrExpenses + depreciation;
        // Finance expenses are often "Other Expenses", but let's lump them in Total Expenses for now for simplicity, or separate them.
        // Let's separate Operating vs Net Result.

        const operatingIncome = grossProfit - totalOperatingExpenses;

        const netIncome = operatingIncome - financeExpenses;

        return {
            operatingRevenue,
            otherIncome,
            totalIncome,
            totalCOGS,
            grossProfit,
            adminExpenses,
            salesExpenses,
            techExpenses,
            hrExpenses,
            depreciation,
            totalOperatingExpenses,
            operatingIncome,
            financeExpenses,
            netIncome
        };
    }, [accounts, getAccountBalance]);

    const formatMoney = (amount) => {
        return `${companyProfile.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Profit & Loss</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Income Statement.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Calendar size={16} />}>{period}</Button>
                    <Button variant="outline" icon={<Download size={16} />}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{companyProfile.name}</h2>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Profit and Loss</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{new Date().getFullYear()} YTD</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Income Section */}
                    <SectionHeader title="Income" />
                    <Row label="Operating Revenue" amount={reportData.operatingRevenue} formatter={formatMoney} />
                    {reportData.otherIncome > 0 && <Row label="Other Income" amount={reportData.otherIncome} formatter={formatMoney} />}
                    <TotalRow label="Total Income" amount={reportData.totalIncome} formatter={formatMoney} />

                    {/* COGS Section */}
                    <SectionHeader title="Cost of Goods Sold" marginTop="1.5rem" />
                    <Row label="Cost of Sales" amount={reportData.totalCOGS} formatter={formatMoney} />
                    <TotalRow label="Total COGS" amount={reportData.totalCOGS} formatter={formatMoney} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', padding: '1rem 0', color: 'var(--color-primary-600)' }}>
                        <span>Gross Profit</span>
                        <span>{formatMoney(reportData.grossProfit)}</span>
                    </div>

                    {/* Expenses Section */}
                    <SectionHeader title="Operating Expenses" marginTop="1rem" />
                    <Row label="Administrative" amount={reportData.adminExpenses} formatter={formatMoney} />
                    <Row label="Sales & Marketing" amount={reportData.salesExpenses} formatter={formatMoney} />
                    <Row label="Technology" amount={reportData.techExpenses} formatter={formatMoney} />
                    <Row label="Human Resources" amount={reportData.hrExpenses} formatter={formatMoney} />
                    <Row label="Depreciation" amount={reportData.depreciation} formatter={formatMoney} />
                    <TotalRow label="Total Operating Expenses" amount={reportData.totalOperatingExpenses} formatter={formatMoney} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', padding: '0.5rem 0', marginTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <span>Operating Income</span>
                        <span>{formatMoney(reportData.operatingIncome)}</span>
                    </div>

                    {reportData.financeExpenses > 0 && (
                        <>
                            <SectionHeader title="Other Expenses" marginTop="1rem" />
                            <Row label="Finance Costs" amount={reportData.financeExpenses} formatter={formatMoney} />
                        </>
                    )}

                    {/* Net Income */}
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Net Income</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: reportData.netIncome >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {formatMoney(reportData.netIncome)}
                        </span>
                    </div>
                </div>
            </Card>
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

const TotalRow = ({ label, amount, formatter }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, padding: '0.5rem 0', background: 'var(--color-bg-table-header)', borderRadius: 'var(--radius-sm)' }}>
        <span style={{ paddingLeft: '1rem' }}>{label}</span>
        <span style={{ paddingRight: '1rem' }}>{formatter(amount)}</span>
    </div>
);

export default ProfitAndLoss;
