import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, PlayCircle, Settings, Layout, Users, TrendingUp, Percent, Shield, List, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePayroll } from '@/context/PayrollContext';
import FinalSettlementsList from './payroll/FinalSettlementsList';

const Payroll = () => {
    const navigate = useNavigate();
    const { payrollPeriods } = usePayroll();
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payroll Dashboard</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage salary components, structures, and process monthly runs.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Settings size={18} />} onClick={() => navigate('/admin/hr/payroll/components')}>
                        Components
                    </Button>
                    <Button variant="outline" icon={<Layout size={18} />} onClick={() => navigate('/admin/hr/payroll/structures')}>
                        Structures
                    </Button>
                    <Button variant="outline" icon={<Percent size={18} />} onClick={() => navigate('/admin/hr/payroll/tax-slabs')}>
                        Taxes
                    </Button>
                    <Button variant="primary" icon={<PlayCircle size={18} />} onClick={() => navigate('/admin/hr/payroll/run')}>
                        Run Payroll
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: activeTab === 'overview' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'overview' ? 600 : 500
                    }}
                >
                    <BarChart2 size={18} />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('settlements')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        borderBottom: activeTab === 'settlements' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: activeTab === 'settlements' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'settlements' ? 600 : 500
                    }}
                >
                    <List size={18} />
                    Final Settlements & EOS
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        <Card className="padding-md">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Payroll Cost</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>142,500.00 JOD</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <TrendingUp size={12} /> +2.4% from last month
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Active Employees</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>124</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Across 4 departments</p>
                        </Card>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Next Pay Date</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Feb 28, 2026</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>Process in 14 days</p>
                        </Card>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Last Run Status</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>Posted</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>JE-2026-012 Posted to GL</p>
                        </Card>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem' }}>Payroll Periods</h3>
                    <Card className="padding-none">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Period Name</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Employees</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total Net</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollPeriods.map((period) => (
                                    <tr key={period.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{period.name}</td>
                                        <td style={{ padding: '1rem 1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: period.status === 'Locked' ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))' : 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                                color: period.status === 'Locked' ? 'var(--color-success)' : 'var(--color-warning)'
                                            }}>
                                                {period.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1rem' }}>124</td>
                                        <td style={{ padding: '1rem 1rem', textAlign: 'right', fontWeight: 600 }}>110,400.00 JOD</td>
                                        <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/hr/payroll/period/${period.id}`)}>
                                                View Details
                                            </Button>
                                            <Button variant="ghost" size="sm" icon={<Download size={14} />}></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </>
            ) : (
                <FinalSettlementsList />
            )}
        </div>
    );
};

export default Payroll;
