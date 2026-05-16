import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import PurchaseOrderDetailsModal from '@/components/Procurement/PurchaseOrderDetailsModal';
import PurchaseOrderHeaderFilters from './PurchaseOrderHeaderFilters';
import PurchaseOrdersListTable from './PurchaseOrdersListTable';
import usePurchaseOrderListData from './usePurchaseOrderListData';
import translateApiError from '@/utils/translateApiError';

const PurchaseOrderList = () => {
    const { t } = useTranslation(['procurement', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
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

    const { purchaseOrdersQuery, purchaseOrders, deletePurchaseOrder, setPurchaseOrderStatus } = usePurchaseOrderListData({
        filterStatus,
        debouncedSearchTerm,
    });

    const handleDeleteOrder = async () => {
        if (!deletingOrder?.id) return;

        try {
            await deletePurchaseOrder.mutateAsync(deletingOrder.id);
            toast.success(t('poList.deleteSuccess'));
            setDeletingOrder(null);
        } catch (error) {
            toast.error(translateApiError(error, 'procurement:poList.deleteFailed'));
        }
    };

    const handleSetStatus = async (id, status) => {
        if (!id) return;

        try {
            await setPurchaseOrderStatus.mutateAsync({ id, status });
            toast.success(t('poList.statusSuccess', { status }));
        } catch (error) {
            toast.error(translateApiError(error, 'procurement:poList.statusFailed'));
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <PurchaseOrderHeaderFilters
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                onSearchTermChange={setSearchTerm}
                onFilterStatusChange={setFilterStatus}
                onCreatePurchaseOrder={() => navigate(`${basePath}/inventory/purchase-orders/new`)}
            />

            <PurchaseOrdersListTable
                purchaseOrders={purchaseOrders}
                isLoading={purchaseOrdersQuery.isLoading}
                isError={purchaseOrdersQuery.isError}
                onView={setViewingOrderId}
                onEdit={(id) => navigate(`${basePath}/inventory/purchase-orders/${id}/edit`)}
                onDelete={setDeletingOrder}
                onApprove={(id) => handleSetStatus(id, 'approved')}
                onReject={(id) => handleSetStatus(id, 'rejected')}
                isStatusUpdating={setPurchaseOrderStatus.isPending}
            />

            <PurchaseOrderDetailsModal
                isOpen={Boolean(viewingOrderId)}
                orderId={viewingOrderId}
                onClose={() => setViewingOrderId(null)}
            />

            <ConfirmationModal
                isOpen={Boolean(deletingOrder)}
                title={t('poList.deleteTitle')}
                type="danger"
                message={t('poList.deleteMessage', { name: deletingOrder?.number || t('poList.deleteFallbackName') })}
                confirmText={deletePurchaseOrder.isPending ? t('poList.deleting') : t('common:actions.delete')}
                cancelText={t('common:actions.cancel')}
                onCancel={() => {
                    if (!deletePurchaseOrder.isPending) setDeletingOrder(null);
                }}
                onConfirm={handleDeleteOrder}
            />
        </div>
    );
};

export default PurchaseOrderList;
