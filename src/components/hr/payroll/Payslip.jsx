import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Printer } from 'lucide-react';

const fallbackPayslipData = {
        employeeName: "John Doe",
        employeeId: "EMP-001",
        designation: "Senior Software Engineer",
        department: "IT & Development",
        period: "February 2026",
        payDate: "Feb 28, 2026",
        currency: "JOD",
        companyName: "ANTIGRAVITY ERP",
        companyLocation: "Amman, Jordan - King Hussein St.",
        payslipNumber: "PS-2026-02-001",
        activeEmployeesInRun: 0,
        bankName: "Arab Bank",
        accountNumber: "**** 4829",
        earnings: [
            { name: "Basic Salary", amount: 2500 },
            { name: "Housing Allowance", amount: 1000 },
            { name: "Transportation", amount: 250 },
            { name: "Overtime", amount: 150 },
        ],
        deductions: [
            { name: "Social Security", amount: 187.50 },
            { name: "Income Tax", amount: 250.00 },
            { name: "Health Insurance", amount: 50.00 },
        ],
        summary: {
            gross: 3900,
            deductions: 487.50,
            netPay: 3412.50
        }
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const resolvePayload = (apiData = {}) => {
    if (!apiData) return {};

    if (apiData.payslip_number || apiData.period || apiData.company || apiData.employee) {
        return apiData;
    }

    if (apiData.data && typeof apiData.data === 'object') {
        return apiData.data;
    }

    if (apiData.result && typeof apiData.result === 'object') {
        return apiData.result;
    }

    if (apiData.payload && typeof apiData.payload === 'object') {
        return apiData.payload;
    }

    return apiData;
};

const normalizePayslipData = (apiData = {}) => {
    const payload = resolvePayload(apiData);

    if (!payload || Object.keys(payload).length === 0) {
        return fallbackPayslipData;
    }

    const periodName = payload.period?.name || fallbackPayslipData.period;
    const currency = payload.period?.currency || payload.base_currency || fallbackPayslipData.currency;
    const gross = toNumber(payload.totals?.gross_pay);
    const totalDeductions = toNumber(payload.totals?.total_deductions);
    const netPay = toNumber(payload.totals?.net_pay);

    return {
        employeeName: payload.employee?.name || fallbackPayslipData.employeeName,
        employeeId: payload.employee?.id || fallbackPayslipData.employeeId,
        designation: payload.employee?.position || fallbackPayslipData.designation,
        department: payload.employee?.department || fallbackPayslipData.department,
        period: periodName,
        payDate: formatDate(payload.period?.payment_date) || fallbackPayslipData.payDate,
        currency,
        companyName: payload.company?.name || fallbackPayslipData.companyName,
        companyLocation: payload.company_location || payload.company?.location || fallbackPayslipData.companyLocation,
        payslipNumber: payload.payslip_number || fallbackPayslipData.payslipNumber,
        activeEmployeesInRun: payload.active_employees_in_run ?? payload.active_empolyees_in_run ?? fallbackPayslipData.activeEmployeesInRun,
        bankName: payload.bank || payload.employee?.bank_name || fallbackPayslipData.bankName,
        accountNumber: payload.account || payload.employee?.account_number || fallbackPayslipData.accountNumber,
        earnings: (payload.earnings || []).map((item) => ({
            name: item.label,
            amount: toNumber(item.amount),
        })),
        deductions: (payload.deductions_items || []).map((item) => ({
            name: item.label,
            amount: toNumber(item.amount),
        })),
        summary: {
            gross: gross || (payload.earnings || []).reduce((total, item) => total + toNumber(item.amount), 0),
            deductions: totalDeductions || (payload.deductions_items || []).reduce((total, item) => total + toNumber(item.amount), 0),
            netPay: netPay || 0,
        },
    };
};

const Payslip = ({ data }) => {
    const { t } = useTranslation(['hr', 'common']);

    const payslipData = normalizePayslipData(data);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Employee Payslip</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{payslipData.period}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Printer size={18} />}>Print</Button>
                    <Button variant="primary" icon={<Download size={18} />}>Download PDF</Button>
                </div>
            </div>

            <Card style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                {/* Header Section */}
                <div style={{ background: 'var(--color-slate-50)', padding: '2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{payslipData.companyName}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{payslipData.companyLocation}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Phone: +962 6 000 0000</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>PAYSLIP</h1>
                        <p style={{ fontWeight: 600 }}>#{payslipData.payslipNumber}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Employee Name:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.employeeName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Employee ID:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.employeeId}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Designation:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.designation}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Department:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.department}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Pay Date:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.payDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Pay Period:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.period}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Bank Name:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.bankName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Account No:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.accountNumber}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Active Employees in Run:</span>
                            <span style={{ fontWeight: 600 }}>{payslipData.activeEmployeesInRun}</span>
                        </div>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-border)' }}>
                    {/* Earnings */}
                    <div style={{ borderRight: '1px solid var(--color-border)' }}>
                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem 2rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>EARNINGS</div>
                        <div style={{ padding: '1.5rem 2rem' }}>
                            {payslipData.earnings.map((e, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span>{e.name}</span>
                                    <span style={{ fontWeight: 500 }}>{e.amount.toLocaleString()} {payslipData.currency}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Deductions */}
                    <div>
                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem 2rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>DEDUCTIONS</div>
                        <div style={{ padding: '1.5rem 2rem' }}>
                            {payslipData.deductions.map((d, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span>{d.name}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-error-600)' }}>-{d.amount.toLocaleString()} {payslipData.currency}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Footer */}
                <div style={{ background: 'var(--color-slate-50)', padding: '2rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
                    <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Earnings</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{payslipData.summary.gross.toLocaleString()} {payslipData.currency}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Deductions</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error-600)' }}>{payslipData.summary.deductions.toLocaleString()} {payslipData.currency}</p>
                    </div>
                    <div style={{ background: 'var(--color-primary-600)', color: 'white', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Net Payable</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{payslipData.summary.netPay.toLocaleString()} {payslipData.currency}</p>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    This is a computer-generated document and does not require a physical signature.
                </div>
            </Card>
        </div>
    );
};

export default Payslip;
