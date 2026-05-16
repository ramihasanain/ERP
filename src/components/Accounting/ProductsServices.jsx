import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import translateApiError from '@/utils/translateApiError';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch, useCustomPost, useCustomRemove } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import SearchableSelectBackend from '@/core/SearchableSelectBackend';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Search, ArrowLeft, Package, Briefcase, Save, X } from 'lucide-react';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const normalizePagedResponse = (response) => {
    const rawData = response?.data;
    if (Array.isArray(rawData)) {
        return {
            items: rawData,
            hasMore: Boolean(response?.next),
        };
    }
    if (Array.isArray(rawData?.tax_rules)) {
        return {
            items: rawData.tax_rules,
            hasMore: Boolean(response?.next),
        };
    }
    return {
        items: [],
        hasMore: false,
    };
};

const normalizeFormSnapshot = (formData) => JSON.stringify({
    name: String(formData.name || '').trim(),
    type: String(formData.type || '').trim(),
    price: String(formData.price || '').trim(),
    unit: String(formData.unit || '').trim(),
    taxRuleId: String(formData.taxRuleId || '').trim(),
    description: String(formData.description || '').trim(),
    revenueAccount: String(formData.revenueAccount || '').trim(),
});

const ProductsServices = () => {
    const { t } = useTranslation(['accounting', 'common']);
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { updateProductOrService, deleteProductOrService, taxRules } = useAccounting();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [itemNameSearch, setItemNameSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingApiItemId, setEditingApiItemId] = useState('');
    const [initialEditSnapshot, setInitialEditSnapshot] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState({
        name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: ''
    });
    const [selectedProductId, setSelectedProductId] = useState('');
    const [taxSearchTerm, setTaxSearchTerm] = useState('');
    const [revenueSearchTerm, setRevenueSearchTerm] = useState('');
    const [unitsPage, setUnitsPage] = useState(1);
    const [taxPage, setTaxPage] = useState(1);
    const [revenuePage, setRevenuePage] = useState(1);
    const [unitOptions, setUnitOptions] = useState([]);
    const [taxOptions, setTaxOptions] = useState([]);
    const [revenueAccountOptions, setRevenueAccountOptions] = useState([]);
    const [unitsHasMore, setUnitsHasMore] = useState(false);
    const [taxHasMore, setTaxHasMore] = useState(false);
    const [revenueHasMore, setRevenueHasMore] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const productsQueryString = useMemo(() => {
        const params = new URLSearchParams();

        const normalizedSearch = debouncedSearchTerm.trim();
        if (normalizedSearch) {
            params.set('q', normalizedSearch);
        }

        if (filterType !== 'All') {
            params.set('item_type', filterType.toLowerCase());
        }

        return params.toString();
    }, [debouncedSearchTerm, filterType]);

    const {
        data: productsResponse,
        isLoading: isProductsLoading,
        isError: isProductsError,
    } = useCustomQuery(
        `/api/sales/catalog-items/?${productsQueryString}`,
        ['sales-catalog-items-list', productsQueryString]
    );

    const itemNameQueryString = useMemo(() => {
        const params = new URLSearchParams({
            detail: 'min',
            in_sales_catalog: 'false',
        });
        const normalizedSearch = itemNameSearch.trim();
        if (normalizedSearch) params.set('q', normalizedSearch);
        return params.toString();
    }, [itemNameSearch]);

    const itemNameOptionsQuery = useCustomQuery(
        `/api/inventory/products/?${itemNameQueryString}`,
        ['inventory-products-name-options', itemNameQueryString],
        { enabled: showForm }
    );

    const editProductDetailsQuery = useCustomQuery(
        `/api/sales/catalog-items/${editingApiItemId}/`,
        ['sales-catalog-item-details-products-services', editingApiItemId],
        { enabled: Boolean(editingApiItemId) }
    );

    const updateApiProduct = useCustomPatch(
        (id) => `/api/sales/catalog-items/${id}/`,
        [['inventory-products-min-list'], ['inventory-products-name-options']]
    );
    const createCatalogItem = useCustomPost(
        '/api/sales/catalog-items/create/',
        [['sales-catalog-items-list']]
    );
    const deleteApiProduct = useCustomRemove(
        (id) => `/api/sales/catalog-items/${id}/delete/`,
        [['inventory-products-min-list'], ['inventory-products-name-options'], ['sales-catalog-items-list']]
    );

    const getTypeLabel = (type) => {
        if (type === 'Service') return t('productsServices.service');
        if (type === 'Product') return t('productsServices.product');
        return type;
    };

    const productsAndServices = normalizeArrayResponse(productsResponse).map((item) => ({
        id: item.id,
        productId: item.product_id || '',
        name: item?.item?.name || t('productsServices.unnamedItem'),
        description: item?.item?.description || '-',
        type: item?.item?.type_display || (String(item?.item?.kind || '').toLowerCase() === 'service' ? 'Service' : 'Product'),
        unit: item?.item?.unit_name || '-',
        price: item?.selling_price ?? null,
        currencyCode: item?.currency_code || 'JOD',
        taxRuleId: item?.tax_rule?.id || '',
        taxDisplay: item?.tax_display || 'None',
        isApiItem: true,
    }));

    const filteredItems = productsAndServices;
    const itemNameOptions = normalizeArrayResponse(itemNameOptionsQuery.data).map((item) => ({
        id: item.id,
        name: item.name || t('productsServices.unnamedItem'),
    }));
    const hasAlternativeItemNameOptions = useMemo(() => {
        const normalizedCurrentName = String(formData.name || '').trim().toLowerCase();
        if (!normalizedCurrentName) return itemNameOptions.length > 0;
        return itemNameOptions.some((option) => String(option.name || '').trim().toLowerCase() !== normalizedCurrentName);
    }, [formData.name, itemNameOptions]);
    const isItemNameSelectDisabled = Boolean(editingItem) && !itemNameOptionsQuery.isFetching && !hasAlternativeItemNameOptions;
    const unitSelectOptions = unitOptions.map((item) => ({
        value: item.name,
        label: item.name,
    }));
    const isLoadingEditApiItem = Boolean(editingApiItemId) && editProductDetailsQuery.isLoading;

    const unitsQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(unitsPage));
        return params.toString();
    }, [unitsPage]);

    const taxQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(taxPage));
        if (taxSearchTerm.trim()) params.set('q', taxSearchTerm.trim());
        return params.toString();
    }, [taxPage, taxSearchTerm]);

    const revenueQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('account_type', 'revenue');
        params.set('page', String(revenuePage));
        if (revenueSearchTerm.trim()) params.set('q', revenueSearchTerm.trim());
        return params.toString();
    }, [revenuePage, revenueSearchTerm]);

    const unitsQuery = useCustomQuery(
        `/api/inventory/units/?${unitsQueryString}`,
        ['inventory-units-options', unitsQueryString],
        { enabled: showForm }
    );
    const taxRulesQuery = useCustomQuery(
        `/api/sales/tax-rules/?${taxQueryString}`,
        ['sales-tax-rules-options', taxQueryString],
        { enabled: showForm }
    );
    const revenueAccountsQuery = useCustomQuery(
        `/accounting/accounts/?${revenueQueryString}`,
        ['accounting-revenue-accounts-options', revenueQueryString],
        { enabled: showForm }
    );

    useEffect(() => {
        setTaxPage(1);
    }, [taxSearchTerm]);

    useEffect(() => {
        setRevenuePage(1);
    }, [revenueSearchTerm]);

    useEffect(() => {
        const normalized = normalizePagedResponse(unitsQuery.data);
        setUnitsHasMore(normalized.hasMore);
        setUnitOptions((prev) => {
            const mapped = normalized.items.map((item) => ({ id: item.id, name: item.name }));
            if (unitsPage === 1) return mapped;
            const existing = new Set(prev.map((item) => item.id));
            return [...prev, ...mapped.filter((item) => !existing.has(item.id))];
        });
    }, [unitsQuery.data, unitsPage]);

    useEffect(() => {
        const normalized = normalizePagedResponse(taxRulesQuery.data);
        setTaxHasMore(normalized.hasMore);
        setTaxOptions((prev) => {
            const mapped = normalized.items.map((rule) => ({
                id: rule.id,
                name: rule.name,
                rate: rule.rate_percent,
            }));
            if (taxPage === 1) return mapped;
            const existing = new Set(prev.map((item) => item.id));
            return [...prev, ...mapped.filter((item) => !existing.has(item.id))];
        });
    }, [taxRulesQuery.data, taxPage]);

    useEffect(() => {
        const normalized = normalizePagedResponse(revenueAccountsQuery.data);
        setRevenueHasMore(normalized.hasMore);
        setRevenueAccountOptions((prev) => {
            const mapped = normalized.items
                .filter((account) => account?.is_active !== false)
                .map((account) => ({
                    id: account.id,
                    code: account.code,
                    name: account.name,
                }));
            if (revenuePage === 1) return mapped;
            const existing = new Set(prev.map((item) => item.id));
            return [...prev, ...mapped.filter((item) => !existing.has(item.id))];
        });
    }, [revenueAccountsQuery.data, revenuePage]);

    useEffect(() => {
        if (!editingApiItemId || !editProductDetailsQuery.data) return;

        const details = editProductDetailsQuery.data;
        const normalizedType = String(details?.item?.type || '').toLowerCase() === 'stock_item' ? 'Product' : 'Service';

        const mappedForm = {
            name: details?.item?.name || '',
            type: normalizedType,
            price: String(details?.selling_price ?? ''),
            unit: details?.item?.unit_name || 'Unit',
            taxRuleId: details?.tax_rule?.id || '',
            description: details?.item?.description || '',
            revenueAccount: details?.revenue_account?.id || '',
        };

        setFormData(mappedForm);
        setItemNameSearch(details?.item?.name || '');
        setInitialEditSnapshot(normalizeFormSnapshot(mappedForm));
    }, [editingApiItemId, editProductDetailsQuery.data]);

    const isRequiredMissing = !formData.name.trim() || formData.price === '' || Number.isNaN(Number(formData.price));
    const isEditUnchanged = Boolean(editingItem) && normalizeFormSnapshot(formData) === initialEditSnapshot;
    const isSaveDisabled = isRequiredMissing || (Boolean(editingItem) && isEditUnchanged) || isLoadingEditApiItem;

    const handleSubmit = async () => {
        if (isSaveDisabled) return;

        try {
            if (editingItem?.isApiItem) {
                await updateApiProduct.mutateAsync({
                    id: editingItem.id,
                    name: formData.name.trim(),
                    type: formData.type === 'Product' ? 'stock_item' : 'service',
                    cost_price: Number(formData.price),
                    tax_rule: formData.taxRuleId || null,
                    inventory_asset_account: formData.revenueAccount || null,
                    unit: formData.unit || null,
                    category: null,
                    reorder_level: 0,
                    sku: formData.description.startsWith('SKU: ') ? formData.description.replace('SKU: ', '').trim() : formData.name.trim(),
                });
                toast.success(t('productsServices.updateSuccess'));
            } else if (editingItem) {
                updateProductOrService(editingItem.id, { ...formData, price: Number(formData.price) });
                toast.success(t('productsServices.updateSuccess'));
            } else {
                const matchedProduct = itemNameOptions.find((item) => item.name === formData.name);
                const productId = selectedProductId || matchedProduct?.id;
                if (!productId) {
                    toast.error(t('productsServices.selectValidItem'));
                    return;
                }

                await createCatalogItem.mutateAsync({
                    product: productId,
                    tax_rule: formData.taxRuleId || null,
                    revenue_account: formData.revenueAccount || null,
                    description: formData.description || '',
                    selling_price: String(formData.price),
                });
                toast.success(t('productsServices.addSuccess'));
            }
            resetForm();
        } catch (error) {
            toast.error(translateApiError(error, 'accounting:productsServices.saveFailed'));
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        if (item.isApiItem) {
            setEditingApiItemId(item.id);
            setInitialEditSnapshot('');
            setItemNameSearch(item.name || '');
            setFormData({
                name: item.name || '',
                type: item.type || 'Product',
                price: '',
                unit: 'Unit',
                taxRuleId: '',
                description: item.description || '',
                revenueAccount: '',
            });
        } else {
            const localForm = { name: item.name, type: item.type, price: item.price, unit: item.unit, taxRuleId: item.taxRuleId || '', description: item.description || '', revenueAccount: item.revenueAccount || '' };
            setFormData(localForm);
            setInitialEditSnapshot(normalizeFormSnapshot(localForm));
        }
        setShowForm(true);
    };

    const handleDeleteClick = (item) => {
        setDeleteTarget(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.isApiItem) {
                await deleteApiProduct.mutateAsync(deleteTarget.id);
            } else {
                deleteProductOrService(deleteTarget.id);
            }
            toast.success(t('productsServices.deleteSuccess'));
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            toast.error(translateApiError(error, 'accounting:productsServices.deleteFailed'));
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setEditingApiItemId('');
        setInitialEditSnapshot('');
        setItemNameSearch('');
        setSelectedProductId('');
        setTaxSearchTerm('');
        setRevenueSearchTerm('');
        setUnitsPage(1);
        setTaxPage(1);
        setRevenuePage(1);
        setFormData({ name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: '' });
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem',
        background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', cursor: 'pointer'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/accounting`)} className="cursor-pointer shrink-0" />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('productsServices.title')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t('productsServices.subtitle')}</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => { resetForm(); setShowForm(true); }} className="cursor-pointer">
                    {t('productsServices.addItem')}
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                    <input
                        type="text"
                        placeholder={t('productsServices.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '8px', border: '1px solid var(--color-border)',
                            fontSize: '0.9rem',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {[
                        { value: 'All', label: t('productsServices.filterAll') },
                        { value: 'Product', label: t('productsServices.filterProducts') },
                        { value: 'Service', label: t('productsServices.filterServices') },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setFilterType(value)}
                            style={{
                                padding: '6px 14px', border: 'none', borderRadius: '6px',
                                background: filterType === value ? 'var(--color-bg-surface)' : 'transparent',
                                boxShadow: filterType === value ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                color: filterType === value ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="padding-lg" style={{ border: '2px solid var(--color-border)', background: 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))', overflow: 'visible' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingItem ? t('productsServices.editItem') : t('productsServices.addNewItem')}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', overflow: 'visible' }}>
                        <SearchableSelectBackend
                            label={t('productsServices.itemName')}
                            value={formData.name}
                            options={itemNameOptions}
                            searchTerm={itemNameSearch}
                            onSearchChange={setItemNameSearch}
                            onChange={(_, option) => {
                                setFormData((prev) => ({ ...prev, name: option?.name || '' }));
                                setItemNameSearch(option?.name || '');
                                setSelectedProductId(option?.id || '');
                            }}
                            placeholder={t('productsServices.searchItemName')}
                            emptyLabel={itemNameOptionsQuery.isLoading ? t('productsServices.loading') : t('productsServices.noItemsFound')}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.name}
                            disabled={isItemNameSelectDisabled}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('productsServices.type')}</label>
                            <select style={selectStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="Service">{t('productsServices.service')}</option>
                                <option value="Product">{t('productsServices.product')}</option>
                            </select>
                        </div>
                        <Input label={t('productsServices.price')} type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                        <SelectWithLoadMore
                            label={t('productsServices.unit')}
                            value={formData.unit}
                            options={unitSelectOptions}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, unit: nextValue || '' }))}
                            emptyOptionLabel={t('productsServices.noUnitsFound')}
                            hasMore={unitsHasMore}
                            onLoadMore={() => setUnitsPage((prev) => prev + 1)}
                            isLoadingMore={unitsQuery.isFetching && unitsPage > 1}
                            isInitialLoading={unitsQuery.isFetching && unitsPage === 1}
                            paginationError={unitsQuery.isError ? t('productsServices.loadMoreUnitsFailed') : ''}
                            zIndex={1400}
                        />
                        <SearchableSelectBackend
                            label={t('productsServices.taxRule')}
                            value={formData.taxRuleId}
                            options={taxOptions}
                            searchTerm={taxSearchTerm}
                            onSearchChange={setTaxSearchTerm}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, taxRuleId: nextValue }))}
                            placeholder={t('productsServices.searchTaxRule')}
                            emptyLabel={taxRulesQuery.isFetching && taxPage === 1 ? t('productsServices.loadingTaxRules') : t('productsServices.noTaxRulesFound')}
                            getOptionLabel={(option) => `${option.name} (${option.rate}%)`}
                            getOptionValue={(option) => option.id}
                            hasMore={taxHasMore}
                            onLoadMore={() => setTaxPage((prev) => prev + 1)}
                            isLoadingMore={taxRulesQuery.isFetching && taxPage > 1}
                            isInitialLoading={taxRulesQuery.isFetching && taxPage === 1}
                            paginationError={taxRulesQuery.isError ? t('productsServices.loadMoreTaxFailed') : ''}
                            zIndex={1400}
                        />
                        <SearchableSelectBackend
                            label={t('productsServices.revenueAccount')}
                            value={formData.revenueAccount}
                            options={revenueAccountOptions}
                            searchTerm={revenueSearchTerm}
                            onSearchChange={setRevenueSearchTerm}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, revenueAccount: nextValue }))}
                            placeholder={t('productsServices.searchRevenueAccount')}
                            emptyLabel={revenueAccountsQuery.isFetching && revenuePage === 1 ? t('productsServices.loadingAccounts') : t('productsServices.noAccountsFound')}
                            getOptionLabel={(option) => `${option.code} - ${option.name}`}
                            getOptionValue={(option) => option.id}
                            hasMore={revenueHasMore}
                            onLoadMore={() => setRevenuePage((prev) => prev + 1)}
                            isLoadingMore={revenueAccountsQuery.isFetching && revenuePage > 1}
                            isInitialLoading={revenueAccountsQuery.isFetching && revenuePage === 1}
                            paginationError={revenueAccountsQuery.isError ? t('productsServices.loadMoreAccountsFailed') : ''}
                            zIndex={1400}
                        />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <Input label={t('productsServices.description')} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('productsServices.descriptionPlaceholder')} />
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={resetForm} className="cursor-pointer">{t('common:actions.cancel')}</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={isSaveDisabled} className="cursor-pointer">
                            {editingItem ? t('productsServices.update') : t('common:actions.save')}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Items Table */}
            <Card>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: isRtl ? 'right' : 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('productsServices.colItem')}</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('productsServices.colType')}</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('productsServices.colUnit')}</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: isRtl ? 'left' : 'right' }}>{t('productsServices.colPrice')}</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('productsServices.colTax')}</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('productsServices.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: item.type === 'Service' ? 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))' : 'var(--color-success-dim)',
                                            color: item.type === 'Service' ? 'var(--color-primary-600)' : 'var(--color-success)'
                                        }}>
                                            {item.type === 'Service' ? <Briefcase size={18} /> : <Package size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: item.type === 'Service' ? 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))' : 'var(--color-success-dim)',
                                        color: item.type === 'Service' ? 'var(--color-primary-600)' : 'var(--color-success)'
                                    }}>
                                        {getTypeLabel(item.type)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{item.unit}</td>
                                <td style={{ padding: '1rem', textAlign: isRtl ? 'left' : 'right', fontWeight: 700 }}>
                                    {item.price === null ? '-' : `${Number(item.price).toFixed(2)} ${item.currencyCode || 'JOD'}`}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                    {item.taxDisplay || (item.taxRuleId ? taxRules.find(r => r.id === item.taxRuleId)?.name || 'N/A' : t('productsServices.none'))}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }} aria-label={t('productsServices.editItemAria', { name: item.name })}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} aria-label={t('productsServices.deleteItemAria', { name: item.name })}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {isProductsLoading && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    {t('productsServices.loadingProducts')}
                                </td>
                            </tr>
                        )}
                        {isProductsError && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                    {t('productsServices.loadFailed')}
                                </td>
                            </tr>
                        )}
                        {!isProductsLoading && !isProductsError && filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    {t('productsServices.emptyState')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </Card>
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    title={t('productsServices.deleteTitle')}
                    message={t('productsServices.deleteMessage', { name: deleteTarget?.name || t('productsServices.unnamedItem') })}
                    onCancel={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteTarget(null);
                    }}
                    onConfirm={confirmDelete}
                    type="danger"
                    confirmText={deleteApiProduct.isPending ? t('productsServices.deleting') : t('common:actions.delete')}
                />
            )}
        </div>
    );
};

export default ProductsServices;
