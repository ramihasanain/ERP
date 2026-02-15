import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../../../components/common/Button';
import { Printer, Download, ArrowLeft } from 'lucide-react';

const PayslipPDF = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="printable-area" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="primary" icon={<Printer size={18} />} onClick={handlePrint}>Print / Save as PDF</Button>
                </div>
            </div>

            {/* Payslip Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>PAYSLIP</h1>
                    <p style={{ color: '#666' }}>#PS-2026-02-001</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Antigravity Tech</h2>
                    <p style={{ color: '#666' }}>Amman, Jordan</p>
                    <p style={{ color: '#666' }}>VAT: 123456789</p>
                </div>
            </div>

            {/* Employee Info Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '20px', background: '#f8fafc', borderRadius: '8px', marginBottom: '3rem' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Employee Details</p>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ahmed Mansour</h3>
                    <p style={{ color: '#475569' }}>Senior Software Engineer</p>
                    <p style={{ color: '#475569' }}>Emp ID: EMP-001</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Period Details</p>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>February 2026</h3>
                    <p style={{ color: '#475569' }}>Payment Date: Feb 28, 2026</p>
                    <p style={{ color: '#475569' }}>Bank: Arab Bank (****1234)</p>
                </div>
            </div>

            {/* Calculations Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {/* Earnings */}
                <div>
                    <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>EARNINGS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Basic Salary</span>
                            <span style={{ fontWeight: 600 }}>2,000.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Housing Allowance</span>
                            <span style={{ fontWeight: 600 }}>800.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Transportation</span>
                            <span style={{ fontWeight: 600 }}>200.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>Total Earnings</span>
                            <span style={{ fontWeight: 700 }}>3,000.00 JOD</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div>
                    <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>DEDUCTIONS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Social Security (7.5%)</span>
                            <span style={{ fontWeight: 600 }}>225.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Income Tax</span>
                            <span style={{ fontWeight: 600 }}>110.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                            <span>Late Arrival Deduction</span>
                            <span style={{ fontWeight: 600 }}>15.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>Total Deductions</span>
                            <span style={{ fontWeight: 700 }}>350.00 JOD</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Pay Summary */}
            <div style={{ marginTop: '4rem', padding: '30px', background: 'var(--color-primary-900)', color: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Monthly Pay</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Two Thousand Six Hundred Fifty JOD Only)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>2,650.00 JOD</h2>
                </div>
            </div>

            {/* Footer / Signature */}
            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Employee Signature</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ height: '50px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=AT&backgroundColor=020617" alt="stamp" style={{ height: '50px', opacity: 0.2 }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Authorized Stamp</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .printable-area { padding: 0 !important; width: 100% !important; max-width: none !important; }
                }
            `}} />
        </div>
    );
};

export default PayslipPDF;
