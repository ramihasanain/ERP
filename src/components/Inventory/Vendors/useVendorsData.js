import { useMemo } from 'react';
import { toast } from 'sonner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { normalizeVendorsResponse } from './utils';

const buildVendorsQueryUrl = ({ searchTerm, statusFilter }) => {
    const queryParams = new URLSearchParams();
    const normalizedSearch = searchTerm?.trim();

    if (normalizedSearch) {
        queryParams.set('name', normalizedSearch);
    }

    if (statusFilter === 'Active') {
        queryParams.set('is_active', 'true');
    } else if (statusFilter === 'Inactive') {
        queryParams.set('is_active', 'false');
    }

    const queryString = queryParams.toString();
    return queryString ? `/api/purchasing/vendors/?${queryString}` : '/api/purchasing/vendors/';
};

const useVendorsData = ({ searchTerm, statusFilter }) => {
    const vendorsUrl = buildVendorsQueryUrl({ searchTerm, statusFilter });
    const vendorsQuery = useCustomQuery(vendorsUrl, ['purchasing-vendors', searchTerm, statusFilter], {
        select: normalizeVendorsResponse,
    });

    const createVendor = useCustomPost('/api/purchasing/vendors/create/', ['purchasing-vendors']);
    const updateVendor = useCustomPut(
        (data) => `/api/purchasing/vendors/${data.id}/`,
        ['purchasing-vendors', 'purchasing-vendor-detail']
    );
    const deleteVendor = useCustomRemove(
        (id) => `/api/purchasing/vendors/${id}/delete/`,
        ['purchasing-vendors', 'purchasing-vendor-detail']
    );

    const vendors = useMemo(() => vendorsQuery.data?.vendors ?? [], [vendorsQuery.data]);
    const totalCount = useMemo(() => vendorsQuery.data?.count ?? 0, [vendorsQuery.data]);

    const refreshVendors = async () => {
        try {
            await vendorsQuery.refetch();
            toast.success('Vendors refreshed.');
        } catch {
            toast.error('Refresh failed. Please try again.');
        }
    };

    return {
        vendors,
        totalCount,
        vendorsQuery,
        createVendor,
        updateVendor,
        deleteVendor,
        refreshVendors,
    };
};

export default useVendorsData;
