import React, { useEffect, useState } from 'react';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
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

const GoodsReceipt = () => {
    const { addEntry } = useAccounting();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const createTransaction = useCustomPost('/api/inventory/transactions/create/', [['inventory-transactions']]);
    const warehousesQuery = useCustomQuery('/api/inventory/warehouses/', ['inventory-warehouses-grn'], {
        select: (response) =>
            normalizeArrayResponse(response)
                .map((warehouse) => ({ id: warehouse?.id || '', name: warehouse?.name || 'Unnamed Warehouse' }))
                .filter((warehouse) => warehouse.id),
    });
    const approvedPurchaseOrdersQuery = useCustomQuery(
        '/api/purchasing/purchase-orders/?status=approved&vendor=&date_from=&date_to=',
        ['purchasing-approved-purchase-orders-grn'],
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
                    reference:
                        purchaseOrder?.reference ||
                        purchaseOrder?.reference_number ||
                        purchaseOrder?.po_number ||
                        purchaseOrder?.id ||
                        '',
                    purchaseOrderId: purchaseOrder?.id || '',
                    notes:
                        purchaseOrder?.notes ||
                        `Received against ${
                            purchaseOrder?.number ||
                            purchaseOrder?.reference_number ||
                            purchaseOrder?.po_number ||
                            ''
                        }`,
                    items:
                        (Array.isArray(purchaseOrder?.items) && purchaseOrder.items) ||
                        (Array.isArray(purchaseOrder?.line_items) && purchaseOrder.line_items) ||
                        [],
                })),
        }
    );

    const [formData, setFormData] = useState({
        reference: '',
        date: new Date().toISOString().split('T')[0],
        warehouseId: '',
        notes: '',
        poId: '' // Link to PO
    });

    const purchaseOrderDetailsQuery = useCustomQuery(
        `/api/purchasing/purchase-orders/${formData.poId || ''}/`,
        ['purchasing-purchase-order-details-grn', formData.poId || 'none'],
        {
            enabled: Boolean(formData.poId),
            select: (response) => {
                const purchaseOrder = response?.data ?? response ?? {};
                return {
                    number:
                        purchaseOrder?.number ||
                        purchaseOrder?.reference_number ||
                        purchaseOrder?.po_number ||
                        '',
                    notes: purchaseOrder?.notes || '',
                    lines: Array.isArray(purchaseOrder?.lines) ? purchaseOrder.lines : [],
                };
            },
        }
    );

    const [lineItems, setLineItems] = useState([]);
    const warehouseOptions = warehousesQuery.data ?? [];
    const approvedPurchaseOrders = approvedPurchaseOrdersQuery.data ?? [];

    useEffect(() => {
        if (!formData.poId || !purchaseOrderDetailsQuery.data) return;
        const poDetails = purchaseOrderDetailsQuery.data;
        const mappedItems = poDetails.lines
            .map((item) => {
                const productId = item?.product_id || item?.item_id || item?.itemId || item?.product?.id || '';
                const quantity = Number.parseFloat(item?.quantity ?? 1) || 1;
                const unitCost = Number.parseFloat(item?.unit_price ?? item?.unit_cost ?? item?.unitCost ?? 0) || 0;
                const totalCost = Number.parseFloat(item?.total_cost ?? quantity * unitCost) || quantity * unitCost;
                return {
                    itemId: productId,
                    itemName: item?.product_name || item?.item_name || item?.product?.name || 'Unknown Item',
                    quantity,
                    unitCost,
                    totalCost,
                };
            })
            .filter((item) => item.itemId);

        setFormData((prev) => ({
            ...prev,
            reference: poDetails.number || prev.reference,
            notes: poDetails.notes || `Received against ${poDetails.number || prev.reference}`,
        }));
        setLineItems(mappedItems);
    }, [formData.poId, purchaseOrderDetailsQuery.data]);

    const handlePOSelection = (e) => {
        const selectedPurchaseOrderId = e.target.value;
        const selectedPurchaseOrder = approvedPurchaseOrders.find(
            (purchaseOrder) => purchaseOrder.purchaseOrderId === selectedPurchaseOrderId
        );

        if (selectedPurchaseOrder) {
            setFormData(prev => ({
                ...prev,
                poId: selectedPurchaseOrder.purchaseOrderId,
                reference: selectedPurchaseOrder.number,
                notes: selectedPurchaseOrder.notes || `Received against ${selectedPurchaseOrder.number}`
            }));
            setLineItems([]);
        } else {
            setFormData(prev => ({ ...prev, poId: '', reference: '', notes: '' }));
            setLineItems([]);
        }
    };

    const handleSubmit = async () => {
        if (!isReceiptReady) {
            toast.error('Please complete all required fields before processing the receipt.');
            return;
        }

        const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

        const transactionPayload = {
            type: 'goods_receipt',
            date: formData.date,
            warehouse_id: formData.warehouseId,
            purchase_order_id: formData.poId || null,
        };

        try {
            await createTransaction.mutateAsync(transactionPayload);

            // Keep existing accounting/PO side effects.
            const journalEntry = {
                date: formData.date,
                reference: formData.reference,
                description: `Goods Receipt - ${formData.reference}`,
                status: 'Posted',
                sourceType: 'Inventory',
                isAutomatic: true,
                lines: [
                    {
                        id: 1,
                        account: '1200',
                        description: 'Inventory Asset',
                        debit: totalValue,
                        credit: 0
                    },
                    {
                        id: 2,
                        account: '2105',
                        description: `Goods Received Not Invoiced - ${formData.poId || 'Direct'}`,
                        debit: 0,
                        credit: totalValue
                    }
                ]
            };

            addEntry(journalEntry);

            toast.success('Goods receipt transaction created successfully.');
            navigate(`${basePath}/inventory/transactions`);
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to create goods receipt transaction.');
            toast.error(message);
        }
    };

    const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);
    const isPurchaseOrderSelected = Boolean(formData.poId);
    const hasValidLineItems =
        lineItems.length > 0 &&
        lineItems.every(
            (item) =>
                item.itemId &&
                Number.parseFloat(item.quantity) > 0 &&
                Number.parseFloat(item.unitCost) >= 0 &&
                Number.parseFloat(item.totalCost) >= 0
        );
    const isReceiptReady = Boolean(formData.reference.trim() && formData.date && formData.warehouseId && hasValidLineItems);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Goods Receipt (GRN)</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Load from Purchase Order</label>
                        <select
                            value={formData.poId}
                            onChange={handlePOSelection}
                            style={compactSelectStyle}
                        >
                            <option value="">Select Approved PO...</option>
                            {approvedPurchaseOrders.map((purchaseOrder) => (
                                <option key={purchaseOrder.id || purchaseOrder.purchaseOrderId} value={purchaseOrder.purchaseOrderId}>
                                    {`${purchaseOrder.number} - ${purchaseOrder.vendorName}`}
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            Selecting a PO will auto-fill items and link the transaction.
                        </p>
                    </div>
                    <div>
                        <label style={labelStyle}>Reference No.</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            style={inputStyle}
                            placeholder="e.g. GRN-001"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Warehouse</label>
                        <select
                            value={formData.warehouseId}
                            onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
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
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        style={{ ...inputStyle, width: '100%', minHeight: '60px' }}
                    />
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Unit Cost</th>
                            <th style={thStyle}>Total Cost</th>
                            <th style={thStyle}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isPurchaseOrderSelected ? (
                            <tr>
                                <td style={tdStyle} colSpan={5}>Please select a purchase order first.</td>
                            </tr>
                        ) : purchaseOrderDetailsQuery.isPending ? (
                            <tr>
                                <td style={tdStyle} colSpan={5}>Loading purchase-order items...</td>
                            </tr>
                        ) : lineItems.length === 0 ? (
                            <tr>
                                <td style={tdStyle} colSpan={5}>No items loaded. Select a purchase order to load items.</td>
                            </tr>
                        ) : lineItems.map((line, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <span style={{ fontWeight: 500 }}>{line.itemName || line.itemId}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span>{line.quantity}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ display: 'inline-block', minWidth: '100px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                        {Number(line.unitCost || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>
                                    {line.totalCost.toFixed(2)}
                                </td>
                                <td style={tdStyle}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        Total Value: {totalValue.toLocaleString()} JOD
                    </div>
                    <Button
                        variant="primary"
                        icon={<Save size={16} />}
                        onClick={handleSubmit}
                        disabled={!isReceiptReady || createTransaction.isPending}
                    >
                        {createTransaction.isPending ? 'Processing...' : 'Process Receipt'}
                    </Button>
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

export default GoodsReceipt;
