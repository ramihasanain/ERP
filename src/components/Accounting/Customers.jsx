import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { toast } from 'sonner';
import { Search, Plus, Eye, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';

const normalizeCustomersResponse = (response) => {
    const payload = response?.data ?? response;
    const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];

    return rows.map((item) => ({
        id: item?.id || '',
        name: item?.name || '—',
        contact: item?.contact_person || '—',
        email: item?.email || '—',
        phone: item?.phone || '—',
        currencyCode: item?.currency_code || '—',
        isActive: Boolean(item?.is_active),
    }));
};

const Customers = () => {
    const navigate = useNavigate();
    const { openDrawer } = useAccounting();

    // Edit Modal State
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const deleteCustomerMutation = useCustomRemove('/api/sales/customers/a0791e6f-455e-4e66-9627-36faf9541df5/delete/', [['sales-customers']]);
    const normalizedSearchTerm = searchTerm.trim();
    const customersEndpoint = normalizedSearchTerm
        ? `/api/sales/customers/?search=${encodeURIComponent(normalizedSearchTerm)}`
        : '/api/sales/customers/';
    const customersQuery = useCustomQuery(customersEndpoint, ['sales-customers', normalizedSearchTerm], {
        select: normalizeCustomersResponse,
    });
    const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsEditModalOpen(true);
    };

    const handleDeleteCustomer = async () => {
        try {
            await deleteCustomerMutation.mutateAsync();
            toast.success('Customer deleted successfully.');
            setDeletingCustomer(null);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete customer.');
        }
    };

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Customers & Clients</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your client base.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '240px' }}>
                        <Input
                            placeholder="Search customers..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>Add Customer</Button>
                </div>
            </div>

            {customersQuery.isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Spinner />
                </div>
            ) : customersQuery.isError ? (
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-error)', fontSize: '0.9rem' }}>Could not load customers.</p>
                    <div style={{ marginTop: '1rem' }}>
                        <Button variant="outline" onClick={() => customersQuery.refetch()}>
                            Retry
                        </Button>
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Customer Name</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Contact Person</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Phone</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Currency</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((cust) => (
                                    <tr key={cust.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{cust.name}</td>
                                        <td style={{ padding: '1rem 1rem' }}>{cust.contact}</td>
                                        <td style={{ padding: '1rem 1rem' }}>{cust.email}</td>
                                        <td style={{ padding: '1rem 1rem' }}>{cust.phone}</td>
                                        <td style={{ padding: '1rem 1rem', fontWeight: 600 }}>{cust.currencyCode}</td>
                                        <td style={{ padding: '1rem 1rem' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    background: cust.isActive ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                                    color: cust.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                                }}
                                            >
                                                {cust.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
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
                                            <button
                                                onClick={() => setDeletingCustomer(cust)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }}
                                                title="Delete Customer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Customer Modal */}
            {isEditModalOpen && editingCustomer && (
                <EditCustomerModal
                    customer={editingCustomer}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

            {deletingCustomer && (
                <DeleteCustomerModal
                    customer={deletingCustomer}
                    isDeleting={deleteCustomerMutation.isPending}
                    onCancel={() => {
                        if (!deleteCustomerMutation.isPending) {
                            setDeletingCustomer(null);
                        }
                    }}
                    onConfirm={handleDeleteCustomer}
                />
            )}
        </Card>
    );
};

const DeleteCustomerModal = ({ customer, isDeleting, onCancel, onConfirm }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)'
    }}>
        <Card className="padding-xl" style={{ width: '480px', maxWidth: '95%', borderRadius: '16px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Delete Customer</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{customer?.name || 'this customer'}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>Cancel</Button>
                <Button onClick={onConfirm} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </Card>
    </div>
);

const EditCustomerModal = ({ customer, onClose }) => {
    const updateCustomerMutation = useCustomPut('/api/sales/customers/a0791e6f-455e-4e66-9627-36faf9541df5/', [['sales-customers']]);
    const initialFormData = useMemo(() => ({
        name: customer.name || '',
        contact: customer.contact || '',
        email: customer.email || '',
        phone: customer.phone || '',
    }), [customer]);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const isFormChanged = useMemo(() => (
        formData.name.trim() !== initialFormData.name.trim()
        || formData.contact.trim() !== initialFormData.contact.trim()
        || formData.email.trim() !== initialFormData.email.trim()
        || formData.phone.trim() !== initialFormData.phone.trim()
    ), [formData, initialFormData]);

    const handleSubmit = async () => {
        if (!isFormChanged) return;

        const payload = {
            name: formData.name.trim(),
            contact_person: formData.contact.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            billing_address: 'Street, City, Country',
            is_active: true,
        };

        try {
            await updateCustomerMutation.mutateAsync(payload);
            toast.success('Customer updated successfully.');
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update customer.');
        }
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={!isFormChanged || updateCustomerMutation.isPending}
                        >
                            {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Customers;
