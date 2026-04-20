import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import PurchaseOrderDetailsModal from '@/components/Procurement/PurchaseOrderDetailsModal';
import PurchaseOrderHeaderFilters from './PurchaseOrderHeaderFilters';
import PurchaseOrdersListTable from './PurchaseOrdersListTable';
import usePurchaseOrderListData from './usePurchaseOrderListData';

const PurchaseOrderList = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('Draft');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [viewingOrderId, setViewingOrderId] = useState(null);
    const [deletingOrder, setDeletingOrder] = useState(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const { purchaseOrdersQuery, purchaseOrders, deletePurchaseOrder } = usePurchaseOrderListData({
        filterStatus,
        debouncedSearchTerm,
    });

    const handleDeleteOrder = async () => {
        if (!deletingOrder?.id) return;

        try {
            await deletePurchaseOrder.mutateAsync(deletingOrder.id);
            toast.success('Purchase order deleted successfully.');
            setDeletingOrder(null);
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to delete purchase order.';
            toast.error(message);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <PurchaseOrderHeaderFilters
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                onSearchTermChange={setSearchTerm}
                onFilterStatusChange={setFilterStatus}
                onCreatePurchaseOrder={() => navigate('/admin/inventory/purchase-orders/new')}
            />

            <PurchaseOrdersListTable
                purchaseOrders={purchaseOrders}
                isLoading={purchaseOrdersQuery.isLoading}
                isError={purchaseOrdersQuery.isError}
                onView={setViewingOrderId}
                onEdit={(id) => navigate(`/admin/inventory/purchase-orders/${id}/edit`)}
                onDelete={setDeletingOrder}
            />

            <PurchaseOrderDetailsModal
                isOpen={Boolean(viewingOrderId)}
                orderId={viewingOrderId}
                onClose={() => setViewingOrderId(null)}
            />

            <ConfirmationModal
                isOpen={Boolean(deletingOrder)}
                title="Delete Purchase Order"
                type="danger"
                message={`Are you sure you want to delete "${deletingOrder?.number || 'this purchase order'}"? This action cannot be undone.`}
                confirmText={deletePurchaseOrder.isPending ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                onCancel={() => {
                    if (!deletePurchaseOrder.isPending) setDeletingOrder(null);
                }}
                onConfirm={handleDeleteOrder}
            />
        </div>
    );
};

export default PurchaseOrderList;
