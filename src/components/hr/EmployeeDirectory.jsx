import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Filter, Mail, Phone, MoreHorizontal, UserPlus, AlertTriangle, DollarSign, TrendingUp, Calendar, Settings } from 'lucide-react';
import { useHR } from '@/context/HRContext';
import EvaluationSettingsModal from './EvaluationSettingsModal';

const EmployeeDirectory = () => {
    const navigate = useNavigate();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const { employees, departments, jobPositions } = useHR();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterPos, setFilterPos] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'All' || emp.departmentId === filterDept;
        const matchesPos = filterPos === 'All' || emp.positionId === filterPos;
        const matchesStatus = filterStatus === 'All' || emp.status === matchesStatus; // Wait, actually emp.status === filterStatus
        return matchesSearch && matchesDept && matchesPos && (filterStatus === 'All' || emp.status === filterStatus);
    });

    const getDeptName = (id) => departments.find(d => d.id === id)?.name || 'Unknown';
    const getPosTitle = (id) => jobPositions.find(p => p.id === id)?.title || 'Unknown';

    // Dashboard Statistics
    const expiringContracts = employees.filter(e => {
        if (!e.contract?.endDate) return false;
        const daysLeft = (new Date(e.contract.endDate) - new Date()) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 30; // Expiring in next 30 days
    });

    const totalMonthlyPayroll = employees.reduce((acc, curr) => acc + (curr.contract?.basicSalary || 0), 0);

    const payrollByDept = departments.map(dept => {
        const deptTotal = employees
            .filter(e => e.departmentId === dept.id)
            .reduce((acc, curr) => acc + (curr.contract?.basicSalary || 0), 0);
        return { name: dept.name, total: deptTotal };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Dashboard Summary Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* 1. Enhanced Expiring Contracts Widget */}
                <Card className="padding-md" style={{ borderLeft: '4px solid var(--color-warning-500)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={18} color="var(--color-warning-600)" />
                                Contracts Expiring Soon
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Action required within 30 days</p>
                        </div>
                        <span style={{ background: 'var(--color-warning-100)', color: 'var(--color-warning-700)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                            {expiringContracts.length} Pending
                        </span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {expiringContracts.length > 0 ? (
                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-table-header)', zIndex: 1 }}>
                                    <tr style={{ color: 'var(--color-text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>Employee</th>
                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>Type</th>
                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>Expires In</th>
                                        <th style={{ padding: '0.5rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringContracts.map(e => {
                                        const daysLeft = Math.ceil((new Date(e.contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                                        const isCritical = daysLeft <= 10;
                                        return (
                                            <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                                <td style={{ padding: '0.5rem', fontWeight: 500 }}>
                                                    {e.firstName} {e.lastName}
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{getDeptName(e.departmentId)}</div>
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>{e.contract.type}</td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <span style={{
                                                        color: isCritical ? 'var(--color-danger-600)' : 'var(--color-warning-700)',
                                                        fontWeight: 600,
                                                        background: isCritical ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                                        padding: '0.1rem 0.4rem', borderRadius: '4px'
                                                    }}>
                                                        {daysLeft} days
                                                    </span>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{e.contract.endDate}</div>
                                                </td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/hr/employees/${e.id}`)}>Renew</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                No contracts expiring in the next 30 days.
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. Detailed Monthly Payroll Summary */}
                <Card className="padding-md" style={{ borderLeft: '4px solid var(--color-success-500)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <DollarSign size={18} color="var(--color-success-600)" />
                                Monthly Payroll Breakdown
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Estimated recurring cost (Active Employees)</p>
                        </div>
                    </div>

                    {/* Financial Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Total Basic Salaries</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                {employees.reduce((acc, curr) => acc + (curr.contract?.basicSalary || 0), 0).toLocaleString()} JOD
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'color-mix(in srgb, var(--color-success) 14%, var(--color-bg-card))', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Total Net Payable</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-700)' }}>
                                {employees.reduce((acc, curr) => {
                                    const c = curr.contract || {};
                                    const basic = c.basicSalary || 0;
                                    const allowances = (c.transportationAllowance || 0) + (c.housingAllowance || 0) + (c.otherAllowance || 0);
                                    const deductions = (c.socialSecurityDeduction || 0) + (c.healthInsuranceDeduction || 0) + (c.otherDeduction || 0);
                                    return acc + (basic + allowances - deductions);
                                }, 0).toLocaleString()} JOD
                            </div>
                        </div>
                    </div>

                    {/* Department Distribution */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>Cost by Department</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                            {payrollByDept.slice(0, 4).map((dept, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                                    <span style={{ width: '35%', color: 'var(--color-text-main)' }}>{dept.name}</span>
                                    <div style={{ flex: 1, background: 'var(--color-bg-subtle)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(dept.total / totalMonthlyPayroll) * 100}%`, background: 'var(--color-primary-500)', height: '100%' }}></div>
                                    </div>
                                    <span style={{ width: '25%', textAlign: 'right', fontWeight: 600 }}>{dept.total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Employee Directory</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        {filteredEmployees.length} {filteredEmployees.length === 1 ? 'member' : 'members'} found
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '280px' }}>
                        <Input
                            placeholder="Search by name or email..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" icon={<Settings size={16} />} onClick={() => setIsSettingsModalOpen(true)} title="Evaluation Settings" />
                    <Button icon={<UserPlus size={16} />} onClick={() => navigate('/admin/hr/employees/new')}>Add Employee</Button>
                </div>
            </div>

            {/* Professional Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', background: 'var(--color-bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--color-text-muted)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Filters:</span>
                </div>

                <select
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '160px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <select
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '160px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    value={filterPos}
                    onChange={(e) => setFilterPos(e.target.value)}
                >
                    <option value="All">All Positions</option>
                    {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>

                <select
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '140px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                </select>

                {(searchTerm || filterDept !== 'All' || filterPos !== 'All' || filterStatus !== 'All') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterDept('All');
                            setFilterPos('All');
                            setFilterStatus('All');
                        }}
                        style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            <EvaluationSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filteredEmployees.map((emp) => (
                    <Card
                        key={emp.id}
                        className="padding-md hoverable"
                        onClick={() => navigate(`/admin/hr/employees/${emp.id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <Button variant="ghost" size="sm" icon={<MoreHorizontal size={16} />} className="iconOnly" onClick={(e) => e.stopPropagation()} />
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{emp.firstName} {emp.lastName}</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{getPosTitle(emp.positionId)}</p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', borderRadius: '1rem' }}>{getDeptName(emp.departmentId)}</span>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: emp.status === 'Active' ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)', color: emp.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-secondary)', borderRadius: '1rem' }}>{emp.status}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={14} /> {emp.email}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EmployeeDirectory;
