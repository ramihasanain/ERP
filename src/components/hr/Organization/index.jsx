import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, ChevronRight, Edit2, Plus, Trash2, User } from 'lucide-react';
import { remove } from '@/api';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Modal from '@/components/Shared/Modal';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Pagination from '@/core/Pagination';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut } from '@/hooks/useMutation';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const normalizeDepartmentNode = (item) => {
    const id = item?.id || item?.uuid || '';
    return {
        id,
        name: item?.name || '',
        parent: item?.parent || null,
        head: item?.head ?? '',
        headLabel: item?.head_name || item?.headName || '',
        children: normalizeArrayResponse(item?.children).map(normalizeDepartmentNode),
    };
};

const normalizeDepartmentsTree = (response) => normalizeArrayResponse(response).map(normalizeDepartmentNode);

const normalizeDepartments = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

const normalizeDepartmentDetails = (response) => {
    const item = response?.data ?? response;

    return {
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
        parent: item?.parent || '',
        head: item?.head != null ? String(item.head) : '',
    };
};

const normalizePositionItem = (item) => ({
    id: item?.id || item?.uuid || '',
    name: item?.name || '',
    description: item?.description || '',
    department: item?.department || item?.department_id || '',
    departmentName: item?.department_name || '',
});

const normalizePaginatedPositions = (response) => {
    const items = normalizeArrayResponse(response).map(normalizePositionItem);
    const count = Number(response?.count ?? response?.data?.count);

    return {
        items,
        count: Number.isFinite(count) ? count : items.length,
    };
};

const flattenErrorValues = (value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(flattenErrorValues);
    if (value && typeof value === 'object') return Object.values(value).flatMap(flattenErrorValues);
    return [];
};

const getErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;
    const responseMessages = flattenErrorValues(responseData).filter(Boolean);

    if (responseMessages.length > 0) {
        return responseMessages.join(' ');
    }

    return error?.message || fallbackMessage;
};

const Organization = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('departments');
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [editingPos, setEditingPos] = useState(null);
    const [positionsPage, setPositionsPage] = useState(1);
    const [deleteState, setDeleteState] = useState({ isOpen: false, type: '', id: '', name: '' });

    const departmentsTreeQuery = useCustomQuery('/api/hr/departments/tree/', ['hr-departments-tree'], {
        select: normalizeDepartmentsTree,
    });
    const departmentsQuery = useCustomQuery('/api/hr/departments/', ['hr-departments'], {
        select: normalizeDepartments,
    });
    const positionsQuery = useCustomQuery(`/api/hr/positions/?page=${positionsPage}`, ['hr-positions', positionsPage], {
        select: normalizePaginatedPositions,
    });

    const deleteMutation = useMutation({
        mutationFn: ({ type, id }) => {
            if (type === 'department') {
                return remove(`/api/hr/departments/${id}/delete/`);
            }
            return remove(`/api/hr/positions/${id}/delete/`);
        },
        onSuccess: async (_, variables) => {
            if (variables.type === 'department') {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['hr-departments-tree'] }),
                    queryClient.invalidateQueries({ queryKey: ['hr-departments'] }),
                ]);
                toast.success('Department deleted successfully.');
            } else {
                await queryClient.invalidateQueries({ queryKey: ['hr-positions'] });
                toast.success('Position deleted successfully.');
            }
            setDeleteState({ isOpen: false, type: '', id: '', name: '' });
        },
        onError: (error) => {
            const message = getErrorMessage(error, 'Delete request failed.');
            toast.error(message);
        },
    });

    const departmentsTree = useMemo(() => departmentsTreeQuery.data ?? [], [departmentsTreeQuery.data]);
    const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
    const positions = useMemo(() => positionsQuery.data?.items ?? [], [positionsQuery.data]);
    const positionsCount = useMemo(() => positionsQuery.data?.count ?? positions.length, [positions.length, positionsQuery.data]);

    const isLoading = departmentsTreeQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading;
    const hasError = departmentsTreeQuery.isError || departmentsQuery.isError || positionsQuery.isError;

    const handleOpenDeptModal = (department = null) => {
        setEditingDept(department);
        setIsDeptModalOpen(true);
    };

    const handleOpenPosModal = (position = null) => {
        setEditingPos(position);
        setIsPosModalOpen(true);
    };

    const handleDeleteRequest = (type, item) => {
        setDeleteState({
            isOpen: true,
            type,
            id: item.id,
            name: item.name,
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteState.id || !deleteState.type) return;
        deleteMutation.mutate({ type: deleteState.type, id: deleteState.id });
    };

    const handleRefresh = async () => {
        await Promise.all([
            departmentsTreeQuery.refetch(),
            departmentsQuery.refetch(),
            positionsQuery.refetch(),
        ]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Organization</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage departments, hierarchy, and job positions.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant={activeTab === 'departments' ? 'primary' : 'outline'} onClick={() => setActiveTab('departments')}>
                        Departments
                    </Button>
                    <Button variant={activeTab === 'positions' ? 'primary' : 'outline'} onClick={() => setActiveTab('positions')}>
                        Job Positions
                    </Button>
                </div>
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load organization data.</p>
                        <Button variant="outline" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && (
                <>
                    {activeTab === 'departments' ? (
                        <DepartmentsView
                            departmentsTree={departmentsTree}
                            onAdd={() => handleOpenDeptModal(null)}
                            onEdit={handleOpenDeptModal}
                            onDelete={(department) => handleDeleteRequest('department', department)}
                        />
                    ) : (
                        <PositionsView
                            positions={positions}
                            positionsCount={positionsCount}
                            currentPage={positionsPage}
                            onPageChange={setPositionsPage}
                            departments={departments}
                            onAdd={() => handleOpenPosModal(null)}
                            onEdit={handleOpenPosModal}
                            onDelete={(position) => handleDeleteRequest('position', position)}
                        />
                    )}
                </>
            )}

            <DepartmentModal
                isOpen={isDeptModalOpen}
                onClose={() => {
                    setIsDeptModalOpen(false);
                    setEditingDept(null);
                }}
                department={editingDept}
                allDepartments={departments}
            />

            <PositionModal
                isOpen={isPosModalOpen}
                onClose={() => {
                    setIsPosModalOpen(false);
                    setEditingPos(null);
                }}
                position={editingPos}
                departments={departments}
            />

            <ConfirmationModal
                isOpen={deleteState.isOpen}
                title={deleteState.type === 'department' ? 'Delete Department' : 'Delete Position'}
                message={`Are you sure you want to delete "${deleteState.name}"? This action cannot be undone.`}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
                onCancel={() => setDeleteState({ isOpen: false, type: '', id: '', name: '' })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};

const DepartmentsView = ({ departmentsTree, onAdd, onEdit, onDelete }) => {
    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Department Hierarchy</h2>
                <Button icon={<Plus size={16} />} onClick={onAdd}>
                    Add Department
                </Button>
            </div>

            {departmentsTree.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No departments found.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {departmentsTree.map((department) => (
                        <DepartmentNode key={department.id} dept={department} level={0} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </Card>
    );
};

const DepartmentNode = ({ dept, level, onEdit, onDelete }) => {
    const hasChildren = dept.children.length > 0;
    const [expanded, setExpanded] = useState(true);

    const headLabel = dept.headLabel || dept.head || 'Unassigned';

    return (
        <div style={{ marginLeft: `${level * 1.5}rem` }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--color-bg-body)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '0.5rem',
                }}
            >
                {hasChildren && (
                    <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        style={{
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label="Toggle sub departments"
                    >
                        <ChevronRight size={18} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                )}
                <div
                    style={{
                        padding: '0.5rem',
                        background: 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-card))',
                        borderRadius: '0.5rem',
                        color: 'var(--color-primary-500)',
                    }}
                >
                    <Building2 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{dept.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} /> Head: {headLabel}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" icon={<Edit2 size={16} />} onClick={() => onEdit(dept)} />
                    <Button variant="ghost" icon={<Trash2 size={16} />} style={{ color: 'var(--color-error)' }} onClick={() => onDelete(dept)} />
                </div>
            </div>

            {expanded &&
                hasChildren &&
                dept.children.map((child) => (
                    <DepartmentNode key={child.id} dept={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
                ))}
        </div>
    );
};

const PositionsView = ({ positions, positionsCount, currentPage, onPageChange, departments, onAdd, onEdit, onDelete }) => {
    const departmentMap = useMemo(() => {
        return new Map(departments.map((department) => [department.id, department.name]));
    }, [departments]);

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Job Positions</h2>
                <Button icon={<Plus size={16} />} onClick={onAdd}>
                    Add Position
                </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Description</th>
                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Department</th>
                            <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                                    No positions found.
                                </td>
                            </tr>
                        ) : (
                            positions.map((position) => (
                                <tr key={position.id}>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 500, color: 'var(--color-text-main)' }}>{position.name}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{position.description || '—'}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                        {position.departmentName || departmentMap.get(position.department) || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                                        <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => onEdit(position)} />
                                        <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} style={{ color: 'var(--color-error)' }} onClick={() => onDelete(position)} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1rem' }}>
                <Pagination currentPage={currentPage} count={positionsCount} onPageChange={onPageChange} />
            </div>
        </Card>
    );
};

const DepartmentModal = ({ isOpen, onClose, department, allDepartments }) => {
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isDirty: isDepartmentDirty },
    } = useForm({
        defaultValues: {
            name: '',
            parent: '',
            head: '',
        },
    });

    const createDepartmentMutation = useCustomPost('/api/hr/departments/create/', [['hr-departments-tree'], ['hr-departments']]);
    const updateDepartmentMutation = useCustomPut(`/api/hr/departments/${department?.id || 'new'}/`, [['hr-departments-tree'], ['hr-departments']]);
    const departmentDetailsQuery = useCustomQuery(`/api/hr/departments/${department?.id || ''}/`, ['hr-department-details', department?.id], {
        enabled: Boolean(isOpen && department?.id),
        select: normalizeDepartmentDetails,
    });

    useEffect(() => {
        if (!isOpen) return;

        if (department?.id && departmentDetailsQuery.data) {
            reset({
                name: departmentDetailsQuery.data.name || '',
                parent: departmentDetailsQuery.data.parent || '',
                head: departmentDetailsQuery.data.head || '',
            });
            return;
        }

        reset({
            name: department?.name || '',
            parent: department?.parent || '',
            head: String(department?.head || ''),
        });
    }, [department, departmentDetailsQuery.data, isOpen, reset]);

    const onSubmit = async (values) => {
        const payload = {
            name: values.name.trim(),
            parent: values.parent || null,
            head: values.head || '',
        };

        try {
            if (department) {
                await updateDepartmentMutation.mutateAsync(payload);
                toast.success('Department updated successfully.');
            } else {
                await createDepartmentMutation.mutateAsync(payload);
                toast.success('Department created successfully.');
            }
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, 'Department request failed.');
            toast.error(message);
        }
    };

    const isSubmitting = createDepartmentMutation.isPending || updateDepartmentMutation.isPending;
    const isDetailsLoading = Boolean(department?.id) && departmentDetailsQuery.isLoading;
    const departmentNameValue = watch('name');
    const isDepartmentFormValid = Boolean(departmentNameValue?.trim());
    const isDepartmentSubmitDisabled = isDetailsLoading || !isDepartmentFormValid || (Boolean(department) && !isDepartmentDirty);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={department ? 'Edit Department' : 'Add Department'}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {isDetailsLoading && <Spinner />}

                <Controller
                    name="name"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input label="Department Name" placeholder="Enter department name" {...field} required />}
                />

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Parent Department</label>
                    <Controller
                        name="parent"
                        control={control}
                        render={({ field }) => (
                            <select
                                value={field.value || ''}
                                onChange={(event) => field.onChange(event.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                }}
                            >
                                <option value="">None (Root Level)</option>
                                {allDepartments
                                    .filter((dept) => dept.id !== department?.id)
                                    .map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                            </select>
                        )}
                    />
                </div>

                <Controller
                    name="head"
                    control={control}
                    render={({ field }) => <Input label="Head (Employee ID)" placeholder="e.g. 1" {...field} />}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isDepartmentSubmitDisabled}>
                        {department ? 'Save Changes' : 'Create Department'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const PositionModal = ({ isOpen, onClose, position, departments }) => {
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isDirty: isPositionDirty },
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            department: '',
        },
    });

    const createPositionMutation = useCustomPost('/api/hr/positions/create/', [['hr-positions']]);
    const updatePositionMutation = useCustomPut(`/api/hr/positions/${position?.id || 'new'}/`, [['hr-positions']]);

    useEffect(() => {
        if (!isOpen) return;
        reset({
            name: position?.name || '',
            description: position?.description || '',
            department: position?.department || '',
        });
    }, [isOpen, position, reset]);

    const onSubmit = async (values) => {
        const payload = {
            name: values.name.trim(),
            description: values.description.trim(),
            department: values.department,
        };

        try {
            if (position) {
                await updatePositionMutation.mutateAsync(payload);
                toast.success('Position updated successfully.');
            } else {
                await createPositionMutation.mutateAsync(payload);
                toast.success('Position created successfully.');
            }
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, 'Position request failed.');
            toast.error(message);
        }
    };

    const isSubmitting = createPositionMutation.isPending || updatePositionMutation.isPending;
    const positionNameValue = watch('name');
    const positionDescriptionValue = watch('description');
    const positionDepartmentValue = watch('department');
    const isPositionFormValid = Boolean(positionNameValue?.trim() && positionDescriptionValue?.trim() && positionDepartmentValue);
    const isPositionSubmitDisabled = !isPositionFormValid || (Boolean(position) && !isPositionDirty);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={position ? 'Edit Position' : 'Add Position'}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input label="Position Name *" placeholder="Enter position name" {...field} required />}
                />

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Description *</label>
                    <Controller
                        name="description"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <textarea
                                {...field}
                                rows={4}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                    resize: 'vertical',
                                }}
                            />
                        )}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Department *</label>
                    <Controller
                        name="department"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <select
                                value={field.value}
                                onChange={(event) => field.onChange(event.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                }}
                            >
                                <option value="">Select Department</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isPositionSubmitDisabled}>
                        {position ? 'Save Changes' : 'Create Position'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default Organization;
