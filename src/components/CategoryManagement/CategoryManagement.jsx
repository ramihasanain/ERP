import React, { useMemo, useState } from 'react';
import Button from '@/components/Shared/Button';
import Modal from '@/components/Shared/Modal';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Package, Monitor, Briefcase, FolderOpen } from 'lucide-react';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || '';

const asTrimmedString = (value) => {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value.trim();
    return String(value).trim();
};

/** Inventory categories use `group` (UUID) for the category type; may be string or nested object */
const extractGroupIdFromItem = (item) => {
    if (!item) return '';
    const g = item.group;
    if (g != null && typeof g === 'object') return asTrimmedString(g.id ?? g.uuid ?? '');
    if (g != null && g !== '') return asTrimmedString(g);
    return '';
};

const normalizeCategoryType = (item) => ({
    id: getEntityId(item),
    name: item?.name || item?.title || item?.type_name || item?.label || '',
    raw: item,
});

const normalizeCategory = (item) => ({
    id: getEntityId(item),
    name: item?.name || '',
    typeId:
        extractGroupIdFromItem(item) ||
        asTrimmedString(item?.type) ||
        asTrimmedString(item?.type_id) ||
        asTrimmedString(item?.category_type) ||
        asTrimmedString(item?.category_type_id) ||
        '',
    groupName: asTrimmedString(item?.group_name ?? item?.groupName),
    description: item?.description || '',
    isActive: item?.is_active ?? true,
    raw: item,
});

/**
 * Place each category under the card for its category type:
 * 1) Match `group` UUID to a type `id` (case-insensitive)
 * 2) Else match `group_name` to a type `name` (case-insensitive)
 * 3) Else bucket as uncategorized (`__none__`)
 */
const buildCategoriesByTypeMap = (categories, categoryTypes) => {
    const canonicalTypeIdByLower = new Map(
        categoryTypes.map((t) => [asTrimmedString(t.id).toLowerCase(), asTrimmedString(t.id)])
    );
    const typeIdByNameLower = new Map(
        categoryTypes.map((t) => [asTrimmedString(t.name).toLowerCase(), asTrimmedString(t.id)])
    );

    const map = new Map();
    const push = (key, cat) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(cat);
    };

    for (const c of categories) {
        const raw = c.raw || {};
        let resolved = '';

        const tryResolveId = (id) => {
            const s = asTrimmedString(id);
            if (!s) return;
            const canon = canonicalTypeIdByLower.get(s.toLowerCase());
            if (canon) resolved = canon;
        };

        tryResolveId(c.typeId);
        if (!resolved) tryResolveId(extractGroupIdFromItem(raw));

        if (!resolved) {
            const nameKey = asTrimmedString(raw.group_name ?? raw.groupName ?? c.groupName);
            if (nameKey) {
                const byName = typeIdByNameLower.get(nameKey.toLowerCase());
                if (byName) resolved = byName;
            }
        }

        push(resolved || '__none__', c);
    }

    return map;
};

/** Top border accents — match reference: orange, blue, rose, green */
const GROUP_ACCENTS = ['#f97316', '#3b82f6', '#e11d48', '#22c55e'];
const GROUP_ICONS = [Package, Monitor, Briefcase, FolderOpen];

const CategoryManagement = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [lockedTypeId, setLockedTypeId] = useState(null);

    const categoriesQuery = useCustomQuery('/api/inventory/categories/', ['inventory-categories'], {
        select: (response) => normalizeArrayResponse(response).map(normalizeCategory),
    });

    const categoryTypesQuery = useCustomQuery('/api/inventory/category-types/', ['inventory-category-types'], {
        select: (response) => normalizeArrayResponse(response).map(normalizeCategoryType),
    });

    const createCategory = useCustomPost('/api/inventory/categories/create/', ['inventory-categories']);
    const updateCategory = useCustomPut(
        (data) => `/api/inventory/categories/${data.id}/`,
        ['inventory-categories', 'inventory-category-detail']
    );
    const deleteCategory = useCustomRemove(
        (id) => `/api/inventory/categories/${id}/`,
        ['inventory-categories', 'inventory-category-detail']
    );

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            type: '',
            description: '',
            is_active: true,
        },
    });

    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    const categoryTypes = useMemo(() => categoryTypesQuery.data ?? [], [categoryTypesQuery.data]);

    const categoriesByTypeId = useMemo(
        () => buildCategoriesByTypeMap(categories, categoryTypes),
        [categories, categoryTypes]
    );

    const uncategorized = useMemo(() => categoriesByTypeId.get('__none__') ?? [], [categoriesByTypeId]);

    const isLoading = categoriesQuery.isLoading || categoryTypesQuery.isLoading;
    const hasError = categoriesQuery.isError || categoryTypesQuery.isError;

    const handleAddForType = (typeId) => {
        setEditingCategory(null);
        setLockedTypeId(typeId);
        reset({
            name: '',
            type: typeId,
            description: '',
            is_active: true,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setLockedTypeId(null);
        reset({
            name: category.name || '',
            type: category.typeId || '',
            description: category.description || '',
            is_active: Boolean(category.isActive),
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
        setLockedTypeId(null);
    };

    const onSubmit = async (values) => {
        const payload = {
            name: values.name.trim(),
            type: values.type,
            description: values.description.trim(),
            is_active: Boolean(values.is_active),
        };

        try {
            if (editingCategory?.id) {
                await updateCategory.mutateAsync({ id: editingCategory.id, ...payload });
                toast.success('Category updated successfully.');
            } else {
                await createCategory.mutateAsync(payload);
                toast.success('Category created successfully.');
            }

            closeForm();
            reset({
                name: '',
                type: '',
                description: '',
                is_active: true,
            });
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to save category.';
            toast.error(message);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            await deleteCategory.mutateAsync(deleteTarget.id);
            toast.success('Category deleted successfully.');
            setDeleteTarget(null);
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to delete category.';
            toast.error(message);
        }
    };

    const handleRetry = async () => {
        try {
            await Promise.all([categoriesQuery.refetch(), categoryTypesQuery.refetch()]);
            toast.success('Categories refreshed.');
        } catch {
            toast.error('Refresh failed. Please try again.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                    Category Management
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
                    Manage all category dropdowns used across the system.
                </p>
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <div
                    style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-card)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load categories data.</p>
                        <Button variant="outline" onClick={handleRetry}>
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && !hasError && categoryTypes.length === 0 && (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No category groups configured yet.</p>
            )}

            {!isLoading && !hasError && categoryTypes.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                        gap: '1.25rem',
                    }}
                >
                    {categoryTypes.map((type, index) => {
                        const accent = GROUP_ACCENTS[index % GROUP_ACCENTS.length];
                        const IconComponent = GROUP_ICONS[index % GROUP_ICONS.length];
                        const list = categoriesByTypeId.get(asTrimmedString(type.id)) ?? [];
                        return (
                            <div
                                key={type.id}
                                style={{
                                    background: 'var(--color-bg-card)',
                                    borderRadius: 'var(--radius-xl)',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'var(--shadow-md)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '200px',
                                }}
                            >
                                <div
                                    style={{
                                        borderTop: `4px solid ${accent}`,
                                        padding: '1rem 1rem 0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    background: `color-mix(in srgb, ${accent} 14%, var(--color-bg-card))`,
                                                    color: accent,
                                                }}
                                            >
                                                <IconComponent size={20} strokeWidth={2} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: '1rem',
                                                        color: 'var(--color-text-main)',
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {type.name || 'Unnamed group'}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                                    {list.length === 1 ? '1 category' : `${list.length} categories`}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                            icon={<Plus size={16} />}
                                            onClick={() => handleAddForType(type.id)}
                                            aria-label={`Add category to ${type.name || 'group'}`}
                                        />
                                    </div>
                                </div>

                                <div style={{ flex: 1, padding: '0 0.25rem 0.75rem' }}>
                                    {list.length === 0 ? (
                                        <p
                                            style={{
                                                margin: '0.5rem 0.75rem 0.25rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            No categories yet. Use + to add one.
                                        </p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {list.map((category) => (
                                                <li
                                                    key={category.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '0.75rem',
                                                        padding: '0.65rem 0.75rem',
                                                        borderTop: '1px solid var(--color-border)',
                                                        fontSize: '0.9rem',
                                                        color: 'var(--color-text-main)',
                                                    }}
                                                >
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {category.name || '—'}
                                                    </span>
                                                    <div style={{ display: 'inline-flex', gap: '0.25rem', flexShrink: 0 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(category)}
                                                            style={iconBtnStyle}
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(category)}
                                                            style={{ ...iconBtnStyle, color: 'var(--color-error)' }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {uncategorized.length > 0 && (
                        <div
                            style={{
                                background: 'var(--color-bg-card)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid var(--color-border)',
                                boxShadow: 'var(--shadow-md)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div
                                style={{
                                    borderTop: '4px solid var(--color-text-muted)',
                                    padding: '1rem 1rem 0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--color-bg-secondary)',
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        <FolderOpen size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                            Uncategorized
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                            {uncategorized.length === 1 ? '1 category' : `${uncategorized.length} categories`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ul style={{ listStyle: 'none', margin: 0, padding: '0 0.25rem 0.75rem' }}>
                                {uncategorized.map((category) => (
                                    <li
                                        key={category.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.75rem',
                                            padding: '0.65rem 0.75rem',
                                            borderTop: '1px solid var(--color-border)',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {category.name || '—'}
                                        </span>
                                        <div style={{ display: 'inline-flex', gap: '0.25rem', flexShrink: 0 }}>
                                            <button type="button" onClick={() => handleEdit(category)} style={iconBtnStyle} title="Edit">
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(category)}
                                                style={{ ...iconBtnStyle, color: 'var(--color-error)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isFormOpen} onClose={closeForm} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Category Name</label>
                        <input
                            {...register('name', { required: 'Category name is required.' })}
                            style={inputStyle}
                            placeholder="Enter category name"
                        />
                        {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Category Type</label>
                        <Controller
                            name="type"
                            control={control}
                            rules={{ required: 'Category type is required.' }}
                            render={({ field }) => (
                                <select {...field} style={inputStyle} disabled={Boolean(lockedTypeId && !editingCategory)}>
                                    <option value="">Select category type</option>
                                    {categoryTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name || 'Unnamed type'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.type && <p style={errorStyle}>{errors.type.message}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            {...register('description')}
                            style={{ ...inputStyle, minHeight: '88px', resize: 'vertical' }}
                            placeholder="Enter description"
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <input
                                    type="checkbox"
                                    checked={Boolean(value)}
                                    onChange={(event) => onChange(event.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                            )}
                        />
                        <label style={{ ...labelStyle, margin: 0 }}>Active Category</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <Button type="button" variant="outline" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={createCategory.isPending || updateCategory.isPending}>
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={Boolean(deleteTarget)}
                title="Delete Category"
                type="danger"
                message={`Are you sure you want to delete "${deleteTarget?.name || 'this category'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

const iconBtnStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
    transition: 'background 0.15s ease',
};

const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 500,
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
};
const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};
const errorStyle = { marginTop: '0.35rem', marginBottom: 0, color: 'var(--color-error)', fontSize: '0.8rem' };

export default CategoryManagement;
