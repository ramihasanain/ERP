import React, { useState } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Plus, Eye, Filter, Search, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PurchaseOrderList = () => {
    const { purchaseOrders } = useProcurement();
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPOs = purchaseOrders.filter(po => {
        const matchesStatus = filterStatus === 'All' || po.status === filterStatus;
        const matchesSearch = po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'var(--color-slate-500)';
            case 'Pending Approval': return 'var(--color-warning)';
            case 'Approved': return 'var(--color-success)';
            case 'Rejected': return 'var(--color-danger)';
            case 'Closed': return 'var(--color-primary-700)';
            default: return 'var(--color-text-main)';
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Purchase Orders</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage procurement and vendor orders</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/inventory/purchase-orders/new')}>
                    New Purchase Order
                </Button>
            </div>

            <Card className="padding-md" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search POs or Vendors..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    />
                </div>
                <div style={{ display: 'flex', overflowX: 'auto', maxWidth: '100%', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['All', 'Draft', 'Pending Approval', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                                boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>PO ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Vendor</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Expected Delivery</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Amount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPOs.map(po => (
                            <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{po.id}</td>
                                <td style={{ padding: '1rem' }}>{po.vendorName}</td>
                                <td style={{ padding: '1rem' }}>{po.date}</td>
                                <td style={{ padding: '1rem' }}>{po.expectedDate}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{po.totalAmount.toLocaleString()} JOD</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', borderRadius: '4px',
                                        background: `${getStatusColor(po.status)}20`,
                                        color: getStatusColor(po.status),
                                        fontWeight: 600, fontSize: '0.8rem'
                                    }}>
                                        {po.status === 'Approved' && <CheckCircle size={12} />}
                                        {po.status === 'Rejected' && <XCircle size={12} />}
                                        {po.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => navigate(`/admin/inventory/purchase-orders/${po.id}`)}>
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredPOs.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No purchase orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default PurchaseOrderList;
