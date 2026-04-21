import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import PurchaseOrderEditHeader from './PurchaseOrderEditHeader';
import PurchaseOrderEditFormCard from './PurchaseOrderEditFormCard';
import usePurchaseOrderEditData from './usePurchaseOrderEditData';
import { emptyLine } from './utils';

const PurchaseOrderEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [vendorId, setVendorId] = useState('');
    const [orderDate, setOrderDate] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [currency, setCurrency] = useState('JOD');
    const [lines, setLines] = useState([emptyLine()]);

    const { orderQuery, vendorsQuery, productsQuery, updatePurchaseOrder, updatePurchaseOrderStatus } = usePurchaseOrderEditData({ id });

    useEffect(() => {
        if (!orderQuery.data) return;

        setVendorId(orderQuery.data.vendorId);
        setOrderDate(orderQuery.data.orderDate);
        setExpectedDate(orderQuery.data.expectedDate);
        setCurrency(orderQuery.data.currency);
        setLines(orderQuery.data.lines.length > 0 ? orderQuery.data.lines : [emptyLine()]);
    }, [orderQuery.data]);

    const productsById = useMemo(() => {
        const map = new Map();
        for (const product of productsQuery.data ?? []) {
            map.set(product.id, product);
        }
        return map;
    }, [productsQuery.data]);

    const totalAmount = useMemo(
        () => lines.reduce((sum, line) => sum + Number(line.totalCost || 0), 0),
        [lines]
    );

    const handleLineChange = (index, field, value) => {
        setLines((currentLines) => {
            const nextLines = [...currentLines];
            const targetLine = { ...nextLines[index] };

            if (field === 'productId') {
                const selectedProduct = productsById.get(value);
                targetLine.productId = value;
                targetLine.unitPrice = Number(selectedProduct?.unitPrice ?? 0);
            } else if (field === 'quantity') {
                targetLine.quantity = Math.max(1, Number(value || 1));
            } else {
                targetLine[field] = value;
            }

            targetLine.totalCost = Number(targetLine.quantity || 0) * Number(targetLine.unitPrice || 0);
            nextLines[index] = targetLine;
            return nextLines;
        });
    };

    const addLine = () => setLines((current) => [...current, emptyLine()]);
    const removeLine = (index) =>
        setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));

    const handleSave = async () => {
        const payload = {
            vendor_id: vendorId,
            order_date: orderDate,
            expected_date: expectedDate,
            lines: lines
                .filter((line) => line.productId)
                .map((line) => ({
                    product_id: line.productId,
                    quantity: String(line.quantity),
                })),
        };

        if (!payload.vendor_id || !payload.order_date || !payload.expected_date) {
            toast.error('Vendor, order date, and expected date are required.');
            return;
        }

        if (payload.lines.length === 0) {
            toast.error('Please add at least one line item.');
            return;
        }

        try {
            await updatePurchaseOrder.mutateAsync(payload);
            toast.success('Purchase order updated successfully.');
            navigate('/admin/inventory/purchase-orders');
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to update purchase order.';
            toast.error(message);
        }
    };
    const handleMarkPendingApproval = async () => {
        try {
            await updatePurchaseOrderStatus.mutateAsync({ status: 'pending_approval' });
            toast.success('Purchase order marked as pending approval.');
            navigate('/admin/inventory/purchase-orders');
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to update purchase order status.';
            toast.error(message);
        }
    };

    const isLoading = orderQuery.isLoading || vendorsQuery.isLoading || productsQuery.isLoading;
    const hasError = orderQuery.isError || vendorsQuery.isError || productsQuery.isError;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <PurchaseOrderEditHeader
                orderNumber={orderQuery.data?.number}
                totalAmount={totalAmount}
                currency={currency}
                onBack={() => navigate('/admin/inventory/purchase-orders')}
            />

            {isLoading && (
                <Card className="padding-md">
                    <Spinner />
                </Card>
            )}

            {hasError && !isLoading && (
                <Card className="padding-md">
                    <p style={{ margin: 0, color: 'var(--color-error)' }}>
                        Failed to load purchase order edit data.
                    </p>
                </Card>
            )}

            {!isLoading && !hasError && (
                <PurchaseOrderEditFormCard
                    vendorId={vendorId}
                    orderDate={orderDate}
                    expectedDate={expectedDate}
                    vendors={vendorsQuery.data ?? []}
                    products={productsQuery.data ?? []}
                    lines={lines}
                    currency={currency}
                    isSaving={updatePurchaseOrder.isPending}
                    onVendorChange={setVendorId}
                    onOrderDateChange={setOrderDate}
                    onExpectedDateChange={setExpectedDate}
                    onLineChange={handleLineChange}
                    onAddLine={addLine}
                    onRemoveLine={removeLine}
                    onCancel={() => navigate('/admin/inventory/purchase-orders')}
                    onSave={handleSave}
                    onMarkPendingApproval={handleMarkPendingApproval}
                    isStatusUpdating={updatePurchaseOrderStatus.isPending}
                />
            )}
        </div>
    );
};

export default PurchaseOrderEdit;
