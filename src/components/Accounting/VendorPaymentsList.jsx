import React, { useState } from 'react';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { CheckCircle, XCircle, Clock, Filter, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorPaymentsList = () => {
    const { vendorPayments, approveVendorPayment, rejectVendorPayment } = useAccounting();
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPayments = vendorPayments.filter(pay => {
        const matchesStatus = filterStatus === 'All' || pay.status === filterStatus;
        const matchesSearch = pay.billId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pay.vendorId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'var(--color-success)';
            case 'Rejected': return 'var(--color-error)';
            case 'Pending Approval': return 'var(--color-warning)';
            default: return 'var(--color-text-muted)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={16} />;
            case 'Rejected': return <XCircle size={16} />;
            case 'Pending Approval': return <Clock size={16} />;
            default: return null;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vendor Payment Clearances</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Approve or reject bill payment requests from Procurement.</p>
                    </div>
                </div>
            </div>

            <Card className="padding-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by Bill ID or Vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        {['All', 'Pending Approval', 'Approved', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 12px', border: 'none', borderRadius: '6px',
                                    background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                                    boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                                }}
                            >
                                {status === 'Pending Approval' ? 'Pending' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Payment ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bill Reference</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Amount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(pay => (
                            <tr key={pay.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>{pay.id}</td>
                                <td style={{ padding: '1rem' }}>{pay.date}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{pay.billId}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{pay.vendorId}</div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 700 }}>{pay.amount.toLocaleString()} JOD</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 10px', borderRadius: '20px',
                                        background: `${getStatusColor(pay.status)}15`,
                                        color: getStatusColor(pay.status),
                                        fontWeight: 600, fontSize: '0.75rem'
                                    }}>
                                        {getStatusIcon(pay.status)}
                                        {pay.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {pay.status === 'Pending Approval' ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                onClick={() => approveVendorPayment(pay.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                                onClick={() => {
                                                    const reason = prompt("Enter rejection reason:");
                                                    if (reason) rejectVendorPayment(pay.id, reason);
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            {pay.status === 'Approved' ? `Approved by ${pay.approvedBy}` : `Rejected: ${pay.rejectionReason}`}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No payment requests found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default VendorPaymentsList;
