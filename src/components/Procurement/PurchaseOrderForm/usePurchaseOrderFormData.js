import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { normalizeProductsResponse, normalizeVendorsResponse } from './utils';

const usePurchaseOrderFormData = () => {
    const createPurchaseOrder = useCustomPost('/api/purchasing/purchase-orders/create/', [['purchasing-purchase-orders']]);

    const vendorsQuery = useCustomQuery('/api/purchasing/vendors/?detail=min', ['purchasing-vendors-min-po-form'], {
        select: normalizeVendorsResponse,
    });

    const productsQuery = useCustomQuery('/api/inventory/products/', ['inventory-products-po-form'], {
        select: normalizeProductsResponse,
    });

    return {
        createPurchaseOrder,
        vendorsQuery,
        productsQuery,
    };
};

export default usePurchaseOrderFormData;
