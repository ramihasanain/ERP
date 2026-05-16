import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { usePayroll } from '@/context/PayrollContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import { toast } from 'sonner';
import translateApiError from '@/utils/translateApiError';
import { Plus, Edit2, Layers, Check, Trash2 } from 'lucide-react';

const parseArray = (value) => {
    const { t } = useTranslation(['hr', 'common']);
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.results)) return value.results;
    return [];
};

const parseStructureComponents = (description) => {

    if (!description || typeof description !== 'string') return [];
    return description
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [name, value] = line.split(':');
            return {
                name: name?.trim() || line,
                type: value?.trim() || 'Variable',
            };
        });
};

const normalizeComponentType = (type) => {
    if (!type) return 'earning';
    const value = String(type).toLowerCase();
    if (value.includes('deduction')) return 'deduction';
    return 'earning';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const SalaryStructures = () => {

    const { salaryStructures } = usePayroll();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const structuresQuery = useCustomQuery('/api/hr/salary-structures/', ['hr-salary-structures']);
    const componentsQuery = useCustomQuery('/api/hr/salary-components/', ['hr-salary-components']);
    const structureDetailsQuery = useCustomQuery(
        editingId ? `/api/hr/salary-structures/${editingId}/` : '/api/hr/salary-structures/',
        ['hr-salary-structure', editingId],
        { enabled: Boolean(editingId) && isModalOpen }
    );
    const updateStructureMutation = useCustomPut(
        editingId ? `/api/hr/salary-structures/${editingId}/` : '/api/hr/salary-structures/',
        [['hr-salary-structures']]
    );
    const createStructureMutation = useCustomPost(
        '/api/hr/salary-structures/',
        [['hr-salary-structures']]
    );
    const deleteStructureMutation = useCustomRemove(
        (id) => `/api/hr/salary-structures/${id}/`,
        [['hr-salary-structures']]
    );

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        components: [] // Array of { componentId, type: 'Fixed', value: 0 }
    });

    const availableComponents = useMemo(() => {
        return parseArray(componentsQuery.data).map((component) => ({
            id: component.id,
            name: component.name || '',
            code: component.code || '',
            type: normalizeComponentType(component.component_type || component.component_type_display),
            calculationType: component.calculation_display || component.calculation || 'Variable',
        }));
    }, [componentsQuery.data]);

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', components: [] });
        setIsModalOpen(true);
    };

    const openEdit = (struct) => {
        setEditingId(struct.id);
        setFormData({ name: '', description: '', components: [] });
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (!isModalOpen || !editingId) return;
        const details = structureDetailsQuery.data;
        if (!details) return;

        const mappedComponents = Array.isArray(details.components)
            ? details.components.map((component) => {
                const matchedComponent = availableComponents.find((item) => (
                    String(item.id) === String(component.id) ||
                    normalizeText(item.code) === normalizeText(component.code) ||
                    normalizeText(item.name) === normalizeText(component.name)
                ));
                return {
                    componentId: matchedComponent?.id || component.id || component.name,
                    name: component.name || matchedComponent?.name || '',
                    component_type: normalizeComponentType(component.component_type),
                    is_variable: component.is_variable ?? true,
                    default_value: component.default_value ?? '0.00',
                };
            })
            : [];

        setFormData({
            name: details.name || '',
            description: details.description || '',
            components: mappedComponents,
        });
    }, [availableComponents, editingId, isModalOpen, structureDetailsQuery.data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const payload = {
                    name: formData.name,
                    description: formData.description,
                    component_ids: formData.components
                        .map((component) => String(component.componentId || '').trim())
                        .filter(Boolean),
                };

                await updateStructureMutation.mutateAsync(payload);
                setIsModalOpen(false);
                setEditingId(null);
                toast.success(t('salaryStructures.updated'));
            } else {
                const payload = {
                    name: formData.name,
                    description: formData.description,
                    component_ids: formData.components
                        .map((component) => String(component.componentId || '').trim())
                        .filter(Boolean),
                };
                await createStructureMutation.mutateAsync(payload);
                setIsModalOpen(false);
                setEditingId(null);
                toast.success(t('salaryStructures.created'));
            }
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Failed to save salary structure.';
            toast.error(translateApiError(error, 'hr:errors.generic'));
        }
    };

    const handleDelete = async (id) => {
        if (!id || deleteStructureMutation.isPending) return;
        try {
            await deleteStructureMutation.mutateAsync(id);
            toast.success(t('salaryStructures.deleted'));
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Failed to delete salary structure.';
            toast.error(translateApiError(error, 'hr:errors.generic'));
        }
    };

    const toggleComponent = (compId) => {
        const exists = formData.components.find(c => c.componentId === compId);
        if (exists) {
            setFormData(prev => ({
                ...prev,
                components: prev.components.filter(c => c.componentId !== compId)
            }));
        } else {
            const selectedComp = availableComponents.find((comp) => comp.id === compId);
            setFormData(prev => ({
                ...prev,
                components: [
                    ...prev.components,
                    {
                        componentId: compId,
                        name: selectedComp?.name || '',
                        component_type: normalizeComponentType(selectedComp?.type),
                        is_variable: true,
                        default_value: '0.00',
                    }
                ]
            }));
        }
    };

    const structures = useMemo(() => {
        const apiStructures = parseArray(structuresQuery.data).map((item) => ({
            ...item,
            components: Array.isArray(item.components)
                ? item.components
                : parseStructureComponents(item.description),
        }));
        return apiStructures.length ? apiStructures : salaryStructures;
    }, [structuresQuery.data, salaryStructures]);

    if (structuresQuery.isLoading) {
        return <Spinner />;
    }

    if (structuresQuery.isError) {
        return <ResourceLoadError error={structuresQuery.error} title="Could not load salary structures" />;
    }

    if (componentsQuery.isLoading) {
        return <Spinner />;
    }

    if (componentsQuery.isError) {
        return <ResourceLoadError error={componentsQuery.error} title="Could not load salary components" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Salary Structures</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Define payroll templates for different employee groups.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={openCreate}>Create Structure</Button>
            </div>
            {/* Structures List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {structures.map(struct => (
                    <Card key={struct.id} className="padding-md">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{struct.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{struct.components.length} components</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => openEdit(struct)} />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => handleDelete(struct.id)}
                                    disabled={deleteStructureMutation.isPending}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{struct.description}</p>

                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', maxHeight: '150px', overflowY: 'auto' }}>
                            {struct.components.length ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {struct.components.map((c, i) => {
                                        const compDetails = availableComponents.find((sc) => (
                                            String(sc.id) === String(c.componentId || c.id)
                                        ));
                                        const chipLabel = c.name || compDetails?.name || c.componentId || c.id;
                                        const chipType = normalizeComponentType(c.component_type || c.type || compDetails?.type);
                                        return (
                                            <span key={c.id || c.componentId || i} style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.6rem',
                                                background: 'white',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '1rem',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}>
                                                <span style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: chipType === 'deduction' ? 'var(--color-error-500)' : 'var(--color-success-500)'
                                                }}></span>
                                                {chipLabel}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                    There are no components in this structure.
                                </p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Structure Builder Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card style={{ width: '800px', height: '80vh', padding: '0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingId ? 'Edit Structure' : 'New Salary Structure'}</h2>
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {editingId && structureDetailsQuery.isLoading ? (
                                <Spinner />
                            ) : editingId && structureDetailsQuery.isError ? (
                                <ResourceLoadError error={structureDetailsQuery.error} title="Could not load salary structure details" />
                            ) : (
                                <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Structure Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Executive Staff" />
                                <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Select Components</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    {availableComponents.map(comp => {
                                        const isSelected = formData.components.find((c) => (
                                            String(c.componentId) === String(comp.id) ||
                                            normalizeText(c.name) === normalizeText(comp.name)
                                        ));
                                        return (
                                            <div
                                                key={comp.id}
                                                onClick={() => toggleComponent(comp.id)}
                                                style={{
                                                    padding: '0.75rem',
                                                    border: `1px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    background: isSelected ? 'var(--color-primary-50)' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{comp.name}</span>
                                                    {isSelected && <Check size={16} color="var(--color-primary-600)" />}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                                    <span style={{
                                                        color: comp.type === 'deduction' ? 'var(--color-error-600)' : 'var(--color-success-600)',
                                                        background: comp.type === 'deduction' ? 'var(--color-error-50)' : 'var(--color-success-50)',
                                                        padding: '0.1rem 0.4rem', borderRadius: '4px'
                                                    }}>{comp.type === 'deduction' ? 'Deduction' : 'Earning'}</span>
                                                    <span style={{ color: 'var(--color-text-secondary)', background: 'var(--color-slate-100)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{comp.calculationType}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                                </>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common:actions.cancel')}</Button>
                            <Button onClick={handleSubmit} disabled={updateStructureMutation.isPending || createStructureMutation.isPending}>
                                {editingId ? 'Save Changes' : 'Create Structure'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SalaryStructures;
