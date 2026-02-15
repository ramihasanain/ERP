import React, { useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { CheckCircle, XCircle, FileText, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/common/Input';

const EmployeeRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([
        { id: 1, employee: 'Sarah Connor', type: 'Leave', detail: 'Annual Leave (Feb 20 - Feb 25)', status: 'Pending', date: 'Feb 08, 2026' },
        { id: 2, employee: 'David Miller', type: 'Document', detail: 'Salary Certificate Request', status: 'Pending', date: 'Feb 08, 2026' },
        { id: 3, employee: 'John Doe', type: 'Leave', detail: 'Sick Leave (Feb 07)', status: 'Approved', date: 'Feb 07, 2026' },
        { id: 4, employee: 'Mike Ross', type: 'Document', detail: 'Employment Letter', status: 'Approved', date: 'Feb 06, 2026' },
        { id: 5, employee: 'Rachel Zane', type: 'Leave', detail: 'Emergency Leave (Feb 05)', status: 'Rejected', date: 'Feb 05, 2026' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.detail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
        const matchesType = filterType === 'All' || req.type === filterType;

        const reqDate = new Date(req.date);
        const matchesDateFrom = !dateFrom || reqDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || reqDate <= new Date(dateTo);

        return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
    });

    const handleAction = (id, action) => {
        setRequests(requests.map(req =>
            req.id === id ? { ...req, status: action === 'approve' ? 'Approved' : 'Rejected' } : req
        ));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Employee Requests</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage leave applications and document requests.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Pending Requests</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                        {requests.filter(r => r.status === 'Pending').length}
                    </div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Approved This Month</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>12</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Rejected</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>2</div>
                </Card>
            </div>

            {/* Professional Filter Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '320px' }}>
                        <Input
                            placeholder="Search employee, request details..."
                            startIcon={<Search size={16} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ fontSize: '0.875rem' }}
                        />
                    </div>

                    <select
                        style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '160px' }}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Request Types</option>
                        <option value="Leave">Leave Applications</option>
                        <option value="Document">Document Requests</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>From:</span>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>To:</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Filter size={14} color="var(--color-text-muted)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
                        {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid ' + (filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-border)'),
                                    background: filterStatus === status ? 'var(--color-primary-600)' : 'white',
                                    color: filterStatus === status ? 'white' : 'var(--color-slate-600)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.8rem'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {(searchTerm || filterType !== 'All' || filterStatus !== 'All' || dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterType('All');
                                setFilterStatus('All');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                        >
                            Clear All Filters
                        </Button>
                    )}
                </div>
            </div>

            <Card className="padding-none">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '1rem 1.5rem' }}>Employee</th>
                            <th style={{ padding: '1rem 1rem' }}>Request Type</th>
                            <th style={{ padding: '1rem 1rem' }}>Details</th>
                            <th style={{ padding: '1rem 1rem' }}>Date Requested</th>
                            <th style={{ padding: '1rem 1rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((req) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'var(--color-slate-100)', borderRadius: '50%' }}>
                                            <User size={16} />
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{req.employee}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {req.type === 'Leave' ? <Calendar size={16} color="var(--color-primary-600)" /> : <FileText size={16} color="var(--color-secondary-600)" />}
                                        {req.type}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1rem' }}>{req.detail}</td>
                                <td style={{ padding: '1rem 1rem' }}>{req.date}</td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: req.status === 'Approved' ? 'var(--color-success-dim)' : req.status === 'Rejected' ? 'var(--color-error-dim)' : 'var(--color-warning-dim)',
                                        color: req.status === 'Approved' ? 'var(--color-success)' : req.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-warning)'
                                    }}>
                                        {req.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    {req.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="outline"
                                                style={{ padding: '0.25rem', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                                onClick={() => handleAction(req.id, 'approve')}
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                style={{ padding: '0.25rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                onClick={() => handleAction(req.id, 'reject')}
                                                title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredRequests.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No requests match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default EmployeeRequests;
