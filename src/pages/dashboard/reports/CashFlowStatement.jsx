import React, { useMemo, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAccounting } from '../../../context/AccountingContext';
import { ArrowLeft, Download, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CashFlowStatement = () => {
    const navigate = useNavigate();
    const { entries: journalEntries, companyProfile } = useAccounting();
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        let operatingCashFlow = 0;
        let investingCashFlow = 0;
        let financingCashFlow = 0;

        // Filter entries by date
        const filteredEntries = journalEntries.filter(entry => {
            if (entry.status !== 'Posted') return false;
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });

        // Analyze Cash (1111, 1131, etc.) movements against other accounts
        // Strategy: Look at lines involving Cash accounts (starts with '11')
        // and determine the nature of the *other* side of the transaction.

        filteredEntries.forEach(entry => {
            // Find cash lines in this entry
            const cashLines = entry.lines.filter(l => l.account.startsWith('11') && !l.account.startsWith('1140')); // Exclude AR (1140) if it's considered non-cash for direct method, but here we use direct cash impact.
            // Actually, simplified approach:
            // Debit Cash = Inflow
            // Credit Cash = Outflow

            cashLines.forEach(cashLine => {
                const amount = (cashLine.debit || 0) - (cashLine.credit || 0);

                // Determine category based on the *contra* lines (non-cash lines in same entry)
                // This is a heuristic for the demo.
                const contraLines = entry.lines.filter(l => l !== cashLine);
                const contraAccount = contraLines.length > 0 ? contraLines[0].account : '';

                if (contraAccount.startsWith('4')) { // Sales
                    operatingCashFlow += amount;
                } else if (contraAccount.startsWith('6')) { // Expenses
                    operatingCashFlow += amount;
                } else if (contraAccount.startsWith('1140')) { // AR Collection
                    operatingCashFlow += amount;
                } else if (contraAccount.startsWith('2100')) { // AP Payment
                    operatingCashFlow += amount;
                } else if (contraAccount.startsWith('12')) { // Fixed Assets
                    investingCashFlow += amount;
                } else if (contraAccount.startsWith('3')) { // Equity/Capital
                    financingCashFlow += amount;
                } else if (contraAccount.startsWith('2')) { // Liabilities (Loans)
                    financingCashFlow += amount;
                } else {
                    // Default fallback
                    operatingCashFlow += amount;
                }
            });
        });

        const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
        const beginningCash = 50000; // Mock opening balance for demo, ideally calculated from pre-period entries
        const endingCash = beginningCash + netCashFlow;

        return {
            operatingCashFlow,
            investingCashFlow,
            financingCashFlow,
            netCashFlow,
            beginningCash,
            endingCash
        };
    }, [journalEntries, startDate, endDate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/reports')}>Back</Button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Cash Flow Statement</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{companyProfile.name} • {startDate} to {endDate}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={18} />}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                    <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Operating Activities */}
                    <SectionHeader title="Operating Activities" />
                    <Row label="Net Cash from Operations" amount={reportData.operatingCashFlow} isTotal />

                    {/* Investing Activities */}
                    <div style={{ height: '1.5rem' }}></div>
                    <SectionHeader title="Investing Activities" />
                    <Row label="Net Cash from Investing" amount={reportData.investingCashFlow} isTotal />

                    {/* Financing Activities */}
                    <div style={{ height: '1.5rem' }}></div>
                    <SectionHeader title="Financing Activities" />
                    <Row label="Net Cash from Financing" amount={reportData.financingCashFlow} isTotal />

                    {/* Summary */}
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid var(--color-border)' }}>
                        <Row label="Net Increase/Decrease in Cash" amount={reportData.netCashFlow} isBold />
                        <Row label="Cash at Beginning of Period" amount={reportData.beginningCash} />
                        <Row label="Cash at End of Period" amount={reportData.endingCash} isDoubleUnderline />
                    </div>
                </div>
            </Card>
        </div>
    );
};

const SectionHeader = ({ title }) => (
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>
        {title}
    </h3>
);

const Row = ({ label, amount, isTotal, isBold, isDoubleUnderline }) => {
    const { companyProfile } = useAccounting();
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
                {amount < 0 ? '(' : ''}{companyProfile.currency} {Math.abs(amount).toLocaleString()}{amount < 0 ? ')' : ''}
            </span>
        </div>
    );
};

export default CashFlowStatement;
