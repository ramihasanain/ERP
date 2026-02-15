import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, Download, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Payslips = () => {
    const navigate = useNavigate();
    const payslips = [
        { id: 1, month: 'February 2026', date: 'Feb 28, 2026', amount: '$3,250.00', status: 'Paid' },
        { id: 2, month: 'January 2026', date: 'Jan 31, 2026', amount: '$3,250.00', status: 'Paid' },
        { id: 3, month: 'December 2025', date: 'Dec 31, 2025', amount: '$3,250.00', status: 'Paid' },
        { id: 4, month: 'November 2025', date: 'Nov 30, 2025', amount: '$3,250.00', status: 'Paid' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Payslips</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>View and download your monthly salary slips.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {payslips.map(slip => (
                    <Card key={slip.id} className="padding-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.75rem', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', borderRadius: 'var(--radius-md)' }}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{slip.month}</h3>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Processed on {slip.date}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Net Pay</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slip.amount}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye size={16} />}
                                onClick={() => navigate(`/admin/hr/payroll/payslip/${slip.id}`)}
                            >
                                عرض
                            </Button>
                            <Button variant="ghost" style={{ flex: 1 }} icon={<Download size={16} />} onClick={() => alert(`Downloading payslip for ${slip.month}...`)}>
                                PDF
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Payslips;
