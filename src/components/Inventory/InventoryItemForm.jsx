import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut } from '@/hooks/useMutation';
import translateApiError from '@/utils/translateApiError';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const getCategoryId = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return value.id || value.category_id || value.uuid || '';
    return '';
};

const getUnitValue = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        return value.id || value.unit_id || value.uuid || value.name || '';
    }
    return '';
};

const defaultFormData = {
    name: '',
    sku: '',
    type: 'stock_item',
    uom: '',
    categoryId: '',
    purchasePrice: '',
    sellingPrice: '',
    reorderLevel: '',
    glAccountId: '1200',
};

const mapProductToForm = (product) => {
    const typeRaw = String(product?.type?.name ?? product?.type ?? '').toLowerCase();
    const isStock =
        typeRaw.includes('stock') ||
        typeRaw === 'inventory_item' ||
        typeRaw === 'inventory' ||
        typeRaw === 'stock_item';

    const categoryValue = product?.category_id || product?.category;

    return {
        name: product?.name || '',
        sku: product?.sku || '',
        type: isStock ? 'stock_item' : 'service',
        uom: getUnitValue(product?.unit_id || product?.unit?.id || product?.unit || product?.uom_id || product?.uom),
        categoryId: getCategoryId(categoryValue) || (typeof categoryValue === 'string' ? categoryValue : ''),
        purchasePrice: String(product?.cost_price ?? product?.purchasePrice ?? ''),
        sellingPrice: String(product?.selling_price ?? product?.sellingPrice ?? ''),
        reorderLevel: String(product?.reorder_level ?? product?.reorderLevel ?? ''),
        glAccountId: '1200',
    };
};

const buildPayload = (formData) => ({
    name: formData.name.trim(),
    sku: formData.sku.trim(),
    type: formData.type === 'stock_item' ? 'stock_item' : 'service',
    unit: formData.uom,
    category: formData.categoryId || null,
    cost_price: parseFloat(formData.purchasePrice) || 0,
    selling_price: parseFloat(formData.sellingPrice) || 0,
    reorder_level: formData.type === 'stock_item' ? parseInt(formData.reorderLevel || '0', 10) : 0,
});

const resolveUomValue = (value, unitOptions) => {
    if (!value || !unitOptions?.length) return value || '';

    const matchesById = unitOptions.some((unit) => unit.id === value);
    if (matchesById) return value;

    const matchedByName = unitOptions.find((unit) => unit.name.toLowerCase() === String(value).toLowerCase());
    return matchedByName?.id || value;
};

const resolveCategoryValue = (value, categoryOptions) => {
    if (!value || !categoryOptions?.length) return value || '';

    const matchesById = categoryOptions.some((category) => category.id === value);
    if (matchesById) return value;

    const matchedByName = categoryOptions.find((category) => category.name.toLowerCase() === String(value).toLowerCase());
    return matchedByName?.id || value;
};

const InventoryItemForm = ({ isEdit = false }) => {
    const { t } = useTranslation(['inventory', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { id } = useParams();
    const [formData, setFormData] = useState(defaultFormData);
    const [initialPayload, setInitialPayload] = useState(null);
    const [isNarrow, setIsNarrow] = useState(false);

    const categoriesQuery = useCustomQuery('/api/inventory/categories/', ['inventory-categories-form'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .map((item) => ({ id: item?.id || '', name: item?.name || '' }))
                .filter((item) => item.id),
    });
    const unitsQuery = useCustomQuery('/api/inventory/units/', ['inventory-units-form'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .filter((item) => item?.is_active !== false)
                .map((item) => ({ id: item?.id || '', name: item?.name || '' }))
                .filter((item) => item.id),
    });

    const productQuery = useCustomQuery(`/api/inventory/products/${id}/`, ['inventory-product-details', id], {
        enabled: isEdit && Boolean(id),
    });

    const createProduct = useCustomPost('/api/inventory/products/create/', [['inventory-products']]);
    const updateProduct = useCustomPut(() => `/api/inventory/products/${id}/`, [['inventory-products']]);

    const isBusy = createProduct.isPending || updateProduct.isPending;
    const isLoading = categoriesQuery.isPending || unitsQuery.isPending || (isEdit && productQuery.isPending);
    const hasError = categoriesQuery.isError || unitsQuery.isError || (isEdit && productQuery.isError);
    const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    const unitOptions = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);

    useEffect(() => {
        if (!isEdit) {
            setFormData(defaultFormData);
            setInitialPayload(null);
            return;
        }
        if (productQuery.data) {
            const mappedForm = mapProductToForm(productQuery.data);
            const normalizedForm = {
                ...mappedForm,
                uom: resolveUomValue(mappedForm.uom, unitOptions),
                categoryId: resolveCategoryValue(mappedForm.categoryId, categoryOptions),
            };
            setFormData(normalizedForm);
            setInitialPayload(buildPayload(normalizedForm));
        }
    }, [isEdit, productQuery.data, unitOptions, categoryOptions]);

    useEffect(() => {
        if (!unitOptions.length && !categoryOptions.length) return;

        setFormData((prev) => {
            let next = prev;

            if (unitOptions.length) {
                if (!next.uom) {
                    next = { ...next, uom: unitOptions[0].id };
                } else {
                    const resolvedUom = resolveUomValue(next.uom, unitOptions);
                    if (resolvedUom !== next.uom) {
                        next = { ...next, uom: resolvedUom };
                    }
                }
            }

            if (categoryOptions.length && next.categoryId) {
                const resolvedCategory = resolveCategoryValue(next.categoryId, categoryOptions);
                if (resolvedCategory !== next.categoryId) {
                    next = { ...next, categoryId: resolvedCategory };
                }
            }

            return next;
        });
    }, [unitOptions, categoryOptions]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const media = window.matchMedia('(max-width: 900px)');
        const update = () => setIsNarrow(media.matches);

        update();
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', update);
            return () => media.removeEventListener('change', update);
        }

        media.addListener(update);
        return () => media.removeListener(update);
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = buildPayload(formData);

        try {
            if (isEdit && id) {
                await updateProduct.mutateAsync(payload);
                toast.success(t('itemForm.updateSuccess'));
            } else {
                await createProduct.mutateAsync(payload);
                toast.success(t('itemForm.createSuccess'));
            }
            navigate(`${basePath}/inventory/items`);
        } catch (error) {
            toast.error(translateApiError(error, isEdit ? 'inventory:itemForm.updateFailed' : 'inventory:itemForm.createFailed'));
        }
    };

    const isUnchanged =
        isEdit && initialPayload ? JSON.stringify(buildPayload(formData)) === JSON.stringify(initialPayload) : false;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(`${basePath}/inventory/items`)} style={{ marginBottom: '1rem' }}>
                {t('itemForm.backToItems')}
            </Button>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>{isEdit ? t('itemForm.editTitle') : t('itemForm.addTitle')}</h1>

            {isLoading && <Spinner />}

            {hasError && !isLoading && (
                <Card className="padding-md">
                    <p style={{ margin: 0, color: 'var(--color-error)' }}>
                        {isEdit ? t('itemForm.loadFailedEdit') : t('itemForm.loadFailedCreate')}
                    </p>
                </Card>
            )}

            {!isLoading && !hasError && (
                <form onSubmit={handleSubmit}>
                    <Card className="padding-md">
                        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ gridColumn: isNarrow ? 'span 1' : 'span 2' }}>
                                <label style={labelStyle}>{t('itemForm.itemName')}</label>
                                <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>{t('itemForm.sku')}</label>
                                <input name="sku" value={formData.sku} onChange={handleChange} required style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>{t('itemForm.category')}</label>
                                <SelectWithLoadMore
                                    id="inventory-item-category"
                                    value={formData.categoryId ?? ''}
                                    onChange={(nextValue) => {
                                        setFormData((prev) => ({ ...prev, categoryId: nextValue }));
                                    }}
                                    options={categoryOptions.map((category) => ({
                                        value: category.id,
                                        label: category.name || category.id,
                                    }))}
                                    emptyOptionLabel={t('itemForm.selectCategory')}
                                    isInitialLoading={categoriesQuery.isPending}
                                    disabled={categoriesQuery.isError}
                                    triggerStyle={{
                                        ...inputStyle,
                                        height: 'auto',
                                        padding: inputStyle.padding,
                                        borderRadius: inputStyle.borderRadius,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>{t('itemForm.itemType')}</label>
                                <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                                    <option value="stock_item">{t('itemForm.stockItem')}</option>
                                    <option value="service">{t('itemForm.serviceItem')}</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>{t('itemForm.unitOfMeasure')}</label>
                                <select name="uom" value={formData.uom} onChange={handleChange} style={inputStyle} required>
                                    <option value="" disabled>
                                        {t('itemForm.selectUnit')}
                                    </option>
                                    {unitOptions.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name || unit.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ gridColumn: isNarrow ? 'span 1' : 'span 2', borderTop: '1px solid var(--color-border)', margin: '1rem 0' }} />

                            <div>
                                <label style={labelStyle}>{t('itemForm.costPrice')}</label>
                                <input name="purchasePrice" type="number" step="0.01" value={formData.purchasePrice} onChange={handleChange} required style={inputStyle} />
                            </div>

                            {formData.type === 'stock_item' && (
                                <>
                                    <div>
                                        <label style={labelStyle}>{t('itemForm.reorderLevel')}</label>
                                        <input name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} style={inputStyle} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="primary" icon={<CheckCircle size={18} />} disabled={isBusy || isUnchanged}>
                                {isEdit ? (isBusy ? t('itemForm.updating') : t('itemForm.updateItem')) : isBusy ? t('itemForm.creating') : t('itemForm.createItem')}
                            </Button>
                        </div>
                    </Card>
                </form>
            )}
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };

export default InventoryItemForm;
