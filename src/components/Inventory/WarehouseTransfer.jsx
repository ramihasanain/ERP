import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import translateApiError from '@/utils/translateApiError';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    return [];
};

const WarehouseTransfer = () => {
    const { t } = useTranslation(['inventory', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const createTransaction = useCustomPost('/api/inventory/transactions/create/', [['inventory-transactions']]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        fromWarehouseId: '',
        toWarehouseId: '',
        notes: '',
    });
    const warehousesQuery = useCustomQuery('/api/inventory/warehouses/', ['inventory-warehouses-transfer'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .map((warehouse) => ({ id: warehouse?.id || '', name: warehouse?.name || 'Unnamed Warehouse' }))
                .filter((warehouse) => warehouse.id),
    });
    const warehouseProductsQuery = useCustomQuery(
        `/api/inventory/warehouses/${formData.fromWarehouseId || ''}/products/`,
        ['inventory-warehouse-products-transfer', formData.fromWarehouseId || 'none'],
        {
            enabled: Boolean(formData.fromWarehouseId),
            select: (response) =>
                normalizeArrayResponse(response)
                    .map((product) => ({
                        productId: product?.id || '',
                        itemName: product?.name || product?.item_name || 'Unnamed Product',
                        description: product?.name || product?.item_name || 'Transfer line',
                        availableQuantity:
                            Number.parseFloat(product?.stock_in_warehouse ?? product?.quantity ?? 0) || 0,
                        quantity: '',
                    }))
                    .filter((product) => product.productId),
        }
    );

    const [lineItems, setLineItems] = useState([]);
    const warehouseOptions = warehousesQuery.data ?? [];

    useEffect(() => {
        if (!formData.fromWarehouseId) {
            setLineItems([]);
            return;
        }

        if (warehouseProductsQuery.data) {
            setLineItems(warehouseProductsQuery.data);
        }
    }, [formData.fromWarehouseId, warehouseProductsQuery.data]);

    const sourceWarehouseLabel = useMemo(
        () => warehouseOptions.find((warehouse) => warehouse.id === formData.fromWarehouseId)?.name || 'Source Warehouse',
        [warehouseOptions, formData.fromWarehouseId]
    );

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;
        setLineItems(lines);
    };

    const handleSubmit = async () => {
        if (!isTransferReady) {
            toast.error(t('warehouseTransfer.completeFields'));
            return;
        }

        if (formData.fromWarehouseId === formData.toWarehouseId) {
            toast.error(t('warehouseTransfer.sameWarehouse'));
            return;
        }
        if (hasInvalidLines) {
            toast.error(t('warehouseTransfer.exceedsStock'));
            return;
        }

        const payload = {
            date: formData.date,
            type: 'transfer',
            warehouse_id: formData.fromWarehouseId,
            destination_warehouse_id: formData.toWarehouseId,
            notes: formData.notes,
            lines: lineItems
                .filter((line) => {
                    const qty = Number.parseFloat(line.quantity);
                    return line.productId && qty > 0 && qty <= Number(line.availableQuantity || 0);
                })
                .map((line) => ({
                    product_id: line.productId,
                    description: line.description || 'Transfer line',
                    quantity: String(line.quantity),
                })),
        };

        try {
            await createTransaction.mutateAsync(payload);
            toast.success(t('warehouseTransfer.success'));
            navigate(`${basePath}/inventory/transactions`);
        } catch (error) {
            toast.error(translateApiError(error, 'inventory:warehouseTransfer.failed'));
        }
    };

    const hasValidLines =
        lineItems.length > 0 &&
        lineItems.some((line) => {
            const qty = Number.parseFloat(line.quantity);
            return line.productId && qty > 0 && qty <= Number(line.availableQuantity || 0);
        });
    const hasInvalidLines = lineItems.some((line) => {
        const qty = Number.parseFloat(line.quantity);
        if (!Number.isFinite(qty) || qty <= 0) return false;
        return qty > Number(line.availableQuantity || 0);
    });
    const isTransferReady = Boolean(
        formData.date &&
            formData.fromWarehouseId &&
            formData.toWarehouseId &&
            formData.fromWarehouseId !== formData.toWarehouseId &&
            hasValidLines &&
            !hasInvalidLines
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Warehouse Transfer</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>From Warehouse</label>
                        <select
                            value={formData.fromWarehouseId}
                            onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                            style={compactSelectStyle}
                        >
                            <option value="">Select Source</option>
                            {warehouseOptions.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>To Warehouse</label>
                        <select
                            value={formData.toWarehouseId}
                            onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                            style={compactSelectStyle}
                        >
                            <option value="">Select Destination</option>
                            {warehouseOptions.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            style={{ ...inputStyle, width: '100%', minHeight: '40px' }}
                            placeholder="Move stock to branch"
                        />
                    </div>
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Description</th>
                            <th style={thStyle}>Available Qty</th>
                            <th style={thStyle}>Transfer Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!formData.fromWarehouseId ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>Select a source warehouse to load available products.</td>
                            </tr>
                        ) : warehouseProductsQuery.isPending ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>Loading warehouse products...</td>
                            </tr>
                        ) : lineItems.length === 0 ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>No products found in this warehouse.</td>
                            </tr>
                        ) : (
                        lineItems.map((line, index) => (
                            <tr key={line.productId || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>{line.itemName || line.productId}</td>
                                <td style={tdStyle}>
                                    <input
                                        type="text"
                                        value={line.description}
                                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                        style={{ ...inputStyle, width: '100%' }}
                                        placeholder="Line description"
                                    />
                                </td>
                                <td style={tdStyle}>{line.availableQuantity}</td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                        style={{ ...inputStyle, width: '120px' }}
                                        min="0.01"
                                        step="0.01"
                                        max={line.availableQuantity}
                                    />
                                </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        Transfer from {sourceWarehouseLabel}
                    </p>
                    <Button
                        variant="primary"
                        icon={<Save size={16} />}
                        onClick={handleSubmit}
                        disabled={!isTransferReady || createTransaction.isPending}
                    >
                        {createTransaction.isPending ? 'Processing...' : 'Transfer Stock'}
                    </Button>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                    <Button variant="outline" onClick={() => navigate(`${basePath}/inventory/transactions`)}>{t('actions.cancel', { ns: 'common' })}</Button>
                </div>
            </Card>
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-primary)' };
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };
const compactSelectStyle = { ...inputStyle, padding: '0.42rem 0.6rem' };
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

export default WarehouseTransfer;
