import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Eye, Edit3, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';

const Customers = () => {
    const navigate = useNavigate();
    const { customers, openDrawer, updateCustomer } = useAccounting();

    // Edit Modal State
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsEditModalOpen(true);
    };

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Customers & Clients</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your client base.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '240px' }}><Input placeholder="Search customers..." startIcon={<Search size={16} />} style={{ fontSize: '0.875rem' }} /></div>
                    <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>Add Customer</Button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Customer Name</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Contact Person</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Phone</th>
                            <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Balance</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(cust => (
                            <tr key={cust.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{cust.name}</td>
                                <td style={{ padding: '1rem 1rem' }}>{cust.contact}</td>
                                <td style={{ padding: '1rem 1rem' }}>{cust.email}</td>
                                <td style={{ padding: '1rem 1rem' }}>{cust.phone}</td>
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{cust.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD</td>
                                <td style={{ padding: '1rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openEditModal(cust)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                        title="Edit Customer"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => openDrawer('Customer', cust.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}
                                        title="View Activity"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Customer Modal */}
            {isEditModalOpen && editingCustomer && (
                <EditCustomerModal
                    customer={editingCustomer}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={updateCustomer}
                />
            )}
        </Card>
    );
};

const EditCustomerModal = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: customer.name,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        balance: customer.balance
    });

    const handleSubmit = () => {
        onSave(customer.id, {
            ...formData,
            balance: Number(formData.balance)
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <Card className="padding-xl" style={{ width: '500px', maxWidth: '95%', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Customer</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Company / Customer Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Contact Person"
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        />
                        <Input
                            label="Phone Number"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

                    <Input
                        label="Current Balance (JOD)"
                        type="number"
                        value={formData.balance}
                        onChange={e => setFormData({ ...formData, balance: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit}>Save Changes</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Customers;
