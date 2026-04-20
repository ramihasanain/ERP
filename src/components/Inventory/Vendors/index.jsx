import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import useVendorsData from './useVendorsData';
import VendorsHeaderFilters from './VendorsHeaderFilters';
import VendorsList from './VendorsList';
import VendorFormModal from './VendorFormModal';
import VendorDetailsModal from './VendorDetailsModal';
import { normalizeVendor, vendorDefaultValues } from './utils';

const formatApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;
    if (!data) return fallbackMessage;

    if (typeof data?.detail === 'string' && data.detail.trim()) {
        return data.detail;
    }

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstValue = firstKey ? data[firstKey] : null;

        if (Array.isArray(firstValue) && firstValue.length > 0) {
            return `${firstKey}: ${String(firstValue[0])}`;
        }

        if (typeof firstValue === 'string' && firstValue.trim()) {
            return `${firstKey}: ${firstValue}`;
        }
    }

    return fallbackMessage;
};

const Vendors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editingVendorId, setEditingVendorId] = useState(null);
    const [viewingVendorId, setViewingVendorId] = useState(null);

    const { vendors, totalCount, vendorsQuery, createVendor, updateVendor, deleteVendor, refreshVendors } = useVendorsData({
        searchTerm,
        statusFilter,
    });

    const editVendorDetailsQuery = useCustomQuery(
        editingVendorId ? `/api/purchasing/vendors/${editingVendorId}/` : '/api/purchasing/vendors/',
        ['purchasing-vendor-detail', editingVendorId],
        {
            enabled: Boolean(editingVendorId && isFormOpen),
            select: normalizeVendor,
        }
    );
    const viewVendorDetailsQuery = useCustomQuery(
        viewingVendorId ? `/api/purchasing/vendors/${viewingVendorId}/` : '/api/purchasing/vendors/',
        ['purchasing-vendor-view-detail', viewingVendorId],
        {
            enabled: Boolean(viewingVendorId && isDetailsOpen),
            select: normalizeVendor,
        }
    );

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isDirty },
    } = useForm({ defaultValues: vendorDefaultValues });

    useEffect(() => {
        if (editVendorDetailsQuery.data && editingVendorId) {
            const detail = editVendorDetailsQuery.data;
            reset({
                name: detail.name,
                tax_id: detail.taxId,
                website: detail.website,
                contact_person: detail.contactPerson,
                email: detail.email,
                phone: detail.phone,
                address: detail.address,
                payment_terms: detail.paymentTerms || 'net_15',
                is_active: detail.isActive,
            });
        }
    }, [editVendorDetailsQuery.data, editingVendorId, reset]);

    const openAddModal = () => {
        setEditingVendorId(null);
        reset(vendorDefaultValues);
        setIsFormOpen(true);
    };

    const openEditModal = (vendorId) => {
        setEditingVendorId(vendorId);
        setIsFormOpen(true);
    };
    const openViewModal = (vendorId) => {
        setViewingVendorId(vendorId);
        setIsDetailsOpen(true);
    };
    const closeViewModal = () => {
        setIsDetailsOpen(false);
        setViewingVendorId(null);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        setEditingVendorId(null);
        reset(vendorDefaultValues);
    };

    const onSubmit = async (values) => {
        const payload = {
            name: values.name.trim(),
            tax_id: values.tax_id.trim(),
            website: values.website.trim(),
            contact_person: values.contact_person.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            address: values.address.trim(),
            payment_terms: values.payment_terms,
            is_active: Boolean(values.is_active),
        };

        try {
            if (editingVendorId) {
                await updateVendor.mutateAsync({ id: editingVendorId, ...payload });
                toast.success('Vendor updated successfully.');
            } else {
                await createVendor.mutateAsync(payload);
                toast.success('Vendor created successfully.');
            }
            closeFormModal();
        } catch (error) {
            const message = formatApiErrorMessage(error, 'Failed to save vendor.');
            toast.error(message);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            await deleteVendor.mutateAsync(deleteTarget.id);
            toast.success('Vendor deleted successfully.');
            if (viewingVendorId === deleteTarget.id) {
                closeViewModal();
            }
            setDeleteTarget(null);
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to delete vendor.';
            toast.error(message);
        }
    };

    const isLoading = vendorsQuery.isLoading;
    const hasError = vendorsQuery.isError;
    const selectedViewVendor = useMemo(() => {
        if (viewVendorDetailsQuery.data) return viewVendorDetailsQuery.data;
        return vendors.find((vendor) => vendor.id === viewingVendorId) || null;
    }, [viewVendorDetailsQuery.data, vendors, viewingVendorId]);

    return (
        <Card className="padding-none" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VendorsHeaderFilters
                filteredCount={totalCount}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                }}
                onAddVendor={openAddModal}
            />

            {isLoading && (
                <div style={{ padding: '1.5rem' }}>
                    <Spinner />
                </div>
            )}

            {hasError && !isLoading && (
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ marginTop: 0, color: 'var(--color-error)' }}>Could not load vendors data.</p>
                    <Button variant="outline" onClick={refreshVendors}>
                        Retry
                    </Button>
                </div>
            )}

            {!isLoading && !hasError && (
                <VendorsList
                    vendors={vendors}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={setDeleteTarget}
                />
            )}

            <VendorFormModal
                isOpen={isFormOpen}
                isEditing={Boolean(editingVendorId)}
                isLoadingDetails={editVendorDetailsQuery.isLoading}
                onClose={closeFormModal}
                onSubmit={onSubmit}
                register={register}
                handleSubmit={handleSubmit}
                control={control}
                errors={errors}
                isDirty={isDirty}
                isSubmitting={createVendor.isPending || updateVendor.isPending}
            />

            <ConfirmationModal
                isOpen={Boolean(deleteTarget)}
                title="Delete Vendor"
                type="danger"
                message={`Are you sure you want to delete "${deleteTarget?.name || 'this vendor'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />

            <VendorDetailsModal
                isOpen={isDetailsOpen}
                isLoading={viewVendorDetailsQuery.isLoading}
                vendor={selectedViewVendor}
                onClose={closeViewModal}
            />
        </Card>
    );
};

export default Vendors;
