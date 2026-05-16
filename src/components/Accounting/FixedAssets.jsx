import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import translateApiError from '@/utils/translateApiError';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import IconPicker from '@/components/Shared/IconPicker';
import { Plus, X, Monitor, Wrench, Percent, DollarSign, Eye, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const ASSET_ICON_KEYS = [
    'building', 'map', 'armchair', 'printer', 'monitor', 'truck', 'wrench', 'hammer',
    'smartphone', 'briefcase', 'archive', 'box', 'camera', 'cpu', 'hard_drive',
    'headphones', 'laptop', 'server', 'tablet', 'tv', 'watch'
];

const ICON_PICKER_NAMES = [
    'Building', 'Map', 'Armchair', 'Printer', 'Monitor', 'Truck', 'Wrench', 'Hammer',
    'Smartphone', 'Briefcase', 'Archive', 'Box', 'Camera', 'Cpu', 'HardDrive',
    'Headphones', 'Laptop', 'Server', 'Tablet', 'Tv', 'Watch'
];

const iconKeyByPickerName = ICON_PICKER_NAMES.reduce((acc, iconName, index) => {
    acc[iconName] = ASSET_ICON_KEYS[index];
    return acc;
}, {});

const pickerNameByIconKey = ASSET_ICON_KEYS.reduce((acc, iconKey, index) => {
    acc[iconKey] = ICON_PICKER_NAMES[index];
    return acc;
}, {});

const toPickerIconName = (icon) => {
    if (!icon) return 'Box';
    if (pickerNameByIconKey[icon]) return pickerNameByIconKey[icon];
    if (ICON_PICKER_NAMES.includes(icon)) return icon;

    return String(icon)
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
};

const DynamicIcon = ({ name, size = 24 }) => {
    const normalizedName = toPickerIconName(name);
    const Icon = LucideIcons[name] || LucideIcons[normalizedName] || Monitor;
    return <Icon size={size} />;
};

const toNumber = (value) => {
    const numberValue = Number(value ?? 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
};

const getSourceAccountId = (sourceAccount) => {
    if (!sourceAccount) return '';
    if (typeof sourceAccount === 'object') {
        return sourceAccount.account_id || sourceAccount.id || '';
    }
    return sourceAccount;
};

const getAssetFormValues = (asset) => ({
    name: asset?.name || '',
    description: asset?.description || '',
    icon: asset?.icon || 'box',
    depreciationRate: asset?.depreciation_rate ?? asset?.depreciationRate ?? '',
    purchaseCost: asset?.purchase_cost ?? asset?.purchaseCost ?? '',
    purchaseDate: asset?.purchase_date || asset?.purchaseDate || new Date().toISOString().split('T')[0],
    sourceAccountId: getSourceAccountId(asset?.source_account ?? asset?.sourceAccountId),
    comment: asset?.comment || ''
});

const getDefaultAssetForm = () => ({
    name: '',
    description: '',
    icon: 'box',
    depreciationRate: '',
    purchaseCost: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    sourceAccountId: '',
    comment: ''
});

const normalizeAssetForm = (form) => ({
    name: String(form.name || '').trim(),
    description: String(form.description || '').trim(),
    icon: String(form.icon || '').trim(),
    depreciationRate: String(form.depreciationRate || '').trim(),
    purchaseCost: String(form.purchaseCost || '').trim(),
    purchaseDate: String(form.purchaseDate || '').trim(),
    sourceAccountId: String(form.sourceAccountId || '').trim(),
    comment: String(form.comment || '').trim()
});

const buildAssetCreatePayload = (form) => {
    const normalizedForm = normalizeAssetForm(form);

    return {
        name: normalizedForm.name,
        description: normalizedForm.description,
        depreciation_rate: normalizedForm.depreciationRate,
        icon: normalizedForm.icon,
        purchase_cost: normalizedForm.purchaseCost,
        purchase_date: normalizedForm.purchaseDate,
        ...(normalizedForm.sourceAccountId ? { source_account: normalizedForm.sourceAccountId } : {}),
        ...(normalizedForm.comment ? { comment: normalizedForm.comment } : {}),
        is_active: true
    };
};

const buildAssetUpdatePayload = (form) => {
    const normalizedForm = normalizeAssetForm(form);

    return {
        name: normalizedForm.name,
        description: normalizedForm.description,
        depreciation_rate: normalizedForm.depreciationRate,
        icon: normalizedForm.icon,
        purchase_cost: normalizedForm.purchaseCost,
        purchase_date: normalizedForm.purchaseDate,
        source_account: normalizedForm.sourceAccountId || null,
        is_active: true
    };
};

const getErrorMessage = (error, fallbackMessage) => (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallbackMessage
);

const selectListData = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response)) return response;
    return [];
};

const FixedAssets = () => {
    const { t } = useTranslation(['accounting', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { entries, openDrawer } = useAccounting();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [deletingAsset, setDeletingAsset] = useState(null);

    // Asset State
    const [assetForm, setAssetForm] = useState(getDefaultAssetForm);
    const [originalAssetForm, setOriginalAssetForm] = useState(getDefaultAssetForm);

    const fixedAssetsQuery = useCustomQuery('/api/assets/', ['accounting-fixed-assets'], {
        select: selectListData,
    });

    const assetDetailsQuery = useCustomQuery(
        editingAssetId ? `/api/assets/${editingAssetId}/` : '/api/assets/',
        ['accounting-fixed-asset', editingAssetId],
        {
            enabled: Boolean(editingAssetId) && isModalOpen,
            select: (response) => response?.data && !Array.isArray(response.data) ? response.data : response,
        }
    );

    const bankAccountsQuery = useCustomQuery(
        'https://rockstar.erp-api.site/accounting/bank-accounts/',
        ['accounting-bank-accounts'],
        {
            enabled: isModalOpen,
            select: selectListData,
        }
    );

    const updateAssetMutation = useCustomPut(
        editingAssetId ? `/api/assets/${editingAssetId}/` : '/api/assets/',
        [['accounting-fixed-assets']]
    );
    const createAssetMutation = useCustomPost('/api/assets/', [['accounting-fixed-assets']]);
    const deleteAssetMutation = useCustomRemove(
        (id) => `/api/assets/${id}/`,
        [['accounting-fixed-assets']]
    );

    const assetAccounts = (fixedAssetsQuery.data ?? []).map((asset) => ({
        id: asset.account_id || asset.id,
        assetId: asset.id,
        name: asset.name || t('fixedAssets.unnamedAsset'),
        description: asset.description || '',
        code: asset.account_code || '',
        icon: asset.icon || 'box',
        depreciationRate: asset.depreciation_rate,
        originalCost: toNumber(asset.original_cost ?? asset.purchase_cost),
        netBookValue: toNumber(asset.net_book_value),
        purchaseCost: asset.purchase_cost,
        purchaseDate: asset.purchase_date,
        sourceAccountId: getSourceAccountId(asset.source_account),
        isActive: Boolean(asset.is_active),
    }));

    const sourceAccounts = (bankAccountsQuery.data ?? [])
        .filter(account => account.is_active !== false)
        .map(account => ({
            id: account.account_id || account.id,
            name: account.name || account.account_name || t('fixedAssets.unnamedAccount'),
            code: account.account_code || '',
            type: 'Asset',
        }));

    useEffect(() => {
        if (!isModalOpen || !editingId || !assetDetailsQuery.data) return;

        let isCancelled = false;
        const nextAssetForm = getAssetFormValues(assetDetailsQuery.data);

        queueMicrotask(() => {
            if (!isCancelled) {
                setAssetForm(nextAssetForm);
                setOriginalAssetForm(nextAssetForm);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [assetDetailsQuery.data, editingId, isModalOpen]);

    const closeAssetModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setEditingAssetId(null);
        setOriginalAssetForm(getDefaultAssetForm());
    };

    const openCreateModal = () => {
        const defaultForm = getDefaultAssetForm();

        setEditingId(null);
        setEditingAssetId(null);
        setAssetForm(defaultForm);
        setOriginalAssetForm(defaultForm);
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        setEditingId(account.id);
        setEditingAssetId(account.assetId || account.id);
        const depRate = account.depreciationRate || '';

        // Find associated Journal Entry for Cost/Date
        // Look for entry where this asset was debited and ref is associated
        const entry = entries.find(e =>
            (e.reference === 'ASSET-PURCH' || e.reference === 'ASSET-OP-BAL') &&
            e.lines.some(l => l.account === account.id && Number(l.debit) > 0)
        );

        let cost = account.purchaseCost || '';
        let date = account.purchaseDate || '';
        let source = account.sourceAccountId || '';

        if (entry) {
            date = entry.date;
            const assetLine = entry.lines.find(l => l.account === account.id && Number(l.debit) > 0);
            if (assetLine) cost = assetLine.debit;

            const sourceLine = entry.lines.find(l => l.credit > 0); // Assuming simple 2-line entry
            if (sourceLine) source = sourceLine.account;
        }

        const fallbackAssetForm = {
            name: account.name,
            description: account.description || '',
            icon: account.icon || 'box',
            depreciationRate: depRate,
            purchaseCost: cost,
            purchaseDate: date || new Date().toISOString().split('T')[0],
            sourceAccountId: source
        };

        setAssetForm(fallbackAssetForm);
        setOriginalAssetForm(fallbackAssetForm);
        setIsModalOpen(true);
    };

    const normalizedAssetForm = normalizeAssetForm(assetForm);
    const normalizedOriginalAssetForm = normalizeAssetForm(originalAssetForm);
    const isAssetFormValid = Boolean(
        normalizedAssetForm.name &&
        normalizedAssetForm.description &&
        normalizedAssetForm.icon &&
        normalizedAssetForm.depreciationRate &&
        normalizedAssetForm.purchaseCost &&
        normalizedAssetForm.purchaseDate
    );
    const hasAssetFormChanges = JSON.stringify(normalizedAssetForm) !== JSON.stringify(normalizedOriginalAssetForm);
    const isSubmitDisabled = updateAssetMutation.isPending ||
        createAssetMutation.isPending ||
        (editingId && (assetDetailsQuery.isPending || !hasAssetFormChanges)) ||
        !isAssetFormValid;

    const handleSaveAsset = async () => {
        if (isSubmitDisabled) return;

        if (editingId) {
            try {
                await updateAssetMutation.mutateAsync(buildAssetUpdatePayload(assetForm));
                toast.success(t('fixedAssets.updateSuccess'));
                closeAssetModal();
            } catch (error) {
                toast.error(getErrorMessage(error, t('fixedAssets.updateFailed')));
            }

            return;
        } else {
            try {
                await createAssetMutation.mutateAsync(buildAssetCreatePayload(assetForm));
                toast.success(t('fixedAssets.createSuccess'));
                closeAssetModal();
            } catch (error) {
                toast.error(getErrorMessage(error, t('fixedAssets.createFailed')));
            }

            return;
        }
    };

    const handleRequestDelete = (account) => {
        setDeletingAsset({
            id: account.assetId || account.id,
            name: account.name || t('fixedAssets.deleteFallbackName'),
        });
    };

    const handleConfirmDelete = async () => {
        const assetId = deletingAsset?.id;
        if (!assetId) {
            toast.error(t('fixedAssets.noSelection'));
            return;
        }

        try {
            await deleteAssetMutation.mutateAsync(assetId);
            toast.success(t('fixedAssets.deleteSuccess'));
            setDeletingAsset(null);
        } catch (error) {
            toast.error(getErrorMessage(error, t('fixedAssets.deleteFailed')));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(`${basePath}/accounting`)}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('fixedAssets.title')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{t('fixedAssets.subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }} className="shrink-0">
                    <Button icon={<Plus size={18} />} onClick={openCreateModal} className="cursor-pointer">{t('fixedAssets.newAssetCategory')}</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem', minWidth: 0 }}>
                {fixedAssetsQuery.isPending && (
                    <Card className="padding-lg" style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{t('fixedAssets.loading')}</p>
                    </Card>
                )}

                {fixedAssetsQuery.isError && (
                    <Card className="padding-lg" style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: 'var(--color-danger-600)' }}>{t('fixedAssets.loadFailed')}</p>
                    </Card>
                )}

                {assetAccounts.map(account => {
                    const originalCost = account.originalCost;
                    const netBookValue = account.netBookValue;

                    return (
                        <Card key={account.assetId || account.id} className="padding-lg" style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 0, flex: '1 1 220px' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                                        borderRadius: '0.75rem',
                                        color: 'var(--color-primary-600)',
                                        flexShrink: 0
                                    }}>
                                        <DynamicIcon name={account.icon || 'Box'} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{account.name}</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{account.code}</p>
                                        {account.depreciationRate && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                fontSize: '0.75rem',
                                                background: 'var(--color-bg-subtle)',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '1rem',
                                                marginTop: '0.5rem',
                                                color: 'var(--color-text-secondary)'
                                            }}>
                                                <Percent size={12} />
                                                <span>{t('fixedAssets.deprRate', { rate: account.depreciationRate })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flex: '0 0 auto' }}>
                                    <button
                                        onClick={() => openDrawer('Asset', account.assetId || account.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--color-primary-600)', padding: '0.25rem'
                                        }}
                                        title={t('fixedAssets.viewActivity')}
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(account)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--color-text-muted)', padding: '0.25rem'
                                        }}
                                        title={t('fixedAssets.editCategory')}
                                    >
                                        <Wrench size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleRequestDelete(account)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--color-danger-600)', padding: '0.25rem'
                                        }}
                                        title={t('fixedAssets.deleteAsset')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{t('fixedAssets.originalCost')}</span>
                                <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{originalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t('fixedAssets.currencyJod')}</span>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600 }}>{t('fixedAssets.netBookValue')}</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary-600)', overflowWrap: 'anywhere' }}>
                                    {netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t('fixedAssets.currencyJod')}
                                </span>
                            </div>
                        </Card>
                    );
                })}

                {!fixedAssetsQuery.isPending && !fixedAssetsQuery.isError && assetAccounts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        {t('fixedAssets.emptyState')}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{editingId ? t('fixedAssets.editAssetCategory') : t('fixedAssets.registerNewAsset')}</h3>
                            <button onClick={closeAssetModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editingId && assetDetailsQuery.isPending && (
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {t('fixedAssets.loadingDetails')}
                                </p>
                            )}

                            <Input
                                label={t('fixedAssets.assetName')}
                                placeholder={t('fixedAssets.assetNamePlaceholder')}
                                value={assetForm.name}
                                onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                            />

                            <Input
                                label={t('fixedAssets.description')}
                                placeholder={t('fixedAssets.descriptionPlaceholder')}
                                value={assetForm.description}
                                onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
                            />

                            <Input
                                label={t('fixedAssets.commentOptional')}
                                placeholder={t('fixedAssets.commentPlaceholder')}
                                value={assetForm.comment}
                                onChange={e => setAssetForm({ ...assetForm, comment: e.target.value })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <Input
                                    label={t('fixedAssets.deprRateLabel')}
                                    type="number"
                                    placeholder="20"
                                    value={assetForm.depreciationRate}
                                    onChange={e => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
                                />
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{t('fixedAssets.selectIcon')}</label>
                                    <IconPicker
                                        selectedIcon={toPickerIconName(assetForm.icon)}
                                        onSelect={(icon) => setAssetForm({ ...assetForm, icon: iconKeyByPickerName[icon] || icon })}
                                    />
                                </div>
                            </div>

                            <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={16} /> {t('fixedAssets.purchaseDetails')}
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Input
                                            label={t('fixedAssets.purchaseCost')}
                                            type="number"
                                            placeholder="0.00"
                                            value={assetForm.purchaseCost}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                                        />
                                        <Input
                                            label={t('fixedAssets.purchaseDate')}
                                            type="date"
                                            value={assetForm.purchaseDate}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{t('fixedAssets.paidFrom')}</label>
                                        <select
                                            style={{
                                                width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)', fontSize: '0.9rem',
                                                background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                                                cursor: 'pointer',
                                            }}
                                            value={assetForm.sourceAccountId}
                                            onChange={e => setAssetForm({ ...assetForm, sourceAccountId: e.target.value })}
                                        >
                                            <option value="">{t('fixedAssets.openingBalanceOption')}</option>

                                            <optgroup label={t('fixedAssets.bankCashGroup')}>
                                                {bankAccountsQuery.isPending && (
                                                    <option disabled value="">{t('fixedAssets.loadingBankAccounts')}</option>
                                                )}
                                                {bankAccountsQuery.isError && (
                                                    <option disabled value="">{t('fixedAssets.loadBankAccountsFailed')}</option>
                                                )}
                                                {!bankAccountsQuery.isPending && !bankAccountsQuery.isError && sourceAccounts.length === 0 && (
                                                    <option disabled value="">{t('fixedAssets.noBankAccounts')}</option>
                                                )}
                                                {sourceAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code ? `${acc.code} - ${acc.name}` : acc.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                            {t('fixedAssets.sourceAccountHint')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={closeAssetModal}>{t('common.cancel')}</Button>
                                <Button
                                    onClick={handleSaveAsset}
                                    disabled={isSubmitDisabled}
                                    isLoading={updateAssetMutation.isPending || createAssetMutation.isPending}
                                >
                                    {editingId ? t('fixedAssets.saveChanges') : t('fixedAssets.registerAsset')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deletingAsset && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    padding: '1rem',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '480px',
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <AlertTriangle size={20} color="var(--color-danger-600)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('fixedAssets.deleteTitle')}</h3>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {t('fixedAssets.deleteMessage', { name: deletingAsset.name })}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <Button
                                variant="outline"
                                onClick={() => setDeletingAsset(null)}
                                disabled={deleteAssetMutation.isPending}
                                className="cursor-pointer"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirmDelete}
                                isLoading={deleteAssetMutation.isPending}
                                disabled={deleteAssetMutation.isPending}
                                className="cursor-pointer"
                            >
                                {t('common.delete')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedAssets;
