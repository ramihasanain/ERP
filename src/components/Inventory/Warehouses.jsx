import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Modal from '@/components/Shared/Modal';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MapPin, User, Warehouse, Eye } from 'lucide-react';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || '';

const normalizeWarehouse = (item) => ({
    id: getEntityId(item),
    name: item?.name || '',
    location: item?.location || '',
    manager: item?.manager || item?.manager_id || item?.managerId || '',
    managerName: (item?.manager_name && String(item.manager_name).trim()) || '',
    raw: item,
});

const normalizeWarehouses = (response) => normalizeArrayResponse(response).map(normalizeWarehouse);

const getEmployeeRoleKey = (item) => {
    const raw = item?.role ?? item?.user_data?.role;
    if (raw == null || raw === '') return '';
    if (typeof raw === 'string') return raw.trim().toLowerCase();
    if (typeof raw === 'object') {
        const nested = raw.name ?? raw.slug ?? raw.code ?? raw.label;
        if (typeof nested === 'string') return nested.trim().toLowerCase();
    }
    return String(raw).toLowerCase();
};

const normalizeEmployee = (item) => {
    const userData = item?.user_data || {};
    const firstName = item?.first_name ?? userData?.first_name ?? '';
    const lastName = item?.last_name ?? userData?.last_name ?? '';
    const email = item?.email ?? userData?.email ?? '';
    return {
        id: getEntityId(item),
        fullName: `${firstName} ${lastName}`.trim() || email || 'Unknown',
        roleKey: getEmployeeRoleKey(item),
    };
};

const normalizeEmployees = (response) => normalizeArrayResponse(response).map(normalizeEmployee);

const Warehouses = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const warehousesQuery = useCustomQuery('/api/inventory/warehouses/', ['inventory-warehouses'], {
        select: normalizeWarehouses,
    });

    const employeesQuery = useCustomQuery('/api/hr/employees/', ['hr-employees'], {
        select: normalizeEmployees,
    });

    const warehouseDetailsQuery = useCustomQuery(
        selectedWarehouseId ? `/api/inventory/warehouses/${selectedWarehouseId}/` : '/api/inventory/warehouses/',
        ['inventory-warehouse-detail', selectedWarehouseId],
        {
            enabled: Boolean(selectedWarehouseId && isDetailOpen),
            select: normalizeWarehouse,
        }
    );

    const createWarehouse = useCustomPost('/api/inventory/warehouses/create/', ['inventory-warehouses']);
    const updateWarehouse = useCustomPut(
        (data) => `/api/inventory/warehouses/${data.id}/`,
        ['inventory-warehouses', 'inventory-warehouse-detail']
    );
    const deleteWarehouse = useCustomRemove(
        (id) => `/api/inventory/warehouses/${id}/`,
        ['inventory-warehouses', 'inventory-warehouse-detail']
    );

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            location: '',
            manager: '',
        },
    });

    const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
    const employees = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);

    const managerEmployees = useMemo(
        () => employees.filter((employee) => employee.roleKey === 'manager'),
        [employees]
    );

    /** Dropdown: managers only; when editing, keep current assignee visible even if not role manager */
    const managerSelectOptions = useMemo(() => {
        const byId = new Map(managerEmployees.map((e) => [e.id, e]));
        const currentId = editingWarehouse?.manager;
        if (!currentId || byId.has(currentId)) return managerEmployees;
        const fromAll = employees.find((e) => e.id === currentId);
        if (fromAll) return [...managerEmployees, fromAll];
        return [
            ...managerEmployees,
            {
                id: currentId,
                fullName: editingWarehouse.managerName?.trim() || 'Current manager',
                roleKey: '',
            },
        ];
    }, [managerEmployees, employees, editingWarehouse]);

    const managerNameMap = useMemo(
        () => new Map(employees.map((employee) => [employee.id, employee.fullName])),
        [employees]
    );

    const selectedWarehouse = useMemo(() => {
        if (warehouseDetailsQuery.data) return warehouseDetailsQuery.data;
        return warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) || null;
    }, [warehouseDetailsQuery.data, warehouses, selectedWarehouseId]);

    const handleEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        reset({
            name: warehouse.name || '',
            location: warehouse.location || '',
            manager: warehouse.manager || '',
        });
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingWarehouse(null);
        reset({ name: '', location: '', manager: '' });
        setIsFormOpen(true);
    };

    const handleView = (warehouseId) => {
        setSelectedWarehouseId(warehouseId);
        setIsDetailOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailOpen(false);
        setSelectedWarehouseId(null);
    };

    const onSubmit = async (values) => {
        const managerId =
            typeof values.manager === 'string' && values.manager.trim() !== '' ? values.manager.trim() : null;
        const payload = {
            name: values.name.trim(),
            location: values.location.trim(),
            manager: managerId,
        };

        try {
            if (editingWarehouse?.id) {
                await updateWarehouse.mutateAsync({ id: editingWarehouse.id, ...payload });
                toast.success('Warehouse updated successfully.');
            } else {
                await createWarehouse.mutateAsync(payload);
                toast.success('Warehouse created successfully.');
            }

            setIsFormOpen(false);
            setEditingWarehouse(null);
            reset({ name: '', location: '', manager: '' });
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to save warehouse.';
            toast.error(message);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            await deleteWarehouse.mutateAsync(deleteTarget.id);
            toast.success('Warehouse deleted successfully.');
            setDeleteTarget(null);
            if (selectedWarehouseId === deleteTarget.id) {
                closeDetailModal();
            }
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to delete warehouse.';
            toast.error(message);
        }
    };

    const isLoading = warehousesQuery.isLoading || employeesQuery.isLoading;
    const hasError = warehousesQuery.isError || employeesQuery.isError;

    const handleRetry = async () => {
        try {
            await Promise.all([warehousesQuery.refetch(), employeesQuery.refetch()]);
            toast.success('Warehouses refreshed.');
        } catch {
            toast.error('Refresh failed. Please try again.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Warehouses</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage physical storage locations.</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
                    Add Warehouse
                </Button>
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load warehouses data.</p>
                        <Button variant="outline" onClick={handleRetry}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {warehouses.length === 0 ? (
                        <Card className="padding-lg">
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                No warehouses available yet. Add your first warehouse to get started.
                            </p>
                        </Card>
                    ) : (
                        warehouses.map((wh) => (
                            <Card key={wh.id} className="padding-md" style={{ borderTop: '4px solid var(--color-secondary-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'color-mix(in srgb, var(--color-secondary-500) 14%, var(--color-bg-card))', borderRadius: '50%', color: 'var(--color-secondary-600)' }}>
                                            <Warehouse size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{wh.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                <MapPin size={14} />
                                                <span>{wh.location || 'No location provided'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <button type="button" onClick={() => handleView(wh.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="View">
                                            <Eye size={16} />
                                        </button>
                                        <button type="button" onClick={() => handleEdit(wh)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(wh)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                                    <User size={16} color="var(--color-text-muted)" />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Manager:</span>
                                    <span style={{ fontWeight: 500 }}>
                                        {managerNameMap.get(wh.manager) || wh.managerName || 'Unassigned'}
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingWarehouse(null);
                }}
                title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Warehouse Name</label>
                        <input
                            {...register('name', { required: 'Warehouse name is required.' })}
                            style={inputStyle}
                            placeholder="Enter warehouse name"
                        />
                        {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Location / Address</label>
                        <input
                            {...register('location', { required: 'Warehouse location is required.' })}
                            style={inputStyle}
                            placeholder="Enter location"
                        />
                        {errors.location && <p style={errorStyle}>{errors.location.message}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Manager</label>
                        <Controller
                            name="manager"
                            control={control}
                            render={({ field }) => (
                                <select {...field} style={inputStyle}>
                                    <option value="">Select Manager</option>
                                    {managerSelectOptions.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.fullName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsFormOpen(false);
                                setEditingWarehouse(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createWarehouse.isPending || updateWarehouse.isPending}
                        >
                            {editingWarehouse ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDetailOpen} onClose={closeDetailModal} title="Warehouse Details" size="md">
                {warehouseDetailsQuery.isLoading ? (
                    <Spinner />
                ) : !selectedWarehouse ? (
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Warehouse details unavailable.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Name</span>
                            <span>{selectedWarehouse.name || '--'}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Location</span>
                            <span>{selectedWarehouse.location || '--'}</span>
                        </div>
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Manager</span>
                            <span>
                                {managerNameMap.get(selectedWarehouse.manager) ||
                                    selectedWarehouse.managerName ||
                                    'Unassigned'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                            <Button
                                variant="outline"
                                icon={<Edit size={16} />}
                                onClick={() => {
                                    closeDetailModal();
                                    handleEdit(selectedWarehouse);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                icon={<Trash2 size={16} />}
                                onClick={() => setDeleteTarget(selectedWarehouse)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmationModal
                isOpen={Boolean(deleteTarget)}
                title="Delete Warehouse"
                type="danger"
                message={`Are you sure you want to delete "${deleteTarget?.name || 'this warehouse'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' };
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };
const errorStyle = { marginTop: '0.35rem', marginBottom: 0, color: 'var(--color-error)', fontSize: '0.8rem' };
const detailRowStyle = { display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' };
const detailLabelStyle = { fontWeight: 600, color: 'var(--color-text-secondary)' };

export default Warehouses;
