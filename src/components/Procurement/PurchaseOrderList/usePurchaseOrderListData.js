import { useMemo } from 'react';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomRemove } from '@/hooks/useMutation';
import { normalizePurchaseOrdersResponse, STATUS_UI_TO_API_MAP } from './utils';

const usePurchaseOrderListData = ({ filterStatus, debouncedSearchTerm }) => {
    const purchaseOrdersUrl = useMemo(() => {
        const queryParams = new URLSearchParams();
        const normalizedSearch = debouncedSearchTerm.trim();
        const status = STATUS_UI_TO_API_MAP[filterStatus];

        if (status) queryParams.set('status', status);
        queryParams.set('vendor', '');
        if (normalizedSearch) queryParams.set('search', normalizedSearch);
        queryParams.set('date_from', '');
        queryParams.set('date_to', '');

        return `/api/purchasing/purchase-orders/?${queryParams.toString()}`;
    }, [debouncedSearchTerm, filterStatus]);

    const purchaseOrdersQuery = useCustomQuery(
        purchaseOrdersUrl,
        ['purchasing-purchase-orders', filterStatus, debouncedSearchTerm],
        {
            select: normalizePurchaseOrdersResponse,
        }
    );

    const deletePurchaseOrder = useCustomRemove(
        (id) => `/api/purchasing/purchase-orders/${id}/delete/`,
        ['purchasing-purchase-orders']
    );

    return {
        purchaseOrdersQuery,
        purchaseOrders: purchaseOrdersQuery.data ?? [],
        deletePurchaseOrder,
    };
};

export default usePurchaseOrderListData;
