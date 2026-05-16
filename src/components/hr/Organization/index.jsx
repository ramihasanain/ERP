import React, { useEffect, useMemo, useState } from 'react';
import translateApiError from '@/utils/translateApiError';
import { useTranslation } from 'react-i18next';
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
import SearchableSelectBackend from '@/core/SearchableSelectBackend';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import useCustomQuery from '@/hooks/useQuery';
import { useDepartmentsInfiniteQuery } from '@/hooks/useDepartmentsInfiniteQuery';
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

const normalizeDepartmentDetails = (response) => {
    const item = response?.data ?? response;

    return {
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
        parent: item?.parent || '',
        parentName: item?.parent_name || item?.parentName || '',
        head: item?.head != null ? String(item.head) : '',
        headName: item?.head_name || item?.headName || '',
    };
};

const flattenDepartmentsFromPages = (pages) => {
    const seen = new Set();
    const out = [];

    for (const page of pages ?? []) {
        for (const item of normalizeArrayResponse(page)) {
            const id = item?.id || item?.uuid || '';
            if (!id || seen.has(id)) continue;
            seen.add(id);
            out.push({ id, name: item?.name || '' });
        }
    }

    return out;
};

const buildDepartmentSelectOptions = (departments, { excludeId, selectedId, selectedLabel } = {}) => {
    let options = departments
        .filter((department) => department.id !== excludeId)
        .map((department) => ({ value: department.id, label: department.name || department.id }));

    if (selectedId && !options.some((option) => option.value === selectedId)) {
        options = [{ value: selectedId, label: selectedLabel || 'Selected department' }, ...options];
    }

    return options;
};

const normalizeEmployeeOption = (item) => {
    const firstName = item?.first_name || '';
    const lastName = item?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
        id: item?.id || item?.uuid || '',
        fullName: fullName || item?.email || 'Unknown',
    };
};

const normalizeEmployeesSearchResponse = (response) =>
    normalizeArrayResponse(response).map(normalizeEmployeeOption);

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
    const { t } = useTranslation(['hr', 'common']);
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
    const positionsQuery = useCustomQuery(`/api/hr/positions/?page=${positionsPage}`, ['hr-positions', positionsPage], {
        enabled: activeTab === 'positions',
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
                    queryClient.invalidateQueries({ queryKey: ['hr-departments', 'infinite'] }),
                ]);
                toast.success(t('organization.departmentDeleted'));
            } else {
                await queryClient.invalidateQueries({ queryKey: ['hr-positions'] });
                toast.success(t('organization.positionDeleted'));
            }
            setDeleteState({ isOpen: false, type: '', id: '', name: '' });
        },
        onError: (error) => {
            const message = getErrorMessage(error, 'Delete request failed.');
            toast.error(translateApiError(error, 'hr:errors.generic'));
        },
    });

    const departmentsTree = useMemo(() => departmentsTreeQuery.data ?? [], [departmentsTreeQuery.data]);
    const positions = useMemo(() => positionsQuery.data?.items ?? [], [positionsQuery.data]);
    const positionsCount = useMemo(() => positionsQuery.data?.count ?? positions.length, [positions.length, positionsQuery.data]);

    const isDepartmentsLoading = departmentsTreeQuery.isLoading;
    const isDepartmentsError = departmentsTreeQuery.isError;
    const isPositionsLoading = positionsQuery.isLoading;
    const isPositionsError = positionsQuery.isError;

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
        if (activeTab === 'departments') {
            await departmentsTreeQuery.refetch();
            return;
        }
        await positionsQuery.refetch();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('organization.title')}</h1>
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

            {activeTab === 'departments' && isDepartmentsLoading && <Spinner />}
            {activeTab === 'positions' && isPositionsLoading && <Spinner />}

            {activeTab === 'departments' && isDepartmentsError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load departments.</p>
                        <Button variant="outline" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {activeTab === 'positions' && isPositionsError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load positions.</p>
                        <Button variant="outline" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {activeTab === 'departments' && !isDepartmentsLoading && !isDepartmentsError && (
                <DepartmentsView
                    departmentsTree={departmentsTree}
                    onAdd={() => handleOpenDeptModal(null)}
                    onEdit={handleOpenDeptModal}
                    onDelete={(department) => handleDeleteRequest('department', department)}
                />
            )}

            {activeTab === 'positions' && !isPositionsLoading && !isPositionsError && (
                <PositionsView
                    positions={positions}
                    positionsCount={positionsCount}
                    currentPage={positionsPage}
                    onPageChange={setPositionsPage}
                    onAdd={() => handleOpenPosModal(null)}
                    onEdit={handleOpenPosModal}
                    onDelete={(position) => handleDeleteRequest('position', position)}
                />
            )}

            <DepartmentModal
                isOpen={isDeptModalOpen}
                onClose={() => {
                    setIsDeptModalOpen(false);
                    setEditingDept(null);
                }}
                department={editingDept}
            />

            <PositionModal
                isOpen={isPosModalOpen}
                onClose={() => {
                    setIsPosModalOpen(false);
                    setEditingPos(null);
                }}
                position={editingPos}
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

const PositionsView = ({ positions, positionsCount, currentPage, onPageChange, onAdd, onEdit, onDelete }) => {
    const { t } = useTranslation(['hr', 'common']);

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('organization.jobPositions')}</h2>
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
                                        {position.departmentName || '—'}
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

const DepartmentModal = ({ isOpen, onClose, department }) => {
    const { t } = useTranslation(['hr', 'common']);
    const [headSearchTerm, setHeadSearchTerm] = useState('');

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

    const selectedHeadId = watch('head');
    const selectedParentId = watch('parent');

    const departmentsInfiniteQuery = useDepartmentsInfiniteQuery({ enabled: isOpen });
    const {
        isLoading: departmentsInitialLoading,
        hasNextPage: departmentsHasNextPage,
        fetchNextPage: fetchNextDepartmentsPage,
        isFetchingNextPage: isFetchingNextDepartmentsPage,
        isFetchNextPageError: isFetchNextDepartmentsPageError,
        isError: departmentsFailed,
    } = departmentsInfiniteQuery;

    const loadedDepartments = useMemo(
        () => flattenDepartmentsFromPages(departmentsInfiniteQuery.data?.pages),
        [departmentsInfiniteQuery.data]
    );

    const headEmployeesUrl = useMemo(() => {
        const params = new URLSearchParams();
        const term = headSearchTerm.trim();
        if (term) params.set('search', term);
        const queryString = params.toString();
        return `/api/hr/employees/${queryString ? `?${queryString}` : ''}`;
    }, [headSearchTerm]);

    const headEmployeesQuery = useCustomQuery(
        headEmployeesUrl,
        ['hr-employees-head-select', headSearchTerm.trim()],
        {
            enabled: isOpen,
            select: normalizeEmployeesSearchResponse,
        }
    );

    const headEmployees = useMemo(() => headEmployeesQuery.data ?? [], [headEmployeesQuery.data]);

    const createDepartmentMutation = useCustomPost('/api/hr/departments/create/', [
        ['hr-departments-tree'],
        ['hr-departments', 'infinite'],
    ]);
    const updateDepartmentMutation = useCustomPut(`/api/hr/departments/${department?.id || 'new'}/`, [
        ['hr-departments-tree'],
        ['hr-departments', 'infinite'],
    ]);
    const departmentDetailsQuery = useCustomQuery(`/api/hr/departments/${department?.id || ''}/`, ['hr-department-details', department?.id], {
        enabled: Boolean(isOpen && department?.id),
        select: normalizeDepartmentDetails,
    });

    const headEmployeeOptions = useMemo(() => {
        const options = headEmployees.map((employee) => ({
            value: employee.id,
            label: employee.fullName,
        }));
        const knownIds = new Set(options.map((option) => option.value));

        if (selectedHeadId && !knownIds.has(selectedHeadId)) {
            const fallbackLabel =
                departmentDetailsQuery.data?.headName ||
                department?.headLabel ||
                'Selected employee';
            options.unshift({ value: selectedHeadId, label: fallbackLabel });
        }

        return options;
    }, [department?.headLabel, departmentDetailsQuery.data?.headName, headEmployees, selectedHeadId]);

    const parentDepartmentSelectOptions = useMemo(() => {
        const parentLabel =
            departmentDetailsQuery.data?.parentName ||
            loadedDepartments.find((item) => item.id === selectedParentId)?.name ||
            '';

        return buildDepartmentSelectOptions(loadedDepartments, {
            excludeId: department?.id,
            selectedId: selectedParentId,
            selectedLabel: parentLabel,
        });
    }, [department?.id, departmentDetailsQuery.data?.parentName, loadedDepartments, selectedParentId]);

    useEffect(() => {
        if (!isOpen) {
            setHeadSearchTerm('');
        }
    }, [isOpen]);

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
                toast.success(t('organization.departmentUpdated'));
            } else {
                await createDepartmentMutation.mutateAsync(payload);
                toast.success(t('organization.departmentCreated'));
            }
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, 'Department request failed.');
            toast.error(translateApiError(error, 'hr:errors.generic'));
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

                <Controller
                    name="parent"
                    control={control}
                    render={({ field }) => (
                        <SelectWithLoadMore
                            id="organization-department-parent"
                            label="Parent Department"
                            value={field.value || ''}
                            onChange={(nextValue) => field.onChange(nextValue)}
                            options={parentDepartmentSelectOptions}
                            emptyOptionLabel="None (Root Level)"
                            isInitialLoading={departmentsInitialLoading && !departmentsInfiniteQuery.data}
                            disabled={departmentsFailed}
                            hasMore={Boolean(departmentsHasNextPage) && !departmentsFailed}
                            onLoadMore={() => fetchNextDepartmentsPage()}
                            isLoadingMore={isFetchingNextDepartmentsPage}
                            paginationError={
                                departmentsFailed
                                    ? 'Failed to load departments.'
                                    : isFetchNextDepartmentsPageError
                                      ? 'Could not load more departments. Scroll down to retry.'
                                      : null
                            }
                            zIndex={1050}
                        />
                    )}
                />

                <Controller
                    name="head"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelectBackend
                            label="Employee Name"
                            value={field.value || ''}
                            onChange={(nextValue) => field.onChange(nextValue)}
                            options={headEmployeeOptions}
                            searchTerm={headSearchTerm}
                            onSearchChange={setHeadSearchTerm}
                            placeholder="Search employee..."
                            emptyLabel={headEmployeesQuery.isLoading ? 'Loading...' : 'No employees found'}
                            getOptionLabel={(option) => option.label}
                            getOptionValue={(option) => option.value}
                            isInitialLoading={headEmployeesQuery.isLoading}
                            disabled={headEmployeesQuery.isError}
                            zIndex={1050}
                        />
                    )}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Button variant="outline" onClick={onClose} type="button">{t('common:actions.cancel')}</Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isDepartmentSubmitDisabled}>
                        {department ? 'Save Changes' : 'Create Department'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const PositionModal = ({ isOpen, onClose, position }) => {
    const { t } = useTranslation(['hr', 'common']);

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

    const selectedDepartmentId = watch('department');

    const departmentsInfiniteQuery = useDepartmentsInfiniteQuery({ enabled: isOpen });
    const {
        isLoading: departmentsInitialLoading,
        hasNextPage: departmentsHasNextPage,
        fetchNextPage: fetchNextDepartmentsPage,
        isFetchingNextPage: isFetchingNextDepartmentsPage,
        isFetchNextPageError: isFetchNextDepartmentsPageError,
        isError: departmentsFailed,
    } = departmentsInfiniteQuery;

    const loadedDepartments = useMemo(
        () => flattenDepartmentsFromPages(departmentsInfiniteQuery.data?.pages),
        [departmentsInfiniteQuery.data]
    );

    const departmentSelectOptions = useMemo(() => {
        const selectedLabel =
            position?.departmentName ||
            loadedDepartments.find((item) => item.id === selectedDepartmentId)?.name ||
            '';

        return buildDepartmentSelectOptions(loadedDepartments, {
            selectedId: selectedDepartmentId,
            selectedLabel,
        });
    }, [loadedDepartments, position?.departmentName, selectedDepartmentId]);

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
                toast.success(t('organization.positionUpdated'));
            } else {
                await createPositionMutation.mutateAsync(payload);
                toast.success(t('organization.positionCreated'));
            }
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, 'Position request failed.');
            toast.error(translateApiError(error, 'hr:errors.generic'));
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

                <Controller
                    name="department"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <SelectWithLoadMore
                            id="organization-position-department"
                            label="Department *"
                            value={field.value || ''}
                            onChange={(nextValue) => field.onChange(nextValue)}
                            options={departmentSelectOptions}
                            emptyOptionLabel="Select Department"
                            isInitialLoading={departmentsInitialLoading && !departmentsInfiniteQuery.data}
                            disabled={departmentsFailed}
                            hasMore={Boolean(departmentsHasNextPage) && !departmentsFailed}
                            onLoadMore={() => fetchNextDepartmentsPage()}
                            isLoadingMore={isFetchingNextDepartmentsPage}
                            paginationError={
                                departmentsFailed
                                    ? 'Failed to load departments.'
                                    : isFetchNextDepartmentsPageError
                                      ? 'Could not load more departments. Scroll down to retry.'
                                      : null
                            }
                            zIndex={1050}
                        />
                    )}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Button variant="outline" onClick={onClose} type="button">{t('common:actions.cancel')}</Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isPositionSubmitDisabled}>
                        {position ? 'Save Changes' : 'Create Position'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default Organization;
