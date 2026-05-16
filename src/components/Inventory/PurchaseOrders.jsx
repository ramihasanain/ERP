import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Filter } from 'lucide-react';

const allPOs = [
    { id: 'PO-2025-881', date: '2025-02-11', supplier: 'Global Tech Supplies Ltd.', total: 12450.00, status: 'Open' },
    { id: 'PO-2025-882', date: '2025-02-12', supplier: 'Office Depot Inc.', total: 1250.25, status: 'Received' },
    { id: 'PO-2025-883', date: '2025-02-13', supplier: 'Logistics Pro Solutions', total: 6700.00, status: 'Received' },
    { id: 'PO-2025-884', date: '2025-02-14', supplier: 'Global Tech Supplies Ltd.', total: 890.00, status: 'Canceled' },
];

const PurchaseOrders = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const currency = (() => {
        if (typeof window === 'undefined') return '$';
        try {
            return localStorage.getItem('erp_currency') || '$';
        } catch {
            return '$';
        }
    })();

    const filteredPOs = allPOs.filter(po => {
        const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || po.status === statusFilter;

        const poDate = new Date(po.date);
        const matchesFrom = !dateFrom || poDate >= new Date(dateFrom);
        const matchesTo = !dateTo || poDate <= new Date(dateTo);

        return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Purchase Orders</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            {filteredPOs.length} orders tracked
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>Create PO</Button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '300px' }}>
                        <Input
                            placeholder="Search PO or supplier..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Filter size={14} color="var(--color-text-muted)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
                        <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            {['All', 'Open', 'Received', 'Canceled'].map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: '6px 14px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: statusFilter === status ? 'var(--color-bg-surface)' : 'transparent',
                                        boxShadow: statusFilter === status ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                        color: statusFilter === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(searchTerm || statusFilter !== 'All' || dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('All');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>PO Number</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Supplier</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Total</th>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPOs.map((po) => (
                            <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                <td style={{ padding: '1rem 1.5rem' }}>{po.date}</td>
                                <td style={{ padding: '1rem 1rem', fontWeight: 600 }}>{po.id}</td>
                                <td style={{ padding: '1rem 1rem' }}>{po.supplier}</td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                    {String(currency).length === 1 ? currency : `${currency} `}{po.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '1rem',
                                        background: po.status === 'Open' ? 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))' : po.status === 'Received' ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                        color: po.status === 'Open' ? 'var(--color-primary-600)' : po.status === 'Received' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}>
                                        {po.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default PurchaseOrders;
