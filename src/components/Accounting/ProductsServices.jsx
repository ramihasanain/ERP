import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch, useCustomPost, useCustomRemove } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import SearchableSelectBackend from '@/core/SearchableSelectBackend';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
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
    const navigate = useNavigate();
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
        name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: '4110'
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

    const productsAndServices = normalizeArrayResponse(productsResponse).map((item) => ({
        id: item.id,
        productId: item.product_id || '',
        name: item?.item?.name || 'Unnamed item',
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
        name: item.name || 'Unnamed item',
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
            revenueAccount: details?.revenue_account?.id || '4110',
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
                toast.success('Item updated successfully.');
            } else if (editingItem) {
                updateProductOrService(editingItem.id, { ...formData, price: Number(formData.price) });
                toast.success('Item updated successfully.');
            } else {
                const matchedProduct = itemNameOptions.find((item) => item.name === formData.name);
                const productId = selectedProductId || matchedProduct?.id;
                if (!productId) {
                    toast.error('Please select a valid item name from the dropdown.');
                    return;
                }

                await createCatalogItem.mutateAsync({
                    product: productId,
                    tax_rule: formData.taxRuleId || null,
                    revenue_account: formData.revenueAccount || null,
                    description: formData.description || '',
                    selling_price: String(formData.price),
                });
                toast.success('Item added successfully.');
            }
            resetForm();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to save item.'));
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
                revenueAccount: '4110',
            });
        } else {
            const localForm = { name: item.name, type: item.type, price: item.price, unit: item.unit, taxRuleId: item.taxRuleId || '', description: item.description || '', revenueAccount: item.revenueAccount || '4110' };
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
            toast.success('Item deleted successfully.');
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to delete item.'));
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
        setFormData({ name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: '4110' });
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
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} className="cursor-pointer shrink-0" />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Products & Services</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Manage your catalog of billable items.</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => { resetForm(); setShowForm(true); }}>
                    Add Item
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search products or services..."
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
                    {['All', 'Product', 'Service'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                padding: '6px 14px', border: 'none', borderRadius: '6px',
                                background: filterType === type ? 'var(--color-bg-surface)' : 'transparent',
                                boxShadow: filterType === type ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                color: filterType === type ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                            }}
                        >
                            {type === 'All' ? 'All' : type + 's'}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="padding-lg" style={{ border: '2px solid var(--color-border)', background: 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))', overflow: 'visible' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', overflow: 'visible' }}>
                        <SearchableSelectBackend
                            label="Item Name *"
                            value={formData.name}
                            options={itemNameOptions}
                            searchTerm={itemNameSearch}
                            onSearchChange={setItemNameSearch}
                            onChange={(_, option) => {
                                setFormData((prev) => ({ ...prev, name: option?.name || '' }));
                                setItemNameSearch(option?.name || '');
                                setSelectedProductId(option?.id || '');
                            }}
                            placeholder="Search item name..."
                            emptyLabel={itemNameOptionsQuery.isLoading ? 'Loading...' : 'No items found'}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.name}
                            disabled={isItemNameSelectDisabled}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                            <select style={selectStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="Service">Service</option>
                                <option value="Product">Product</option>
                            </select>
                        </div>
                        <Input label="Price *" type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                        <SelectWithLoadMore
                            label="Unit"
                            value={formData.unit}
                            options={unitSelectOptions}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, unit: nextValue || '' }))}
                            emptyOptionLabel="No units found"
                            hasMore={unitsHasMore}
                            onLoadMore={() => setUnitsPage((prev) => prev + 1)}
                            isLoadingMore={unitsQuery.isFetching && unitsPage > 1}
                            isInitialLoading={unitsQuery.isFetching && unitsPage === 1}
                            paginationError={unitsQuery.isError ? 'Failed to load more units.' : ''}
                            zIndex={1400}
                        />
                        <SearchableSelectBackend
                            label="Tax Rule"
                            value={formData.taxRuleId}
                            options={taxOptions}
                            searchTerm={taxSearchTerm}
                            onSearchChange={setTaxSearchTerm}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, taxRuleId: nextValue }))}
                            placeholder="Search tax rule..."
                            emptyLabel={taxRulesQuery.isFetching && taxPage === 1 ? 'Loading tax rules...' : 'No tax rules found'}
                            getOptionLabel={(option) => `${option.name} (${option.rate}%)`}
                            getOptionValue={(option) => option.id}
                            hasMore={taxHasMore}
                            onLoadMore={() => setTaxPage((prev) => prev + 1)}
                            isLoadingMore={taxRulesQuery.isFetching && taxPage > 1}
                            isInitialLoading={taxRulesQuery.isFetching && taxPage === 1}
                            paginationError={taxRulesQuery.isError ? 'Failed to load more tax rules.' : ''}
                            zIndex={1400}
                        />
                        <SearchableSelectBackend
                            label="Revenue Account"
                            value={formData.revenueAccount}
                            options={revenueAccountOptions}
                            searchTerm={revenueSearchTerm}
                            onSearchChange={setRevenueSearchTerm}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, revenueAccount: nextValue }))}
                            placeholder="Search revenue account..."
                            emptyLabel={revenueAccountsQuery.isFetching && revenuePage === 1 ? 'Loading accounts...' : 'No accounts found'}
                            getOptionLabel={(option) => `${option.code} - ${option.name}`}
                            getOptionValue={(option) => option.id}
                            hasMore={revenueHasMore}
                            onLoadMore={() => setRevenuePage((prev) => prev + 1)}
                            isLoadingMore={revenueAccountsQuery.isFetching && revenuePage > 1}
                            isInitialLoading={revenueAccountsQuery.isFetching && revenuePage === 1}
                            paginationError={revenueAccountsQuery.isError ? 'Failed to load more accounts.' : ''}
                            zIndex={1400}
                        />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={isSaveDisabled}>
                            {editingItem ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Items Table */}
            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Item</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Unit</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tax</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
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
                                        {item.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{item.unit}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                                    {item.price === null ? '-' : `${Number(item.price).toFixed(2)} ${item.currencyCode || 'JOD'}`}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                    {item.taxDisplay || (item.taxRuleId ? taxRules.find(r => r.id === item.taxRuleId)?.name || 'N/A' : 'None')}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }} aria-label={`Edit ${item.name}`}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} aria-label={`Delete ${item.name}`}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {isProductsLoading && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Loading products...
                                </td>
                            </tr>
                        )}
                        {isProductsError && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                    Failed to load products.
                                </td>
                            </tr>
                        )}
                        {!isProductsLoading && !isProductsError && filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No items found. Click "Add Item" to create your first product or service.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    title="Delete Item"
                    message={`Are you sure you want to delete "${deleteTarget?.name || 'this item'}"? This action cannot be undone.`}
                    onCancel={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteTarget(null);
                    }}
                    onConfirm={confirmDelete}
                    type="danger"
                    confirmText={deleteApiProduct.isPending ? 'Deleting...' : 'Delete'}
                />
            )}
        </div>
    );
};

export default ProductsServices;
