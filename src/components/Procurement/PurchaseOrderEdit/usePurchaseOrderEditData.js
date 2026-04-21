import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch, useCustomPut } from '@/hooks/useMutation';
import { normalizeArrayResponse, normalizeOrderDetails, normalizeProduct, normalizeVendor } from './utils';

const usePurchaseOrderEditData = ({ id }) => {
    const orderQuery = useCustomQuery(
        id ? `/api/purchasing/purchase-orders/${id}/` : '/api/purchasing/purchase-orders/',
        ['purchasing-purchase-order-edit-details', id],
        {
            enabled: Boolean(id),
            select: normalizeOrderDetails,
        }
    );

    const vendorsQuery = useCustomQuery('/api/purchasing/vendors/', ['purchasing-vendors-for-po-edit'], {
        select: (response) => normalizeArrayResponse(response).map(normalizeVendor).filter((vendor) => vendor.id),
    });

    const productsQuery = useCustomQuery('/api/inventory/products/', ['inventory-products-for-po-edit'], {
        select: (response) => normalizeArrayResponse(response).map(normalizeProduct).filter((product) => product.id),
    });

    const updatePurchaseOrder = useCustomPut(
        () => `/api/purchasing/purchase-orders/${id}/`,
        [['purchasing-purchase-orders'], ['purchasing-purchase-order-edit-details', id]]
    );
    const updatePurchaseOrderStatus = useCustomPatch(
        `/api/purchasing/purchase-orders/${id}/`,
        [['purchasing-purchase-orders'], ['purchasing-purchase-order-edit-details', id]]
    );

    return {
        orderQuery,
        vendorsQuery,
        productsQuery,
        updatePurchaseOrder,
        updatePurchaseOrderStatus,
    };
};

export default usePurchaseOrderEditData;
