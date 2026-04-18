import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Modal from '@/components/Shared/Modal';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Eye } from 'lucide-react';

const TAX_TYPE_OPTIONS = [
    { value: 'standard', label: 'Standard' },
    { value: 'zero_rated', label: 'Zero Rated' },
    { value: 'exempt', label: 'Exempt' },
    { value: 'reverse_charge', label: 'Reverse Charge' },
];

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || '';

const normalizeTaxRule = (item) => ({
    id: getEntityId(item),
    name: item?.name || '',
    rate_percent: item?.rate_percent ?? '',
    tax_type: item?.tax_type || 'standard',
    sales_gl_account: item?.sales_gl_account || item?.sales_gl_account_id || '',
    purchase_gl_account: item?.purchase_gl_account || item?.purchase_gl_account_id || '',
    is_default: Boolean(item?.is_default),
    raw: item,
});

const normalizeTaxRules = (response) => normalizeArrayResponse(response).map(normalizeTaxRule);

const normalizeAccount = (item) => ({
    id: getEntityId(item),
    name: item?.name || item?.display_name || item?.code || 'Unnamed account',
    code: item?.code || '',
});

const normalizeAccounts = (response) => normalizeArrayResponse(response).map(normalizeAccount);

const TaxSettings = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [selectedTaxRule, setSelectedTaxRule] = useState(null);
    const [selectedTaxRuleId, setSelectedTaxRuleId] = useState(null);

    const taxRulesQuery = useCustomQuery('/api/sales/tax-rules/', ['tax-rules'], {
        select: normalizeTaxRules,
    });

    const taxRuleDetailsQuery = useCustomQuery(
        selectedTaxRuleId ? `/api/sales/tax-rules/${selectedTaxRuleId}/` : '/api/sales/tax-rules/',
        ['tax-rule-detail', selectedTaxRuleId],
        {
            enabled: Boolean(selectedTaxRuleId && (mode === 'view' || mode === 'edit')),
            select: normalizeTaxRule,
        }
    );

    const accountsQuery = useCustomQuery('/accounting/accounts/', ['accounting-accounts'], {
        select: normalizeAccounts,
    });

    const createTaxRule = useCustomPost('/api/sales/tax-rules/create/', ['tax-rules']);
    const updateTaxRule = useCustomPut((data) => `/api/sales/tax-rules/${data.id}/`, ['tax-rules', 'tax-rule-detail']);
    const deleteTaxRule = useCustomRemove((id) => `/api/sales/tax-rules/${id}/`, ['tax-rules', 'tax-rule-detail']);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            rate_percent: '',
            tax_type: 'standard',
            sales_gl_account: '',
            purchase_gl_account: '',
            is_default: false,
        },
    });

    const accounts = useMemo(() => accountsQuery.data || [], [accountsQuery.data]);
    const taxRules = useMemo(() => taxRulesQuery.data || [], [taxRulesQuery.data]);
    const selectedRuleData = taxRuleDetailsQuery.data || selectedTaxRule;

    const actionInProgress = createTaxRule.isPending || updateTaxRule.isPending;

    const accountNameById = useMemo(() => {
        return accounts.reduce((acc, account) => {
            acc[account.id] = account.code ? `${account.code} - ${account.name}` : account.name;
            return acc;
        }, {});
    }, [accounts]);

    useEffect(() => {
        if (!isFormOpen) return;

        if (mode === 'create') {
            reset({
                name: '',
                rate_percent: '',
                tax_type: 'standard',
                sales_gl_account: '',
                purchase_gl_account: '',
                is_default: false,
            });
            return;
        }

        if (selectedRuleData) {
            reset({
                name: selectedRuleData.name || '',
                rate_percent: selectedRuleData.rate_percent ?? '',
                tax_type: selectedRuleData.tax_type || 'standard',
                sales_gl_account: selectedRuleData.sales_gl_account || '',
                purchase_gl_account: selectedRuleData.purchase_gl_account || '',
                is_default: Boolean(selectedRuleData.is_default),
            });
        }
    }, [isFormOpen, mode, selectedRuleData, reset]);

    const openCreateModal = () => {
        setMode('create');
        setSelectedTaxRule(null);
        setSelectedTaxRuleId(null);
        setIsFormOpen(true);
    };

    const openViewModal = (rule) => {
        setMode('view');
        setSelectedTaxRule(rule);
        setSelectedTaxRuleId(rule.id);
        setIsFormOpen(true);
    };

    const openEditModal = (rule) => {
        setMode('edit');
        setSelectedTaxRule(rule);
        setSelectedTaxRuleId(rule.id);
        setIsFormOpen(true);
    };

    const openDeleteModal = (rule) => {
        setSelectedTaxRule(rule);
        setIsDeleteOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        setSelectedTaxRuleId(null);
        setSelectedTaxRule(null);
    };

    const onSubmit = async (values) => {
        const payload = {
            name: values.name.trim(),
            rate_percent: String(values.rate_percent).trim(),
            tax_type: values.tax_type,
            sales_gl_account: values.sales_gl_account || null,
            purchase_gl_account: values.purchase_gl_account || null,
            is_default: Boolean(values.is_default),
        };

        try {
            if (mode === 'edit' && selectedTaxRule?.id) {
                await updateTaxRule.mutateAsync({ id: selectedTaxRule.id, ...payload });
                toast.success('Tax rule updated successfully.');
            } else {
                await createTaxRule.mutateAsync(payload);
                toast.success('Tax rule created successfully.');
            }
            closeFormModal();
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to save tax rule.';
            toast.error(message);
        }
    };

    const confirmDelete = async () => {
        if (!selectedTaxRule?.id) return;
        try {
            await deleteTaxRule.mutateAsync(selectedTaxRule.id);
            toast.success('Tax rule deleted successfully.');
            setIsDeleteOpen(false);
            setSelectedTaxRule(null);
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to delete tax rule.';
            toast.error(message);
        }
    };

    const isLoading = taxRulesQuery.isLoading || accountsQuery.isLoading;
    const hasError = taxRulesQuery.isError || accountsQuery.isError;

    const handleRetry = async () => {
        try {
            await Promise.all([taxRulesQuery.refetch(), accountsQuery.refetch()]);
            toast.success('Tax rules refreshed.');
        } catch {
            toast.error('Refresh failed. Please try again.');
        }
    };

    const isReadOnlyMode = mode === 'view';

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tax Management</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Create and maintain tax rules for sales operations.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={openCreateModal}>Add Tax Rule</Button>
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load tax rules data.</p>
                    <Button variant="outline" onClick={handleRetry}>Retry</Button>
                </div>
            )}

            {!isLoading && !hasError && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '760px' }}>
                        <thead style={{ background: 'var(--color-bg-table-header)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rule Name</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rate (%)</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sales GL / Purchase GL</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Default</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxRules.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No tax rules found.
                                    </td>
                                </tr>
                            ) : (
                                taxRules.map((rule) => (
                                    <tr key={rule.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{rule.name}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{rule.rate_percent}</td>
                                        <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{rule.tax_type.replaceAll('_', ' ')}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {(accountNameById[rule.sales_gl_account] || rule.sales_gl_account || '-')}{' / '}
                                            {(accountNameById[rule.purchase_gl_account] || rule.purchase_gl_account || '-')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{rule.is_default ? 'Yes' : 'No'}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => openViewModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}
                                                aria-label="View tax rule"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}
                                                aria-label="Edit tax rule"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                                aria-label="Delete tax rule"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isFormOpen}
                onClose={closeFormModal}
                title={mode === 'create' ? 'Add Tax Rule' : mode === 'edit' ? 'Edit Tax Rule' : 'Tax Rule Details'}
            >
                {(taxRuleDetailsQuery.isLoading && (mode === 'view' || mode === 'edit')) ? (
                    <Spinner />
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: 'Rule name is required' }}
                            render={({ field }) => (
                                <Input
                                    label="Rule Name"
                                    placeholder="e.g. Standard VAT 20%"
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={isReadOnlyMode}
                                    error={errors.name?.message}
                                />
                            )}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Controller
                                name="rate_percent"
                                control={control}
                                rules={{ required: 'Rate is required' }}
                                render={({ field }) => (
                                    <Input
                                        label="Rate (%)"
                                        type="number"
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isReadOnlyMode}
                                        error={errors.rate_percent?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="tax_type"
                                control={control}
                                render={({ field }) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                                        <select
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isReadOnlyMode}
                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        >
                                            {TAX_TYPE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Controller
                                name="sales_gl_account"
                                control={control}
                                render={({ field }) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sales GL Account</label>
                                        <select
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            disabled={isReadOnlyMode}
                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        >
                                            <option value="">Select account</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code ? `${account.code} - ${account.name}` : account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />

                            <Controller
                                name="purchase_gl_account"
                                control={control}
                                render={({ field }) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Purchase GL Account</label>
                                        <select
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            disabled={isReadOnlyMode}
                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        >
                                            <option value="">Select account</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code ? `${account.code} - ${account.name}` : account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                        </div>

                        <Controller
                            name="is_default"
                            control={control}
                            render={({ field }) => (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(field.value)}
                                        onChange={(event) => field.onChange(event.target.checked)}
                                        disabled={isReadOnlyMode}
                                    />
                                    Set as default tax rule
                                </label>
                            )}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <Button type="button" variant="ghost" onClick={closeFormModal}>
                                {isReadOnlyMode ? 'Close' : 'Cancel'}
                            </Button>
                            {!isReadOnlyMode && (
                                <Button type="submit" disabled={actionInProgress}>
                                    {actionInProgress ? 'Saving...' : mode === 'edit' ? 'Update Rule' : 'Create Rule'}
                                </Button>
                            )}
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Tax Rule"
                message={`Are you sure you want to delete "${selectedTaxRule?.name || 'this tax rule'}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteOpen(false);
                    setSelectedTaxRule(null);
                }}
                type="danger"
                confirmText={deleteTaxRule.isPending ? 'Deleting...' : 'Delete'}
            />
        </Card>
    );
};

export default TaxSettings;
