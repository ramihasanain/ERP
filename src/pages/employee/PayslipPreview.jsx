import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';

const PayslipPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payslip, setPayslip] = useState(null);

    useEffect(() => {
        // Mock data fetch
        setPayslip({
            id: id,
            month: 'February 2026',
            period: 'Feb 01, 2026 - Feb 28, 2026',
            employee: {
                name: 'Sarah Connor',
                id: 'EMP-2024-001',
                department: 'Engineering',
                designation: 'Senior Frontend Developer',
                joinDate: 'Jan 15, 2024'
            },
            earnings: [
                { label: 'Basic Salary', amount: 2500.00 },
                { label: 'Housing Allowance', amount: 500.00 },
                { label: 'Transport Allowance', amount: 200.00 },
                { label: 'Performance Bonus', amount: 300.00 },
            ],
            deductions: [
                { label: 'Income Tax', amount: 150.00 },
                { label: 'Health Insurance', amount: 50.00 },
                { label: 'Social Security', amount: 50.00 },
            ],
            netPay: 3250.00,
            paymentMethod: 'Bank Transfer',
            bankDetails: 'Chase Bank **** 1234'
        });
    }, [id]);

    if (!payslip) return <div>Loading...</div>;

    const totalEarnings = payslip.earnings.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDeductions = payslip.deductions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/employee/payslips')}>Back</Button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payslip for {payslip.month}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Reference: #PAY-{id}-2026</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={<Printer size={18} />}>Print</Button>
                    <Button icon={<Download size={18} />}>Download PDF</Button>
                </div>
            </div>

            <Card className="padding-xl" style={{ border: '1px solid var(--color-border)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-slate-100)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-600)', marginBottom: '0.5rem' }}>UnifiedCore</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>123 Tech Park, Silicon Valley, CA</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Payslip</div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>{payslip.period}</div>
                    </div>
                </div>

                {/* Employee Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Employee Details</h4>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{payslip.employee.name}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{payslip.employee.designation}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>ID: {payslip.employee.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Bank Details</h4>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{payslip.paymentMethod}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{payslip.bankDetails}</div>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '2rem' }}>

                    {/* Earnings */}
                    <div style={{ borderRight: '1px solid var(--color-border)' }}>
                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem 1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Earnings</div>
                        <div style={{ padding: '1rem' }}>
                            {payslip.earnings.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--color-text-main)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 500 }}>${item.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>Total Earnings</span>
                                <span>${totalEarnings.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem 1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Deductions</div>
                        <div style={{ padding: '1rem' }}>
                            {payslip.deductions.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--color-text-main)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-error)' }}>-${item.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>Total Deductions</span>
                                <span style={{ color: 'var(--color-error)' }}>-${totalDeductions.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Pay */}
                <div style={{ background: 'var(--color-primary-50)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-700)', fontWeight: 600, textTransform: 'uppercase' }}>Net Pay</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)' }}>Total amount paid to employee</div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                        ${payslip.netPay.toFixed(2)}
                    </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    This is a computer-generated document and does not require a signature.
                </div>
            </Card>
        </div>
    );
};

export default PayslipPreview;
