import React, { useMemo, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Download, Calendar } from 'lucide-react';
import { useAccounting } from '../../../context/AccountingContext';

const BalanceSheet = () => {
    const { accounts, getAccountBalance, companyProfile } = useAccounting();
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        // Helper to get balance for a specific account or group of accounts
        const getBalance = (filterFn) => {
            const targetAccounts = accounts.filter(filterFn);
            if (targetAccounts.length === 0) return 0;

            return targetAccounts.reduce((sum, acc) => {
                // For parent accounts, we might need a recursive approach if getAccountBalance only works for leaf nodes.
                // However, the context's getAccountBalance aggregates properly if we call it for each leaf.
                // But getAccountBalance implementation in context:
                // "const account = accounts.find(a => a.id === accountId);"
                // "if (line.account === accountId)..."
                // It only looks for exact matches on lines. Lines usually use leaf accounts.
                // So we should only sum balances of *leaf* accounts that match the filter.

                if (acc.isGroup) return sum; // Skip groups, only sum leaves
                return sum + getAccountBalance(acc.id);
            }, 0);
        };

        // Assets
        const cashEquivalents = getBalance(a => a.code.startsWith('111') || a.code.startsWith('113'));
        const accountsReceivable = getBalance(a => a.code === '1140');
        const inventory = getBalance(a => a.code === '1160');
        const otherCurrentAssets = getBalance(a => a.parentCode === '1100' && !['111', '113', '1140', '1160'].some(p => a.code.startsWith(p)) && !a.isGroup);
        const totalCurrentAssets = cashEquivalents + accountsReceivable + inventory + otherCurrentAssets;

        const fixedAssetsGross = getBalance(a => a.parentCode === '1200' && !a.isGroup);
        const accumulatedDepreciation = getBalance(a => a.parentCode === '1300' && !a.isGroup); // Should be negative
        // Note: In context, Asset debit is positive. Accum Depr is usually credit balance (negative in getAccountBalance logic for Assets? No context says: if Asset, Bal = Deb - Cred. So Cred oriented accounts will be negative.)
        // Let's check Context logic:
        // if (account.type === 'Asset'...) { balance += debit - credit }
        // Accum Depr is type 'Asset' (contra). So Credit entries (150) -> 0 - 150 = -150. Correct.

        const totalFixedAssets = fixedAssetsGross + accumulatedDepreciation;
        const totalAssets = totalCurrentAssets + totalFixedAssets;

        // Liabilities
        const accountsPayable = getBalance(a => a.code === '2110');
        const taxPayable = getBalance(a => a.code.startsWith('214') || a.code.startsWith('215'));
        // We need to treat Liabilities as positive numbers for the report, but getAccountBalance returns them as positive if (Credit - Debit) > 0 because type='Liability'.
        // Context: if (account.type === 'Asset'...) else { balance += credit - debit }
        // So Liability balances are positive. Good.

        const otherCurrentLiabilities = getBalance(a => a.parentCode === '2100' && !['2110', '2140', '2150'].some(c => a.code === c) && !a.isGroup);
        const totalCurrentLiabilities = accountsPayable + taxPayable + otherCurrentLiabilities;
        const longTermLiabilities = getBalance(a => a.parentCode === '2200' && !a.isGroup);
        const totalLiabilities = totalCurrentLiabilities + longTermLiabilities;

        // Equity
        const capital = getBalance(a => a.code.startsWith('311') || a.code.startsWith('312') || a.code.startsWith('313'));
        const retainedEarnings = getBalance(a => a.code === '3150');

        // Net Income Calculation (Revenue - Expense) for ALL TIME (since Retained Earnings account might be empty in this simple system)
        // Or strictly: Retained Earnings should be opening balance + prior years. 
        // Current Year Earnings = Rev - Exp for current fiscal year.
        // For simplicity, let's calculate Net Income as (All Rev - All Exp) - (Retained Earnings already booked).
        // Actually, let's just calc Current Year NI.

        const totalRevenue = getBalance(a => a.type === 'Revenue');
        const totalCOGS = getBalance(a => a.type === 'COGS');
        const totalExpenses = getBalance(a => a.type === 'Expense');
        const netIncome = totalRevenue - totalCOGS - totalExpenses; // Rev is Credit-Debit (Positive), Exp is Debit-Credit (Positive).
        // Wait, Context: Rev (Type='Revenue') -> Credit - Debit. Exp (Type='Expense') -> Debit - Credit.
        // So Net Income = Rev - Exp. Correct.

        const totalEquity = capital + retainedEarnings + netIncome;

        const totalLiabilitiesEquity = totalLiabilities + totalEquity;

        return {
            cashEquivalents,
            accountsReceivable,
            inventory,
            otherCurrentAssets,
            totalCurrentAssets,
            fixedAssetsGross,
            accumulatedDepreciation,
            totalFixedAssets,
            totalAssets,
            accountsPayable,
            taxPayable,
            otherCurrentLiabilities,
            totalCurrentLiabilities,
            longTermLiabilities,
            totalLiabilities,
            capital,
            retainedEarnings,
            netIncome,
            totalEquity,
            totalLiabilitiesEquity
        };
    }, [accounts, getAccountBalance]);

    const formatMoney = (amount) => {
        return `${companyProfile.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Balance Sheet</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Financial position.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Calendar size={16} />}>As of {asOfDate}</Button>
                    <Button variant="outline" icon={<Download size={16} />}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{companyProfile.name}</h2>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Balance Sheet</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>As of {asOfDate}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                    {/* Assets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '2px solid var(--color-primary-600)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Assets</h3>

                        {/* Current Assets */}
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Current Assets</div>
                        <Row label="Cash & Equivalents" amount={reportData.cashEquivalents} formatter={formatMoney} />
                        <Row label="Accounts Receivable" amount={reportData.accountsReceivable} formatter={formatMoney} />
                        <Row label="Inventory" amount={reportData.inventory} formatter={formatMoney} />
                        {reportData.otherCurrentAssets !== 0 && <Row label="Other Current Assets" amount={reportData.otherCurrentAssets} formatter={formatMoney} />}
                        <TotalRow label="Total Current Assets" amount={reportData.totalCurrentAssets} formatter={formatMoney} />

                        {/* Fixed Assets */}
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Fixed Assets</div>
                        <Row label="Property, Plant & Equip." amount={reportData.fixedAssetsGross} formatter={formatMoney} />
                        <Row label="Less: Accum. Dep." amount={reportData.accumulatedDepreciation} formatter={formatMoney} isNegative />
                        <TotalRow label="Total Fixed Assets" amount={reportData.totalFixedAssets} formatter={formatMoney} />

                        <GrandTotalRow label="Total Assets" amount={reportData.totalAssets} formatter={formatMoney} />
                    </div>

                    {/* Liabilities & Equity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '2px solid var(--color-error)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Liabilities & Equity</h3>

                        {/* Liabilities */}
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Liabilities</div>
                        <Row label="Accounts Payable" amount={reportData.accountsPayable} formatter={formatMoney} />
                        <Row label="Tax Payable" amount={reportData.taxPayable} formatter={formatMoney} />
                        {reportData.otherCurrentLiabilities !== 0 && <Row label="Other Current Liab." amount={reportData.otherCurrentLiabilities} formatter={formatMoney} />}
                        <TotalRow label="Total Current Liabilities" amount={reportData.totalCurrentLiabilities} formatter={formatMoney} />

                        {reportData.longTermLiabilities !== 0 && (
                            <>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Long Term Liabilities</div>
                                <Row label="Long Term Debt" amount={reportData.longTermLiabilities} formatter={formatMoney} />
                            </>
                        )}
                        <div style={{ marginTop: '0.5rem' }}>
                            <TotalRow label="Total Liabilities" amount={reportData.totalLiabilities} formatter={formatMoney} />
                        </div>

                        {/* Equity */}
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Equity</div>
                        <Row label="Owner's Capital" amount={reportData.capital} formatter={formatMoney} />
                        <Row label="Retained Earnings" amount={reportData.retainedEarnings} formatter={formatMoney} />
                        <Row label="Net Income (Current Year)" amount={reportData.netIncome} formatter={formatMoney} highlight />
                        <TotalRow label="Total Equity" amount={reportData.totalEquity} formatter={formatMoney} />

                        <GrandTotalRow label="Total Liab. & Equity" amount={reportData.totalLiabilitiesEquity} formatter={formatMoney} />
                    </div>
                </div>
            </Card>
        </div>
    );
};

const Row = ({ label, amount, formatter, isNegative, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', color: highlight ? 'var(--color-success)' : 'inherit' }}>
        <span>{label}</span>
        <span>{isNegative && amount > 0 ? '(' : ''}{formatter(amount)}{isNegative && amount > 0 ? ')' : ''}</span>
    </div>
);

const TotalRow = ({ label, amount, formatter }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, background: 'var(--color-slate-50)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
        <span>{label}</span>
        <span>{formatter(amount)}</span>
    </div>
);

const GrandTotalRow = ({ label, amount, formatter }) => (
    <div style={{ marginTop: '2rem', borderTop: '2px solid var(--color-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
        <span>{label}</span>
        <span>{formatter(amount)}</span>
    </div>
);

export default BalanceSheet;
