import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch, useCustomPost } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import SearchableSelectBackend from '@/core/SearchableSelectBackend';
import Spinner from '@/core/Spinner';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const normalizePagedResponse = (response, nestedKey) => {
    const rawData = response?.data;

    if (Array.isArray(rawData)) {
        return {
            items: rawData,
            hasMore: Boolean(response?.next),
        };
    }

    if (nestedKey && Array.isArray(rawData?.[nestedKey])) {
        return {
            items: rawData[nestedKey],
            hasMore: Boolean(response?.next),
        };
    }

    if (Array.isArray(response?.results)) {
        return {
            items: response.results,
            hasMore: Boolean(response?.next),
        };
    }

    if (Array.isArray(response)) {
        return {
            items: response,
            hasMore: false,
        };
    }

    return {
        items: [],
        hasMore: false,
    };
};

const mergeUniqueById = (previousItems, nextItems, page) => {
    if (page === 1) return nextItems;

    const existingIds = new Set(previousItems.map((item) => item.id));
    return [...previousItems, ...nextItems.filter((item) => !existingIds.has(item.id))];
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCatalogItems = (response) => normalizePagedResponse(response).items.map((catalogItem) => {
    const item = catalogItem?.item || catalogItem?.product || catalogItem;
    const taxRule = catalogItem?.tax_rule || item?.tax_rule || {};

    return {
        id: catalogItem.id,
        name: item?.name || catalogItem.name || catalogItem.description || 'Unnamed item',
        sku: item?.sku || catalogItem.sku || '',
        price: toNumber(catalogItem.selling_price ?? catalogItem.unit_price ?? item?.selling_price ?? item?.cost_price),
        description: catalogItem.description || item?.description || item?.name || '',
        taxRuleId: taxRule?.id || '',
        taxRuleName: taxRule?.name || '',
        stock: item?.total_stock,
    };
});

const normalizeWarehouses = (response) => normalizePagedResponse(response).items.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name || 'Unnamed warehouse',
    location: warehouse.location || '',
}));

const buildInvoicePayload = ({ customerId, invoiceDate, dueDate, isTaxInclusive, notes, warehouseId, items, includeTaxFlag = true }) => ({
    customer: customerId,
    ...(includeTaxFlag ? { amounts_include_tax: Boolean(isTaxInclusive) } : {}),
    invoice_date: invoiceDate,
    due_date: dueDate,
    notes,
    warehouse: warehouseId,
    lines: items
        .filter((item) => item.productId && toNumber(item.qty) > 0)
        .map((item) => ({
            sales_catalog_item: item.productId,
            quantity: String(item.qty),
            ...(item.taxRuleId ? { tax_rule: item.taxRuleId } : {}),
        })),
});

const isInvoicePayloadComplete = (payload) => (
    Boolean(payload.customer) &&
    Boolean(payload.invoice_date) &&
    Boolean(payload.due_date) &&
    Boolean(payload.warehouse) &&
    payload.lines.length > 0
);

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { id: invoiceId } = useParams();
    const { taxRules: contextTaxRules } = useAccounting();
    const isEditMode = Boolean(invoiceId);
    const invoicesRoute = '/admin/accounting/invoices';

    // Invoice State
    const [customerId, setCustomerId] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerPage, setCustomerPage] = useState(1);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customersHasMore, setCustomersHasMore] = useState(false);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [isTaxInclusive, setIsTaxInclusive] = useState(false);
    const [notes, setNotes] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
    const [warehousePage, setWarehousePage] = useState(1);
    const [warehouseOptions, setWarehouseOptions] = useState([]);
    const [warehousesHasMore, setWarehousesHasMore] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productPage, setProductPage] = useState(1);
    const [productOptions, setProductOptions] = useState([]);
    const [productsHasMore, setProductsHasMore] = useState(false);
    const [taxSearchTerm, setTaxSearchTerm] = useState('');
    const [taxPage, setTaxPage] = useState(1);
    const [taxOptions, setTaxOptions] = useState([]);
    const [taxHasMore, setTaxHasMore] = useState(false);

    // Items State
    const [items, setItems] = useState([
        { id: 1, productId: '', item: '', qty: 1, price: 0, taxRuleId: '', costCenter: '', taxAmount: 0, total: 0 }
    ]);
    const [initialPayload, setInitialPayload] = useState(null);
    const [initializedInvoiceId, setInitializedInvoiceId] = useState('');

    const customersQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(customerPage));
        if (customerSearchTerm.trim()) params.set('q', customerSearchTerm.trim());
        return params.toString();
    }, [customerPage, customerSearchTerm]);

    const productsQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(productPage));
        if (productSearchTerm.trim()) params.set('q', productSearchTerm.trim());
        return params.toString();
    }, [productPage, productSearchTerm]);

    const warehousesQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(warehousePage));
        if (warehouseSearchTerm.trim()) params.set('q', warehouseSearchTerm.trim());
        return params.toString();
    }, [warehousePage, warehouseSearchTerm]);

    const taxQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(taxPage));
        if (taxSearchTerm.trim()) params.set('q', taxSearchTerm.trim());
        return params.toString();
    }, [taxPage, taxSearchTerm]);

    const customersQuery = useCustomQuery(
        `/api/sales/customers/?${customersQueryString}`,
        ['sales-customers-invoice-options', customersQueryString]
    );
    const productsQuery = useCustomQuery(
        `/api/sales/catalog-items/?${productsQueryString}`,
        ['sales-catalog-items-invoice-options', productsQueryString]
    );
    const warehousesQuery = useCustomQuery(
        `/api/inventory/warehouses/?${warehousesQueryString}`,
        ['inventory-warehouses-invoice-options', warehousesQueryString]
    );
    const taxRulesQuery = useCustomQuery(
        `/api/sales/tax-rules/?${taxQueryString}`,
        ['sales-tax-rules-invoice-options', taxQueryString]
    );
    const invoiceDetailsQuery = useCustomQuery(
        `/api/sales/invoices/${invoiceId}/`,
        ['sales-invoice-edit', invoiceId],
        {
            enabled: isEditMode,
        }
    );
    const createInvoiceMutation = useCustomPost(
        '/api/sales/invoices/create/',
        [['sales-invoices']]
    );
    const updateInvoiceMutation = useCustomPatch(
        (id) => `/api/sales/invoices/${id}/`,
        [['sales-invoices'], ['sales-invoice-edit', invoiceId], ['sales-invoice-preview', invoiceId]]
    );

    useEffect(() => {
        setCustomerPage(1);
    }, [customerSearchTerm]);

    useEffect(() => {
        setProductPage(1);
    }, [productSearchTerm]);

    useEffect(() => {
        setWarehousePage(1);
    }, [warehouseSearchTerm]);

    useEffect(() => {
        setTaxPage(1);
    }, [taxSearchTerm]);

    useEffect(() => {
        const normalized = normalizePagedResponse(customersQuery.data);
        setCustomersHasMore(normalized.hasMore);
        setCustomerOptions((prev) => mergeUniqueById(
            prev,
            normalized.items
                .filter((customer) => customer?.is_active !== false)
                .map((customer) => ({
                    id: customer.id,
                    name: customer.name || 'Unnamed customer',
                    contactPerson: customer.contact_person || '',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    currencyCode: customer.currency_code || '',
                })),
            customerPage
        ));
    }, [customersQuery.data, customerPage]);

    useEffect(() => {
        const normalized = normalizePagedResponse(productsQuery.data);
        setProductsHasMore(normalized.hasMore);
        setProductOptions((prev) => mergeUniqueById(
            prev,
            normalizeCatalogItems(productsQuery.data),
            productPage
        ));
    }, [productsQuery.data, productPage]);

    useEffect(() => {
        const normalized = normalizePagedResponse(warehousesQuery.data);
        setWarehousesHasMore(normalized.hasMore);
        setWarehouseOptions((prev) => mergeUniqueById(
            prev,
            normalizeWarehouses(warehousesQuery.data),
            warehousePage
        ));
    }, [warehousesQuery.data, warehousePage]);

    useEffect(() => {
        const normalized = normalizePagedResponse(taxRulesQuery.data, 'tax_rules');
        setTaxHasMore(normalized.hasMore);
        setTaxOptions((prev) => mergeUniqueById(
            prev,
            normalized.items.map((rule) => ({
                id: rule.id,
                name: rule.name || 'Unnamed tax rule',
                rate: toNumber(rule.rate_percent ?? rule.rate),
            })),
            taxPage
        ));
    }, [taxRulesQuery.data, taxPage]);

    useEffect(() => {
        const invoice = invoiceDetailsQuery.data;
        if (!isEditMode || !invoice || initializedInvoiceId === invoiceId) return;

        const nextItems = (invoice.lines || []).map((line, index) => ({
            id: line.id || `${line.sales_catalog_item}-${index}`,
            productId: line.sales_catalog_item || '',
            item: line.description || '',
            qty: String(Number(line.quantity ?? 1)),
            price: toNumber(line.unit_price),
            taxRuleId: line.tax_rule?.id || '',
            costCenter: '',
            taxAmount: toNumber(line.line_tax),
            total: toNumber(line.line_gross ?? line.line_net),
            net: toNumber(line.line_net),
        }));
        const populatedItems = nextItems.length
            ? nextItems
            : [{ id: 1, productId: '', item: '', qty: 1, price: 0, taxRuleId: '', costCenter: '', taxAmount: 0, total: 0 }];

        const selectedCustomer = {
            id: invoice.customer,
            name: invoice.customer_name || invoice.customer || 'Customer',
        };
        const selectedWarehouse = {
            id: invoice.warehouse,
            name: invoice.warehouse_display?.name || invoice.warehouse || 'Warehouse',
        };
        const selectedProducts = (invoice.lines || [])
            .filter((line) => line.sales_catalog_item)
            .map((line) => ({
                id: line.sales_catalog_item,
                name: line.description || line.product || 'Invoice item',
                sku: '',
                price: toNumber(line.unit_price),
                description: line.description || '',
                taxRuleId: line.tax_rule?.id || '',
                taxRuleName: line.tax_rule?.name || '',
            }));
        const selectedTaxRules = (invoice.lines || [])
            .filter((line) => line.tax_rule?.id)
            .map((line) => ({
                id: line.tax_rule.id,
                name: line.tax_rule.name || 'Tax rule',
                rate: toNumber(line.line_net) > 0 ? (toNumber(line.line_tax) / toNumber(line.line_net)) * 100 : 0,
            }));

        setCustomerId(invoice.customer || '');
        setInvoiceDate(invoice.invoice_date || '');
        setDueDate(invoice.due_date || '');
        setIsTaxInclusive(Boolean(invoice.amounts_include_tax));
        setNotes(invoice.notes || '');
        setWarehouseId(invoice.warehouse || '');
        setItems(populatedItems);
        setCustomerOptions((prev) => mergeUniqueById(prev, selectedCustomer.id ? [selectedCustomer] : [], 2));
        setWarehouseOptions((prev) => mergeUniqueById(prev, selectedWarehouse.id ? [selectedWarehouse] : [], 2));
        setProductOptions((prev) => mergeUniqueById(prev, selectedProducts, 2));
        setTaxOptions((prev) => mergeUniqueById(prev, selectedTaxRules, 2));

        setInitialPayload(buildInvoicePayload({
            customerId: invoice.customer || '',
            invoiceDate: invoice.invoice_date || '',
            dueDate: invoice.due_date || '',
            isTaxInclusive: Boolean(invoice.amounts_include_tax),
            notes: invoice.notes || '',
            warehouseId: invoice.warehouse || '',
            items: populatedItems,
        }));
        setInitializedInvoiceId(invoiceId);
    }, [initializedInvoiceId, invoiceDetailsQuery.data, invoiceId, isEditMode]);

    const taxRateById = useMemo(() => {
        const entries = [
            ...contextTaxRules.map((rule) => [rule.id, toNumber(rule.rate)]),
            ...taxOptions.map((rule) => [rule.id, toNumber(rule.rate)]),
        ];
        return new Map(entries);
    }, [contextTaxRules, taxOptions]);

    const calculateInvoiceTax = (amount, taxRuleId, isInclusive = false) => {
        const ratePercent = taxRateById.get(taxRuleId) || 0;
        const rate = ratePercent / 100;

        if (!rate) return { net: amount, tax: 0, total: amount, rate: 0 };

        if (isInclusive) {
            const net = amount / (1 + rate);
            const tax = amount - net;
            return { net, tax, total: amount, rate: ratePercent };
        }

        const tax = amount * rate;
        return { net: amount, tax, total: amount + tax, rate: ratePercent };
    };

    // Recalculate totals whenever items or tax settings change
    useEffect(() => {
        const updatedItems = items.map(item => {
            const lineAmount = toNumber(item.qty) * toNumber(item.price);
            const taxResult = calculateInvoiceTax(lineAmount, item.taxRuleId, isTaxInclusive);
            return {
                ...item,
                taxAmount: taxResult.tax,
                total: taxResult.total,
                net: taxResult.net
            };
        });

        // Only update if values actually changed to avoid infinite loop (JSON comparison is quick for small logic)
        if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
            setItems(updatedItems);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTaxInclusive, taxRateById, items.map(i => `${i.qty}-${i.price}-${i.taxRuleId}`).join(',')]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', item: '', qty: 1, price: 0, taxRuleId: '', costCenter: '', taxAmount: 0, total: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const getTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (isTaxInclusive ? toNumber(item.net) : (toNumber(item.qty) * toNumber(item.price))), 0);
        const taxTotal = items.reduce((sum, item) => sum + toNumber(item.taxAmount), 0);
        const grandTotal = items.reduce((sum, item) => sum + toNumber(item.total), 0);
        return { subtotal, taxTotal, grandTotal };
    };

    const { subtotal, taxTotal, grandTotal } = getTotals();
    const invoicePayload = useMemo(() => buildInvoicePayload({
        customerId,
        invoiceDate,
        dueDate,
        isTaxInclusive,
        notes,
        warehouseId,
        items,
        includeTaxFlag: isEditMode || isTaxInclusive,
    }), [customerId, dueDate, invoiceDate, isEditMode, isTaxInclusive, items, notes, warehouseId]);
    const isFormComplete = isInvoicePayloadComplete(invoicePayload);
    const hasInvoiceChanges = !isEditMode || JSON.stringify(invoicePayload) !== JSON.stringify(initialPayload);
    const isSubmitting = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;
    const isSubmitDisabled = isSubmitting || !isFormComplete || (isEditMode && !hasInvoiceChanges);
    const generatedInvoiceNumber = useMemo(
        () => `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        []
    );

    const handleSubmitInvoice = async () => {
        if (!isFormComplete) {
            toast.error('Please complete customer, dates, warehouse, and line items before saving.');
            return;
        }
        if (isEditMode && !hasInvoiceChanges) return;

        try {
            if (isEditMode) {
                await updateInvoiceMutation.mutateAsync({ id: invoiceId, ...invoicePayload });
            } else {
                await createInvoiceMutation.mutateAsync(invoicePayload);
            }

            toast.success(isEditMode ? 'Invoice updated successfully.' : 'Invoice created successfully.');
            navigate(isEditMode ? `/admin/accounting/invoices/${invoiceId}` : '/admin/accounting/invoices');
        } catch (error) {
            toast.error(getApiErrorMessage(error, isEditMode ? 'Failed to update invoice.' : 'Failed to create invoice.'));
        }
    };

    if (isEditMode && invoiceDetailsQuery.isLoading) {
        return (
            <div style={{ minHeight: '320px', display: 'grid', placeItems: 'center' }}>
                <Spinner />
            </div>
        );
    }

    if (isEditMode && invoiceDetailsQuery.isError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(invoicesRoute)}
                    className="cursor-pointer shrink-0"
                    style={{ alignSelf: 'flex-start' }}
                >
                    Back to invoices
                </Button>
                <Card className="padding-lg">
                    <div style={{ color: 'var(--color-error)' }}>Failed to load invoice details.</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="create-invoice-page">
            <div className="create-invoice-header">
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(invoicesRoute)}
                    className="cursor-pointer shrink-0"
                />
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{isEditMode ? 'Update sales invoice details.' : 'Issue a new sales invoice to a Customer.'}</p>
                </div>
            </div>

            <Card className="padding-lg create-invoice-card" style={{ overflow: 'visible' }}>
                <div className="invoice-details-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Customer Details</h3>
                        <div className="customer-select-grid">
                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Customer Name</label>
                                <SearchableSelectBackend
                                    value={customerId}
                                    options={customerOptions}
                                    searchTerm={customerSearchTerm}
                                    onSearchChange={setCustomerSearchTerm}
                                    onChange={(nextValue) => setCustomerId(nextValue)}
                                    placeholder="Search customer..."
                                    emptyLabel={customersQuery.isFetching && customerPage === 1 ? 'Loading customers...' : 'No customers found'}
                                    getOptionLabel={(option) => [
                                        option.name,
                                        option.email,
                                        option.currencyCode,
                                    ].filter(Boolean).join(' - ')}
                                    getOptionValue={(option) => option.id}
                                    hasMore={customersHasMore}
                                    onLoadMore={() => setCustomerPage((prev) => prev + 1)}
                                    isLoadingMore={customersQuery.isFetching && customerPage > 1}
                                    isInitialLoading={customersQuery.isFetching && customerPage === 1}
                                    paginationError={customersQuery.isError ? 'Failed to load customers.' : ''}
                                    zIndex={1200}
                                />
                            </div>
                            <Button
                                variant="outline"
                                style={{ width: '2.5rem', padding: 0, justifyContent: 'center' }}
                                title="Add New Customer"
                                onClick={() => navigate('/admin/accounting/customers/new')}
                            >
                                <Plus size={18} />
                            </Button>
                        </div>
                        <Input label="Billing Address" placeholder="Street, City, Country" />

                        <SearchableSelectBackend
                            label="Warehouse"
                            value={warehouseId}
                            options={warehouseOptions}
                            searchTerm={warehouseSearchTerm}
                            onSearchChange={setWarehouseSearchTerm}
                            onChange={(nextValue) => setWarehouseId(nextValue)}
                            placeholder="Search warehouse..."
                            emptyLabel={warehousesQuery.isFetching && warehousePage === 1 ? 'Loading warehouses...' : 'No warehouses found'}
                            getOptionLabel={(option) => [
                                option.name,
                                option.location,
                            ].filter(Boolean).join(' - ')}
                            getOptionValue={(option) => option.id}
                            hasMore={warehousesHasMore}
                            onLoadMore={() => setWarehousePage((prev) => prev + 1)}
                            isLoadingMore={warehousesQuery.isFetching && warehousePage > 1}
                            isInitialLoading={warehousesQuery.isFetching && warehousePage === 1}
                            paginationError={warehousesQuery.isError ? 'Failed to load warehouses.' : ''}
                            zIndex={1150}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="taxInclusive"
                                checked={isTaxInclusive}
                                onChange={e => setIsTaxInclusive(e.target.checked)}
                                style={{ width: '1rem', height: '1rem' }}
                            />
                            <label htmlFor="taxInclusive" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>Amounts include tax</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Invoice Details</h3>
                        <div className="invoice-date-grid">
                            <Input label="Invoice Date" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        <Input
                            label="Invoice Number"
                            value={invoiceDetailsQuery.data?.number || (isEditMode ? '' : generatedInvoiceNumber)}
                            readOnly
                        />
                        <Input
                            label="Notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add invoice notes..."
                        />
                    </div>
                </div>

                <div className="invoice-lines" style={{ position: 'relative', zIndex: 20 }}>
                    <div className="invoice-lines-header">
                        <span>Item Description</span>
                        <span style={{ textAlign: 'center' }}>Qty</span>
                        <span style={{ textAlign: 'right' }}>Price</span>
                        <span>Tax Rule</span>
                        <span style={{ textAlign: 'right' }}>Total</span>
                        <span aria-hidden="true" />
                    </div>

                    <div className="invoice-lines-body">
                        {items.map((item) => (
                            <div key={item.id} className="invoice-line-row">
                                <div className="invoice-line-field invoice-line-item" data-label="Item Description">
                                    <div className="invoice-mobile-label">Item Description</div>
                                    <div style={{ minWidth: 0 }}>
                                        <SearchableSelectBackend
                                            value={item.productId}
                                            options={productOptions}
                                            searchTerm={productSearchTerm}
                                            onSearchChange={setProductSearchTerm}
                                            onChange={(nextValue, selectedProduct) => {
                                                setItems(prev => prev.map(i => i.id === item.id ? {
                                                    ...i,
                                                    productId: nextValue,
                                                    item: selectedProduct?.description || selectedProduct?.name || '',
                                                    price: selectedProduct?.price ?? i.price,
                                                    taxRuleId: selectedProduct?.taxRuleId || i.taxRuleId,
                                                } : i));
                                            }}
                                            placeholder="Search item..."
                                            emptyLabel={productsQuery.isFetching && productPage === 1 ? 'Loading items...' : 'No items found'}
                                            getOptionLabel={(option) => [
                                                option.name,
                                                option.sku ? `SKU: ${option.sku}` : '',
                                                `${toNumber(option.price).toFixed(2)}`,
                                            ].filter(Boolean).join(' - ')}
                                            getOptionValue={(option) => option.id}
                                            hasMore={productsHasMore}
                                            onLoadMore={() => setProductPage((prev) => prev + 1)}
                                            isLoadingMore={productsQuery.isFetching && productPage > 1}
                                            isInitialLoading={productsQuery.isFetching && productPage === 1}
                                            paginationError={productsQuery.isError ? 'Failed to load items.' : ''}
                                            zIndex={4000}
                                        />
                                    </div>
                                </div>
                                <div className="invoice-line-field" data-label="Qty">
                                    <div className="invoice-mobile-label">Qty</div>
                                    <div style={{ minWidth: 0 }}>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                                <div className="invoice-line-field" data-label="Price">
                                    <div className="invoice-mobile-label">Price</div>
                                    <div style={{ minWidth: 0 }}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.price}
                                            readOnly
                                            style={{ textAlign: 'right' }}
                                        />
                                    </div>
                                </div>
                                <div className="invoice-line-field invoice-line-tax" data-label="Tax Rule">
                                    <div className="invoice-mobile-label">Tax Rule</div>
                                    <div style={{ minWidth: 0 }}>
                                        <SearchableSelectBackend
                                            value={item.taxRuleId}
                                            options={taxOptions}
                                            searchTerm={taxSearchTerm}
                                            onSearchChange={setTaxSearchTerm}
                                            onChange={(nextValue) => updateItem(item.id, 'taxRuleId', nextValue)}
                                            placeholder="No tax"
                                            emptyLabel={taxRulesQuery.isFetching && taxPage === 1 ? 'Loading tax rules...' : 'No tax rules found'}
                                            getOptionLabel={(option) => `${option.name} (${toNumber(option.rate).toFixed(2)}%)`}
                                            getOptionValue={(option) => option.id}
                                            hasMore={taxHasMore}
                                            onLoadMore={() => setTaxPage((prev) => prev + 1)}
                                            isLoadingMore={taxRulesQuery.isFetching && taxPage > 1}
                                            isInitialLoading={taxRulesQuery.isFetching && taxPage === 1}
                                            paginationError={taxRulesQuery.isError ? 'Failed to load tax rules.' : ''}
                                            zIndex={3900}
                                        />
                                    </div>
                                </div>
                                <div className="invoice-line-total" data-label="Total">
                                    <div className="invoice-mobile-label">Total</div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>${item.total.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            (Tax: ${item.taxAmount.toFixed(2)})
                                        </div>
                                    </div>
                                </div>
                                <div className="invoice-line-remove">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button variant="outline" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>

                <div className="invoice-totals">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 'min(100%, 250px)', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal (Net):</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 'min(100%, 250px)', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Total Tax:</span>
                        <span>${taxTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 'min(100%, 250px)', fontSize: '1.25rem', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span>Grand Total:</span>
                        <span style={{ color: 'var(--color-primary-600)' }}>${grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="invoice-actions">
                        <Button variant="ghost" onClick={() => navigate(invoicesRoute)}>Cancel</Button>
                        <Button
                            icon={<Save size={18} />}
                            onClick={handleSubmitInvoice}
                            disabled={isSubmitDisabled}
                            isLoading={isSubmitting}
                            title={!isFormComplete ? 'Complete required invoice fields first.' : (isEditMode && !hasInvoiceChanges ? 'No invoice changes to save.' : undefined)}
                        >
                            {isEditMode ? 'Save Changes' : 'Send Invoice'}
                        </Button>
                    </div>
                </div>
            </Card>
            <style>{`
                .create-invoice-page {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    width: 100%;
                    max-width: 1000px;
                    min-width: 0;
                    margin: 0 auto;
                }

                .create-invoice-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 0;
                }

                .create-invoice-header > div {
                    min-width: 0;
                }

                .invoice-details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
                    gap: 2rem;
                    margin-bottom: 2rem;
                    min-width: 0;
                }

                .customer-select-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: end;
                    gap: 0.5rem;
                }

                .invoice-date-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
                    gap: 1rem;
                    min-width: 0;
                }

                .invoice-lines {
                    display: grid;
                    gap: 0;
                    margin-bottom: 1.5rem;
                    min-width: 0;
                    overflow-x: auto;
                    overflow-y: visible;
                    padding-bottom: 0.25rem;
                }

                .invoice-lines-header,
                .invoice-line-row {
                    display: grid;
                    grid-template-columns: minmax(0, 2fr) minmax(4.5rem, 0.6fr) minmax(6rem, 0.8fr) minmax(0, 1.2fr) minmax(6.5rem, 0.8fr) 2.5rem;
                    gap: 0.75rem;
                    align-items: center;
                    min-width: 820px;
                }

                .invoice-lines-header {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--color-border);
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .invoice-line-row {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .invoice-line-field,
                .invoice-line-total,
                .invoice-line-remove {
                    min-width: 0;
                }

                .invoice-line-total {
                    text-align: right;
                }

                .invoice-line-remove {
                    text-align: center;
                }

                .invoice-mobile-label {
                    display: none;
                    color: var(--color-text-muted);
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .invoice-totals {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.5rem;
                    min-width: 0;
                }

                .invoice-actions {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                @media (max-width: 700px) {
                    .create-invoice-page {
                        gap: 1.25rem;
                    }

                    .create-invoice-card {
                        padding: 1rem !important;
                    }

                    .create-invoice-header {
                        align-items: flex-start;
                    }

                    .create-invoice-header h1 {
                        font-size: 1.45rem !important;
                    }

                    .invoice-details-grid {
                        gap: 1.5rem;
                    }

                    .invoice-lines-header {
                        display: none;
                    }

                    .invoice-lines {
                        overflow: visible;
                        padding-bottom: 0;
                    }

                    .invoice-lines-body {
                        display: grid;
                        gap: 1rem;
                    }

                    .invoice-line-row {
                        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                        gap: 0.875rem;
                        min-width: 0;
                        padding: 1rem;
                        border: 1px solid var(--color-border);
                        border-radius: 0.75rem;
                        background: var(--color-bg-surface);
                    }

                    .invoice-line-field,
                    .invoice-line-total {
                        display: grid;
                        gap: 0.375rem;
                    }

                    .invoice-line-item,
                    .invoice-line-tax,
                    .invoice-line-total {
                        grid-column: 1 / -1;
                    }

                    .invoice-line-total {
                        grid-template-columns: 1fr auto;
                        align-items: center;
                        text-align: right;
                    }

                    .invoice-line-remove {
                        grid-column: 1 / -1;
                        text-align: right;
                    }

                    .invoice-mobile-label {
                        display: block;
                    }

                    .invoice-totals {
                        align-items: stretch;
                    }

                    .invoice-actions {
                        justify-content: stretch;
                    }

                    .invoice-actions > * {
                        flex: 1 1 10rem;
                    }
                }

                @media (max-width: 420px) {
                    .customer-select-grid,
                    .invoice-line-row {
                        grid-template-columns: minmax(0, 1fr);
                    }

                    .customer-select-grid > button {
                        width: 100% !important;
                    }

                    .invoice-line-total {
                        grid-template-columns: minmax(0, 1fr);
                        text-align: left;
                    }
                }
            `}</style>
        </div>
    );
};

export default CreateInvoice;
