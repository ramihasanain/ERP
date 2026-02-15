import React from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Download, Filter, CheckCircle } from 'lucide-react';

const TrialBalance = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Trial Balance</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>As of Feb 08, 2026</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={18} />}>Export Excel</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    <CheckCircle size={20} />
                    Accounts are balanced
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-main)' }}>
                            <th style={{ padding: '0.75rem 0' }}>Account Code</th>
                            <th style={{ padding: '0.75rem 0' }}>Account Name</th>
                            <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Debit</th>
                            <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>1010</td>
                            <td style={{ padding: '0.75rem 0' }}>Cash on Hand</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$45,200.00</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>1100</td>
                            <td style={{ padding: '0.75rem 0' }}>Accounts Receivable</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$12,500.00</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>1200</td>
                            <td style={{ padding: '0.75rem 0' }}>Fixed Assets</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$25,000.00</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>2000</td>
                            <td style={{ padding: '0.75rem 0' }}>Accounts Payable</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$8,400.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>3000</td>
                            <td style={{ padding: '0.75rem 0' }}>Capital</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$50,000.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>4000</td>
                            <td style={{ padding: '0.75rem 0' }}>Sales Revenue</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$42,300.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 0', fontFamily: 'var(--font-mono)' }}>5000</td>
                            <td style={{ padding: '0.75rem 0' }}>Operating Expenses</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>$18,000.00</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>-</td>
                        </tr>

                        {/* Totals */}
                        <tr style={{ fontWeight: 700, background: 'var(--color-slate-50)' }}>
                            <td style={{ padding: '1rem 0' }}></td>
                            <td style={{ padding: '1rem 0' }}>Total</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$100,700.00</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>$100,700.00</td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default TrialBalance;
