import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData } from '@tanstack/react-query';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomRemove } from '@/hooks/useMutation';
import { Search, Plus, Edit, Trash2, Package, Tag, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import translateApiError from '@/utils/translateApiError';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || '';

const normalizeCategoryOption = (item) => ({
    id: getEntityId(item),
    name: item?.name || '',
});

const toDisplayText = (value, fallback = '') => {
    if (value == null) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        if (typeof value.name === 'string') return value.name;
        if (typeof value.label === 'string') return value.label;
    }
    return fallback;
};

const readErpCurrencyLabel = () => {
    try {
        const raw = localStorage.getItem('erp_currency');
        if (!raw) return 'JOD';

        const trimmed = raw.trim();
        if (!trimmed) return 'JOD';

        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') return parsed || 'JOD';
            if (parsed && typeof parsed === 'object') {
                return (
                    parsed.code ||
                    parsed.currency ||
                    parsed.symbol ||
                    parsed.name ||
                    'JOD'
                );
            }
            return 'JOD';
        }

        return trimmed;
    } catch {
        return 'JOD';
    }
};

const normalizeProduct = (item) => {
    const typeRaw = String(item?.type ?? '').toLowerCase();
    const isStock = typeRaw.includes('stock') || typeRaw === 'inventory_item' || typeRaw === 'inventory';
    const cost = parseFloat(item?.cost_price ?? item?.purchasePrice ?? 0) || 0;
    return {
        id: getEntityId(item),
        name: item?.name || '',
        sku: item?.sku || '',
        categoryLabel: toDisplayText(item?.category, ''),
        type: isStock ? 'stock' : 'service',
        uom: toDisplayText(item?.unit ?? item?.uom, 'pcs'),
        purchasePrice: cost,
        reorderLevel: Number(item?.reorder_level ?? item?.reorderLevel ?? 0),
        totalStock: Number(item?.total_stock ?? item?.totalStock ?? 0),
        isActive: item?.is_active ?? true,
        raw: item,
    };
};

const buildProductsUrl = (categoryId) => {
    const base = '/api/inventory/products/';
    if (!categoryId) return base;
    return `${base}?category=${encodeURIComponent(categoryId)}`;
};

const ItemsList = () => {
    const { t } = useTranslation(['inventory', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth < 1100);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const currencyLabel = useMemo(() => readErpCurrencyLabel(), []);

    const categoriesQuery = useCustomQuery('/api/inventory/categories/', ['inventory-categories'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .map(normalizeCategoryOption)
                .filter((c) => c.id)
                .sort((a, b) => a.name.localeCompare(b.name)),
    });

    const categoryOptions = categoriesQuery.data ?? [];

    const productsUrl = useMemo(() => buildProductsUrl(categoryFilter), [categoryFilter]);

    const productsQuery = useCustomQuery(productsUrl, ['inventory-products', categoryFilter || 'all'], {
        select: (response) => normalizeArrayResponse(response).map(normalizeProduct),
        placeholderData: keepPreviousData,
    });

    const filteredItems = useMemo(() => {
        const list = productsQuery.data ?? [];
        const q = searchTerm.trim().toLowerCase();
        if (!q) return list;
        return list.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.sku.toLowerCase().includes(q) ||
                item.categoryLabel.toLowerCase().includes(q)
        );
    }, [productsQuery.data, searchTerm]);

    const deleteProduct = useCustomRemove((id) => `/api/inventory/products/${id}/delete/`, ['inventory-products']);

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            await deleteProduct.mutateAsync(deleteTarget.id);
            toast.success(t('items.deleteSuccess'));
            setDeleteTarget(null);
        } catch (error) {
            toast.error(translateApiError(error, 'inventory:items.deleteFailed'));
        }
    };

    const isLoading = productsQuery.isPending || categoriesQuery.isPending;
    const hasError = productsQuery.isError || categoriesQuery.isError;
    const shouldUseSingleColumnGrid = filteredItems.length <= 1 || (productsQuery.data ?? []).length <= 1;

    const handleRetry = async () => {
        try {
            await Promise.all([productsQuery.refetch(), categoriesQuery.refetch()]);
            toast.success(t('items.refreshSuccess'));
        } catch {
            toast.error(t('items.refreshFailed'));
        }
    };

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: isNarrowScreen ? 'column' : 'row', justifyContent: 'space-between', alignItems: isNarrowScreen ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{t('items.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('items.subtitle')}</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} size={isNarrowScreen ? 'sm' : undefined} onClick={() => navigate(`${basePath}/inventory/items/new`)} style={{ alignSelf: isNarrowScreen ? 'flex-end' : 'auto' }}>
                    {t('items.addNewItem')}
                </Button>
            </div>

            <Card className="padding-md">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('items.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="font-normal"
                            style={{
                                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="var(--color-text-muted)" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="font-normal cursor-pointer"
                            style={{
                                padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)', minWidth: '180px', color: 'var(--color-text-main)',
                            }}
                        >
                            <option value="">{t('items.allCategories')}</option>
                            {categoryOptions.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name || cat.id}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>{t('items.loadFailed')}</p>
                        <Button variant="outline" type="button" onClick={handleRetry}>
                            {t('common:actions.retry')}
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && (
                <div style={{ display: 'grid', gridTemplateColumns: shouldUseSingleColumnGrid ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredItems.length === 0 ? (
                        <Card className="padding-lg">
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                {(productsQuery.data ?? []).length === 0
                                    ? t('items.noProductsFilters')
                                    : t('items.noProductsSearch')}
                            </p>
                        </Card>
                    ) : (
                        filteredItems.map((item) => (
                            <Card
                                key={item.id}
                                className="padding-md"
                                style={{ borderLeft: `4px solid ${item.type === 'stock' ? 'var(--color-primary-500)' : 'var(--color-secondary-500)'}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>{item.sku}</span>
                                            <span>•</span>
                                            <span>{item.categoryLabel || '—'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button type="button" onClick={() => navigate(`${basePath}/inventory/items/${item.id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title={t('actions.edit', { ns: 'common' })}>
                                            <Edit size={16} />
                                        </button>
                                        <button type="button" onClick={() => setDeleteTarget(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }} title={t('actions.delete', { ns: 'common' })}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t('items.costPrice')}</div>
                                        <div style={{ fontWeight: 600 }}>
                                            {item.purchasePrice.toFixed(2)} {currencyLabel}
                                        </div>
                                    </div>
                                </div>

                                {item.type === 'stock' && (
                                    <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={16} color="var(--color-text-muted)" />
                                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{t('items.quantityOnHand')}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: item.totalStock <= item.reorderLevel ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            {item.totalStock} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>{item.uom}</span>
                                        </span>
                                    </div>
                                )}
                                {item.type === 'service' && (
                                    <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                                        <Tag size={16} />
                                        {t('items.serviceItem')}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={Boolean(deleteTarget)}
                type="danger"
                title={t('items.deleteTitle')}
                message={t('items.deleteMessage', { name: deleteTarget?.name || t('items.deleteFallbackName') })}
                confirmText={deleteProduct.isPending ? t('items.deleting') : t('common:actions.delete')}
                onCancel={() => !deleteProduct.isPending && setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default ItemsList;
