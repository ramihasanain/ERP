import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import Spinner from '@/core/Spinner';
import { useProcurement } from '@/context/ProcurementContext';
import PurchaseOrderFormHeader from './PurchaseOrderFormHeader';
import PurchaseOrderFormCard from './PurchaseOrderFormCard';
import PurchaseOrderApprovalHistory from './PurchaseOrderApprovalHistory';
import usePurchaseOrderFormData from './usePurchaseOrderFormData';
import translateApiError from '@/utils/translateApiError';
import { defaultFormData, emptyLineItem } from './utils';

const PurchaseOrderForm = () => {
    const { t } = useTranslation(['procurement', 'common']);
    const { addPurchaseOrder, updatePurchaseOrder, purchaseOrders, submitPO, approvePO, rejectPO } = useProcurement();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { createPurchaseOrder, vendorsQuery, productsQuery } = usePurchaseOrderFormData();

    const [formData, setFormData] = useState(defaultFormData);
    const [lineItems, setLineItems] = useState([emptyLineItem]);

    useEffect(() => {
        if (!isEdit) return;
        const po = purchaseOrders.find((item) => item.id === id);
        if (!po) return;

        setFormData({
            vendorId: po.vendorId,
            date: po.date,
            expectedDate: po.expectedDate,
            notes: po.notes || '',
        });
        setLineItems(po.items);
    }, [isEdit, id, purchaseOrders]);

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;

        if (field === 'itemId') {
            const item = (productsQuery.data ?? []).find((candidate) => candidate.id === value);
            if (item) lines[index].unitCost = Number(item.unitCost ?? 0);
        }

        if (field === 'quantity' || field === 'unitCost' || field === 'itemId') {
            lines[index].totalCost = lines[index].quantity * lines[index].unitCost;
        }

        setLineItems(lines);
    };

    const addLine = () => {
        setLineItems([...lineItems, { ...emptyLineItem }]);
    };

    const removeLine = (index) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const payload = {
            vendor_id: formData.vendorId,
            order_date: formData.date,
            expected_date: formData.expectedDate,
            lines: lineItems
                .filter((line) => line.itemId)
                .map((line) => ({
                    product_id: line.itemId,
                    quantity: String(line.quantity),
                })),
        };

        if (!payload.vendor_id || !payload.order_date || !payload.expected_date) {
            toast.error(t('poForm.requiredFields'));
            return;
        }

        if (payload.lines.length === 0) {
            toast.error(t('poForm.addLineItem'));
            return;
        }

        try {
            if (isEdit) {
                const totalAmount = lineItems.reduce((acc, item) => acc + item.totalCost, 0);
                const vendorName = (vendorsQuery.data ?? []).find((vendor) => vendor.id === formData.vendorId)?.name || 'Unknown';
                updatePurchaseOrder(id, {
                    ...formData,
                    vendorName,
                    items: lineItems,
                    totalAmount,
                });
                toast.success(t('poForm.updateSuccess'));
            } else {
                await createPurchaseOrder.mutateAsync(payload);
                addPurchaseOrder({
                    ...formData,
                    items: lineItems,
                    totalAmount: lineItems.reduce((acc, item) => acc + item.totalCost, 0),
                });
                toast.success(t('poForm.createSuccess'));
            }

            navigate(`${basePath}/inventory/purchase-orders`);
        } catch (error) {
            toast.error(translateApiError(error, 'procurement:poForm.saveFailed'));
        }
    };

    const handleSubmission = () => {
        submitPO(id);
        navigate(`${basePath}/inventory/purchase-orders`);
    };

    const handleApproval = () => {
        approvePO(id);
        navigate(`${basePath}/inventory/purchase-orders`);
    };

    const handleRejection = () => {
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;
        rejectPO(id, reason);
        navigate(`${basePath}/inventory/purchase-orders`);
    };

    const po = purchaseOrders.find((item) => item.id === id);
    const status = po?.status || 'Draft';
    const isReadOnly = status !== 'Draft';
    const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <PurchaseOrderFormHeader
                isEdit={isEdit}
                totalValue={totalValue}
                onBack={() => navigate(`${basePath}/inventory/purchase-orders`)}
            />

            <PurchaseOrderFormCard
                formData={formData}
                lineItems={lineItems}
                vendors={vendorsQuery.data ?? []}
                products={productsQuery.data ?? []}
                isReadOnly={isReadOnly}
                status={status}
                isEdit={isEdit}
                onFormChange={(next) => setFormData((prev) => ({ ...prev, ...next }))}
                onLineChange={handleLineChange}
                onAddLine={addLine}
                onRemoveLine={removeLine}
                onCancel={() => navigate(`${basePath}/inventory/purchase-orders`)}
                onSubmit={handleSubmit}
                onSubmission={handleSubmission}
                onApproval={handleApproval}
                onRejection={handleRejection}
            />

            {isEdit && <PurchaseOrderApprovalHistory approvalLog={po?.approvalLog} />}

            {(vendorsQuery.isLoading || productsQuery.isLoading || createPurchaseOrder.isPending) && (
                <div style={{ marginTop: '1rem' }}>
                    <Spinner />
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderForm;
