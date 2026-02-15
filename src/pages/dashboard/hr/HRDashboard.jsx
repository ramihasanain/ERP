import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Users, UserPlus, FileText, DollarSign, Briefcase, Clock, Calendar, CreditCard } from 'lucide-react';

const HRDashboard = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>HR & Payroll</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage your workforce and compensation.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button icon={<UserPlus size={18} />} onClick={() => navigate('/admin/hr/employees/new')}>Add Employee</Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/hr/organization')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Organization</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Departments & Positions.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/hr/employees')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Employee Directory</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>View all 124 active employees.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/hr/payroll')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <CreditCard size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Payroll</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Process salaries and payslips.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/hr/requests')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Requests & Approvals</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Approve leaves & docs.</p>
                </Card>
            </div>
        </div>
    );
};

export default HRDashboard;
