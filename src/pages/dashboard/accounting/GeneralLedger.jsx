import React from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Search, Download, Filter } from 'lucide-react';

const GeneralLedger = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>General Ledger</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Detailed history of all transactions per account.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={18} />}>Export PDF</Button>
                    <Button variant="outline" icon={<Filter size={18} />}>Filter Date</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>1010 - Cash on Hand</h3>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Current Balance</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>$45,200.00</div>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.75rem 0' }}>Date</th>
                            <th style={{ padding: '0.75rem 0' }}>Reference</th>
                            <th style={{ padding: '0.75rem 0' }}>Description</th>
                            <th style={{ padding: '0.75rem 0' }}>Cost Center</th>
                            <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Debit</th>
                            <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Credit</th>
                            <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 0' }}>2025-01-01</td>
                            <td style={{ padding: '1rem 0' }}>OPENING</td>
                            <td style={{ padding: '1rem 0' }}>Opening Balance</td>
                            <td style={{ padding: '1rem 0' }}>-</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$50,000.00</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>$50,000.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 0' }}>2025-01-05</td>
                            <td style={{ padding: '1rem 0' }}>PAY-001</td>
                            <td style={{ padding: '1rem 0' }}>Office Rent Jan</td>
                            <td style={{ padding: '1rem 0' }}>Admin</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$2,000.00</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>$48,000.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 0' }}>2025-01-10</td>
                            <td style={{ padding: '1rem 0' }}>INV-001</td>
                            <td style={{ padding: '1rem 0' }}>Sales Revenue (Cash)</td>
                            <td style={{ padding: '1rem 0' }}>Sales</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$1,200.00</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>$49,200.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 0' }}>2025-01-15</td>
                            <td style={{ padding: '1rem 0' }}>PUR-023</td>
                            <td style={{ padding: '1rem 0' }}>Laptop Purchase</td>
                            <td style={{ padding: '1rem 0' }}>IT</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$4,000.00</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>$45,200.00</td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default GeneralLedger;
