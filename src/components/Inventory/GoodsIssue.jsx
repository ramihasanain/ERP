import React, { useEffect, useState } from 'react';
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

const collectNestedMessages = (value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap((item) => collectNestedMessages(item));
    if (value && typeof value === 'object') return Object.values(value).flatMap((item) => collectNestedMessages(item));
    return [];
};

const GoodsIssue = () => {
    const { t } = useTranslation(['inventory', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const createTransaction = useCustomPost('/api/inventory/transactions/create/', [['inventory-transactions']]);
    const warehousesQuery = useCustomQuery('/api/inventory/warehouses/', ['inventory-warehouses-issue'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .map((warehouse) => ({ id: warehouse?.id || '', name: warehouse?.name || 'Unnamed Warehouse' }))
                .filter((warehouse) => warehouse.id),
    });
    const approvedPurchaseOrdersQuery = useCustomQuery(
        '/api/purchasing/purchase-orders/?status=approved&vendor=&date_from=&date_to=',
        ['purchasing-approved-purchase-orders-issue'],
        {
            select: (response) =>
                normalizeArrayResponse(response).map((purchaseOrder) => ({
                    id: purchaseOrder?.id || '',
                    number:
                        purchaseOrder?.number ||
                        purchaseOrder?.reference_number ||
                        purchaseOrder?.po_number ||
                        purchaseOrder?.id ||
                        '',
                    vendorName: purchaseOrder?.vendor_name || purchaseOrder?.vendor?.name || 'Unknown Vendor',
                    purchaseOrderId: purchaseOrder?.id || '',
                })),
        }
    );

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        warehouseId: '',
        purchaseOrderId: '',
        notes: 'Issue for job/consumption',
    });
    const [lineItems, setLineItems] = useState([]);

    const purchaseOrderDetailsQuery = useCustomQuery(
        `/api/purchasing/purchase-orders/${formData.purchaseOrderId || ''}/`,
        ['purchasing-purchase-order-details-issue', formData.purchaseOrderId || 'none'],
        {
            enabled: Boolean(formData.purchaseOrderId),
            select: (response) => {
                const purchaseOrder = response?.data ?? response ?? {};
                const rawLines =
                    (Array.isArray(purchaseOrder?.lines) && purchaseOrder.lines) ||
                    (Array.isArray(purchaseOrder?.items) && purchaseOrder.items) ||
                    (Array.isArray(purchaseOrder?.line_items) && purchaseOrder.line_items) ||
                    [];

                return rawLines.map((item) => {
                    const quantity = Number.parseFloat(item?.quantity ?? item?.qty ?? 0) || 0;
                    const unitCost = Number.parseFloat(item?.unit_price ?? item?.unit_cost ?? item?.unitCost ?? 0) || 0;
                    return {
                        productId: item?.product_id || item?.item_id || item?.product?.id || '',
                        itemName: item?.product_name || item?.item_name || item?.product?.name || 'Unknown Item',
                        quantity,
                        unitCost,
                        totalCost: Number.parseFloat(item?.total_cost ?? quantity * unitCost) || quantity * unitCost,
                    };
                });
            },
        }
    );

    const warehouseOptions = warehousesQuery.data ?? [];
    const approvedPurchaseOrders = approvedPurchaseOrdersQuery.data ?? [];

    useEffect(() => {
        if (!formData.purchaseOrderId) {
            setLineItems([]);
            return;
        }

        if (purchaseOrderDetailsQuery.data) {
            setLineItems(purchaseOrderDetailsQuery.data);
        }
    }, [formData.purchaseOrderId, purchaseOrderDetailsQuery.data]);

    const handleSubmit = async () => {
        if (!isIssueReady) {
            toast.error(t('goodsIssue.completeFields'));
            return;
        }

        const payload = {
            type: 'goods_issue',
            warehouse_id: formData.warehouseId,
            notes: formData.notes,
            lines: lineItems
                .filter((line) => line.productId && Number.parseFloat(line.quantity) > 0)
                .map((line) => ({
                    product_id: line.productId,
                    description: line.itemName || 'Issue line',
                    quantity: String(line.quantity),
                })),
        };

        try {
            await createTransaction.mutateAsync(payload);
            toast.success(t('goodsIssue.success'));
            navigate(`${basePath}/inventory/transactions`);
        } catch (error) {
            const errorData = error?.response?.data;
            const lineMessages = collectNestedMessages(errorData?.lines);
            if (lineMessages.length > 0) {
                toast.error(lineMessages.join('\n'));
                return;
            }
            toast.error(translateApiError(error, 'inventory:goodsIssue.failed'));
        }
    };

    const hasValidLines =
        lineItems.length > 0 &&
        lineItems.every((line) => line.productId && Number.parseFloat(line.quantity) > 0);
    const isIssueReady = Boolean(formData.warehouseId && formData.purchaseOrderId && hasValidLines);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Goods Issue</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
                        <label style={labelStyle}>Issuing Warehouse</label>
                        <select
                            value={formData.warehouseId}
                            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                            style={compactSelectStyle}
                        >
                            <option value="">Select Warehouse</option>
                            {warehouseOptions.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Purchase Order</label>
                    <select
                        value={formData.purchaseOrderId}
                        onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
                        style={compactSelectStyle}
                    >
                        <option value="">Select Approved PO...</option>
                        {approvedPurchaseOrders.map((purchaseOrder) => (
                            <option key={purchaseOrder.id || purchaseOrder.purchaseOrderId} value={purchaseOrder.purchaseOrderId}>
                                {`${purchaseOrder.number} - ${purchaseOrder.vendorName}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{ ...inputStyle, width: '100%', minHeight: '60px' }}
                        placeholder="Issue for job/consumption"
                    />
                </div>
            </Card>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Unit Cost</th>
                            <th style={thStyle}>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!formData.purchaseOrderId ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>Select a purchase order to load items.</td>
                            </tr>
                        ) : purchaseOrderDetailsQuery.isPending ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>Loading purchase-order items...</td>
                            </tr>
                        ) : lineItems.length === 0 ? (
                            <tr>
                                <td style={tdStyle} colSpan={4}>No items found in this purchase order.</td>
                            </tr>
                        ) : (
                            lineItems.map((line, index) => (
                                <tr key={line.productId || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={tdStyle}>{line.itemName || line.productId}</td>
                                    <td style={tdStyle}>{line.quantity}</td>
                                    <td style={tdStyle}>{Number(line.unitCost || 0).toFixed(2)}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{Number(line.totalCost || 0).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            <Card className="padding-md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        This action will create an inventory transaction using the selected purchase order.
                    </p>
                    <Button
                        variant="primary"
                        icon={<Save size={16} />}
                        onClick={handleSubmit}
                        disabled={!isIssueReady || createTransaction.isPending}
                    >
                        {createTransaction.isPending ? 'Processing...' : 'Post Issue'}
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

export default GoodsIssue;
