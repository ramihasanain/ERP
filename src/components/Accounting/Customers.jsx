import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import translateApiError from '@/utils/translateApiError';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { toast } from 'sonner';
import { Search, Plus, Eye, Edit3, Save, X, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
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
    const { t } = useTranslation(['accounting', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { openDrawer } = useAccounting();

    // Edit Modal State
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const deleteCustomerMutation = useCustomRemove(
        (customerId) => `/api/sales/customers/${customerId}/delete/`,
        [['sales-customers']],
    );
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
        const id = deletingCustomer?.id;
        if (!id) {
            toast.error(t('customers.noSelection'));
            return;
        }
        try {
            await deleteCustomerMutation.mutateAsync(id);
            toast.success(t('customers.deleteSuccess'));
            setDeletingCustomer(null);
        } catch (error) {
            toast.error(translateApiError(error, 'accounting:customers.deleteFailed'));
        }
    };

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(`${basePath}/accounting`)}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('customers.title')}</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{t('customers.subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '240px' }}>
                        <Input
                            placeholder={t('customers.searchPlaceholder')}
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>{t('customers.addCustomer')}</Button>
                </div>
            </div>

            {customersQuery.isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Spinner />
                </div>
            ) : customersQuery.isError ? (
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-error)', fontSize: '0.9rem' }}>{t('customers.loadFailed')}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <Button variant="outline" onClick={() => customersQuery.refetch()}>
                            {t('common:actions.retry')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colName')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colContact')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colEmail')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colPhone')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colCurrency')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colStatus')}</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('customers.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                                        {t('customers.noCustomers')}
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
                                                {cust.isActive ? t('common:status.active') : t('common:status.inactive')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => openEditModal(cust)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                                title={t('customers.editCustomer')}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => openDrawer('Customer', cust.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}
                                                title={t('customers.viewActivity')}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingCustomer(cust)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }}
                                                title={t('customers.deleteCustomer')}
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

const DeleteCustomerModal = ({ customer, isDeleting, onCancel, onConfirm }) => {
    const { t } = useTranslation(['accounting', 'common']);

    return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)'
    }}>
        <Card className="padding-xl" style={{ width: '480px', maxWidth: '95%', borderRadius: '16px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{t('customers.deleteTitle')}</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {t('customers.deleteMessage', { name: customer?.name || t('customers.deleteFallbackName') })}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>{t('common.cancel')}</Button>
                <Button onClick={onConfirm} disabled={isDeleting}>
                    {isDeleting ? t('customers.deleting') : t('common.delete')}
                </Button>
            </div>
        </Card>
    </div>
    );
};

const EditCustomerModal = ({ customer, onClose }) => {
    const { t } = useTranslation(['accounting', 'common']);
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
            toast.success(t('customers.updateSuccess'));
            onClose();
        } catch (error) {
            toast.error(translateApiError(error, 'accounting:customers.updateFailed'));
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('customers.editTitle')}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label={t('customers.companyName')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label={t('customers.contactPerson')}
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        />
                        <Input
                            label={t('customers.phoneNumber')}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <Input
                        label={t('customers.emailAddress')}
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={!isFormChanged || updateCustomerMutation.isPending}
                        >
                            {updateCustomerMutation.isPending ? t('customers.saving') : t('customers.saveChanges')}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Customers;
