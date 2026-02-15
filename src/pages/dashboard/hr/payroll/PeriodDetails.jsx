import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { usePayroll } from '../../../../context/PayrollContext';
import { useHR } from '../../../../context/HRContext';
import { ArrowLeft, Download, Lock, CheckCircle, Clock } from 'lucide-react';

const PeriodDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { payrollPeriods } = usePayroll();
    const { employees } = useHR();

    const period = payrollPeriods.find(p => p.id === id);

    // Mock calculations for the employees in this period
    const employeeData = useMemo(() => {
        return employees.map(emp => ({
            id: emp.id,
            name: emp.firstName + ' ' + emp.lastName,
            department: emp.department || 'General',
            gross: emp.salary || 3000,
            net: (emp.salary || 3000) * 0.85 // Mock net
        }));
    }, [employees]);

    if (!period) return <div>Period not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/hr/payroll')}>Back</Button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{period.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{period.startDate} to {period.endDate}</span>
                        <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: period.status === 'Locked' ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                            color: period.status === 'Locked' ? 'var(--color-success-700)' : 'var(--color-warning-700)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            {period.status === 'Locked' ? <Lock size={12} /> : <Clock size={12} />}
                            {period.status}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={18} />}>Export XLSX</Button>
                    {period.status !== 'Locked' && (
                        <Button variant="primary" icon={<CheckCircle size={18} />}>Approve & Lock</Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Gross</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(employeeData.length * 3000).toLocaleString()} JOD</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Net Pay</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(employeeData.length * 3000 * 0.85).toLocaleString()} JOD</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Deductions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error-600)' }}>{(employeeData.length * 3000 * 0.15).toLocaleString()} JOD</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Employees Paid</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{employeeData.length}</div>
                </Card>
            </div>

            <Card className="padding-none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Employee</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Department</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Gross Pay</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Deductions</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Net Pay</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeeData.map((emp) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{emp.name}</td>
                                <td style={{ padding: '1rem 1rem' }}>{emp.department}</td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>{emp.gross.toLocaleString()}</td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right', color: 'var(--color-error-600)' }}>{(emp.gross * 0.15).toLocaleString()}</td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right', fontWeight: 600 }}>{emp.net.toLocaleString()} JOD</td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/hr/payroll/payslip/${emp.id}`)}>
                                        View Payslip
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default PeriodDetails;
