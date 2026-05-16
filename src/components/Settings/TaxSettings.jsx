import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import translateApiError from '@/utils/translateApiError';
import { Plus, Edit3, Trash2, Eye } from 'lucide-react';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.tax_rules)) return response.data.tax_rules;
    if (Array.isArray(response?.tax_rules)) return response.tax_rules;
    if (Array.isArray(response?.items)) return response.items;
    return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || '';

const unwrapTaxRulePayload = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;
    const nested = payload.data;
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return payload;
    if (Array.isArray(nested.tax_rules)) return payload;
    if (nested.id || nested.uuid) return nested;
    return payload;
};

const normalizeTaxRule = (item) => {
    const source = unwrapTaxRulePayload(item);
    return {
        id: getEntityId(source),
        name: source?.name || '',
        rate_percent: source?.rate_percent ?? '',
        tax_type: source?.tax_type || 'standard',
        is_default: Boolean(source?.is_default),
        raw: source,
    };
};

const normalizeTaxRulesList = (response) => ({
    taxRules: normalizeArrayResponse(response).map((row) => normalizeTaxRule(row)),
    country: response?.data?.country || '',
});

const TaxSettings = () => {
    const { t } = useTranslation(['settings', 'common']);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const taxTypeOptions = useMemo(
        () => [
            { value: 'standard', label: t('tax.types.standard') },
            { value: 'reduced', label: t('tax.types.reduced') },
            { value: 'zero', label: t('tax.types.zero') },
            { value: 'exempt', label: t('tax.types.exempt') },
        ],
        [t],
    );
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [selectedTaxRule, setSelectedTaxRule] = useState(null);
    const [selectedTaxRuleId, setSelectedTaxRuleId] = useState(null);

    const taxRulesQuery = useCustomQuery('/api/sales/tax-rules/', ['tax-rules'], {
        select: normalizeTaxRulesList,
    });

    const taxRuleDetailsQuery = useCustomQuery(
        selectedTaxRuleId ? `/api/sales/tax-rules/${selectedTaxRuleId}/` : '/api/sales/tax-rules/',
        ['tax-rule-detail', selectedTaxRuleId],
        {
            enabled: Boolean(selectedTaxRuleId && (mode === 'view' || mode === 'edit')),
            select: normalizeTaxRule,
        }
    );

    const createTaxRule = useCustomPost('/api/sales/tax-rules/create/', ['tax-rules']);
    const updateTaxRule = useCustomPut((data) => `/api/sales/tax-rules/${data.id}/`, ['tax-rules', 'tax-rule-detail']);
    const deleteTaxRule = useCustomRemove((id) => `/api/sales/tax-rules/${id}/delete/`, ['tax-rules', 'tax-rule-detail']);

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
            is_default: false,
        },
    });

    const taxRules = useMemo(() => taxRulesQuery.data?.taxRules || [], [taxRulesQuery.data]);
    const taxRulesCountry = taxRulesQuery.data?.country || '';
    const selectedRuleData = taxRuleDetailsQuery.data || selectedTaxRule;

    const actionInProgress = createTaxRule.isPending || updateTaxRule.isPending;

    useEffect(() => {
        if (!isFormOpen) return;

        if (mode === 'create') {
            reset({
                name: '',
                rate_percent: '',
                tax_type: 'standard',
                is_default: false,
            });
            return;
        }

        if (selectedRuleData) {
            reset({
                name: selectedRuleData.name || '',
                rate_percent: selectedRuleData.rate_percent ?? '',
                tax_type: selectedRuleData.tax_type || 'standard',
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
            is_default: Boolean(values.is_default),
        };

        try {
            if (mode === 'edit' && selectedTaxRule?.id) {
                await updateTaxRule.mutateAsync({ id: selectedTaxRule.id, ...payload });
                toast.success(t('tax.toast.updated'));
            } else {
                await createTaxRule.mutateAsync(payload);
                toast.success(t('tax.toast.created'));
            }
            closeFormModal();
        } catch (error) {
            toast.error(translateApiError(error, 'settings:tax.toast.saveFailed'));
        }
    };

    const confirmDelete = async () => {
        if (!selectedTaxRule?.id) return;
        try {
            await deleteTaxRule.mutateAsync(selectedTaxRule.id);
            toast.success(t('tax.toast.deleted'));
            setIsDeleteOpen(false);
            setSelectedTaxRule(null);
        } catch (error) {
            toast.error(translateApiError(error, 'settings:tax.toast.deleteFailed'));
        }
    };

    const isLoading = taxRulesQuery.isLoading;
    const hasError = taxRulesQuery.isError;

    const handleRetry = async () => {
        try {
            await taxRulesQuery.refetch();
            toast.success(t('tax.refreshSuccess'));
        } catch {
            toast.error(t('tax.refreshFailed'));
        }
    };

    const isReadOnlyMode = mode === 'view';

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('tax.title')}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                        {taxRulesCountry
                            ? t('tax.subtitleWithCountry', { country: taxRulesCountry })
                            : t('tax.subtitle')}
                    </p>
                </div>
                <Button icon={<Plus size={16} />} onClick={openCreateModal}>{t('tax.addRule')}</Button>
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, color: 'var(--color-error)' }}>{t('tax.loadFailed')}</p>
                    <Button variant="outline" onClick={handleRetry}>{t('common:actions.retry')}</Button>
                </div>
            )}

            {!isLoading && !hasError && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '560px' }}>
                        <thead style={{ background: 'var(--color-bg-table-header)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('tax.table.ruleName')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('tax.table.rate')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('tax.table.type')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('tax.table.default')}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('tax.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxRules.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        {t('tax.table.empty')}
                                    </td>
                                </tr>
                            ) : (
                                taxRules.map((rule) => (
                                    <tr key={rule.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{rule.name}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{rule.rate_percent}</td>
                                        <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>
                                            {t(`tax.types.${rule.tax_type}`, { defaultValue: rule.tax_type.replaceAll('_', ' ') })}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{rule.is_default ? t('common:actions.yes') : t('common:actions.no')}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => openViewModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}
                                                aria-label={t('tax.aria.view')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}
                                                aria-label={t('tax.aria.edit')}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(rule)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                                aria-label={t('tax.aria.delete')}
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
                title={
                    mode === 'create'
                        ? t('tax.modal.add')
                        : mode === 'edit'
                          ? t('tax.modal.edit')
                          : t('tax.modal.view')
                }
            >
                {(taxRuleDetailsQuery.isLoading && (mode === 'view' || mode === 'edit')) ? (
                    <Spinner />
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: t('tax.form.ruleNameRequired') }}
                            render={({ field }) => (
                                <Input
                                    label={t('tax.form.ruleName')}
                                    placeholder={t('tax.form.ruleNamePlaceholder')}
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
                                rules={{ required: t('tax.form.rateRequired') }}
                                render={({ field }) => (
                                    <Input
                                        label={t('tax.form.rate')}
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
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('tax.form.type')}</label>
                                        <select
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isReadOnlyMode}
                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        >
                                            {taxTypeOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
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
                                    {t('tax.form.isDefault')}
                                </label>
                            )}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <Button type="button" variant="ghost" onClick={closeFormModal}>
                                {isReadOnlyMode ? t('common:actions.close') : t('common:actions.cancel')}
                            </Button>
                            {!isReadOnlyMode && (
                                <Button type="submit" disabled={actionInProgress}>
                                    {actionInProgress
                                        ? t('tax.form.saving')
                                        : mode === 'edit'
                                          ? t('tax.form.updateRule')
                                          : t('tax.form.createRule')}
                                </Button>
                            )}
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title={t('tax.delete.title')}
                message={
                    selectedTaxRule?.name
                        ? t('tax.delete.message', { name: selectedTaxRule.name })
                        : t('tax.delete.messageFallback')
                }
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteOpen(false);
                    setSelectedTaxRule(null);
                }}
                type="danger"
                confirmText={
                    deleteTaxRule.isPending ? t('tax.delete.deleting') : t('common:actions.delete')
                }
            />
        </Card>
    );
};

export default TaxSettings;
