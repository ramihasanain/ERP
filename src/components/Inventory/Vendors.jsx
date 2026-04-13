import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Phone, Mail, MapPin, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const allVendors = [
    { id: 'VND-001', name: 'Global Tech Supplies Ltd.', contact: 'Sarah Jenkins', email: 'orders@globaltech.com', phone: '+1 (555) 123-4567', status: 'Active' },
    { id: 'VND-002', name: 'Office Depot Inc.', contact: 'Michael Scott', email: 'support@officedepot.com', phone: '+1 (555) 987-6543', status: 'Active' },
    { id: 'VND-003', name: 'Logistics Pro Solutions', contact: 'Emma Wilson', email: 'billing@logisticspro.net', phone: '+1 (555) 444-5555', status: 'Inactive' },
];

const Vendors = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredVendors = allVendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.contact.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Vendors & Suppliers</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            {filteredVendors.length} partners connected
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>Add Vendor</Button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '300px' }}>
                        <Input
                            placeholder="Search vendors..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Filter size={14} color="var(--color-text-muted)" />
                        <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            {['All', 'Active', 'Inactive'].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: '6px 14px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: statusFilter === s ? 'var(--color-bg-surface)' : 'transparent',
                                        boxShadow: statusFilter === s ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                        color: statusFilter === s ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(searchTerm || statusFilter !== 'All') && (
                        <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Vendor Name</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Contact Person</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Email</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Phone</th>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVendors.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{v.name}</td>
                                <td style={{ padding: '1rem 1rem' }}>{v.contact}</td>
                                <td style={{ padding: '1rem 1rem' }}>{v.email}</td>
                                <td style={{ padding: '1rem 1rem' }}>{v.phone}</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{
                                        color: v.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                        background: v.status === 'Active' ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                    }}>
                                        {v.status}
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

export default Vendors;
