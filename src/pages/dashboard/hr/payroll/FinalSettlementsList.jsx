import React, { useState } from 'react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { usePayroll } from '../../../../context/PayrollContext';
import { FileText, Download, Eye, CheckCircle, Search } from 'lucide-react';

const FinalSettlementsList = () => {
    const navigate = useNavigate();
    const { finalSettlements } = usePayroll();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredSettlements = finalSettlements.filter(settlement => {
        const matchesSearch = settlement.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || settlement.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filter Bar */}
            <Card className="padding-md">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                            background: 'white', minWidth: '150px'
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
            </Card>

            {/* Settlements Table */}
            <Card className="padding-none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Employee</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Termination Type</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Net Payable</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSettlements.map((settlement) => (
                            <tr key={settlement.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{settlement.employeeName}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                        background: settlement.type === 'Resignation' ? 'var(--color-warning-50)' : 'var(--color-danger-50)',
                                        color: settlement.type === 'Resignation' ? 'var(--color-warning-800)' : 'var(--color-danger-800)'
                                    }}>
                                        {settlement.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{settlement.terminationDate}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{settlement.amount.toLocaleString()} JOD</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                                        background: settlement.status === 'Paid' ? 'var(--color-success-50)' : 'var(--color-slate-100)',
                                        color: settlement.status === 'Paid' ? 'var(--color-success-700)' : 'var(--color-slate-700)'
                                    }}>
                                        {settlement.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Eye size={16} />}
                                        title="View Details"
                                        onClick={() => navigate('/admin/hr/final-settlement', { state: { settlement } })}
                                    />
                                    <Button variant="ghost" size="sm" icon={<Download size={16} />} title="Download Slip" />
                                </td>
                            </tr>
                        ))}
                        {filteredSettlements.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No final settlements found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default FinalSettlementsList;
