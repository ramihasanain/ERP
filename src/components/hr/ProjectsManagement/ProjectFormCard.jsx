import React from 'react';
import { Save, X } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { selectStyle } from './utils';

const ProjectFormCard = ({
    showForm,
    editingProject,
    formData,
    isLoadingEdit,
    isSubmitting,
    isEditUnchanged,
    onFormChange,
    onCancel,
    onSubmit,
}) => {
    if (!showForm) return null;

    const hasRequiredFields = Boolean(formData.name.trim() && formData.startDate && formData.endDate);
    const hasInvalidDateRange = Boolean(formData.startDate && formData.endDate && formData.startDate >= formData.endDate);
    const isSubmitDisabled =
        isSubmitting || isLoadingEdit || (editingProject && isEditUnchanged) || !hasRequiredFields;

    return (
        <Card
            className="padding-lg"
            style={{
                border: '2px solid var(--color-border)',
                background:
                    'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingProject ? 'Edit Project' : 'New Project'}</h3>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    <X size={20} />
                </button>
            </div>
            {isLoadingEdit && (
                <p style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Loading project details...
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <Input
                    label="Project Name *"
                    value={formData.name}
                    onChange={(event) => onFormChange({ name: event.target.value })}
                    placeholder="e.g. ERP Development"
                />
                <Input
                    label="Client"
                    value={formData.client}
                    onChange={(event) => onFormChange({ client: event.target.value })}
                    placeholder="e.g. TechCo Inc."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
                    <select style={selectStyle} value={formData.status} onChange={(event) => onFormChange({ status: event.target.value })}>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <Input
                    label="Start Date *"
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => onFormChange({ startDate: event.target.value })}
                />
                <Input
                    label="End Date *"
                    type="date"
                    value={formData.endDate}
                    error={hasInvalidDateRange ? 'End date must be after the start date.' : ''}
                    onChange={(event) => onFormChange({ endDate: event.target.value })}
                />
                <Input
                    label="Description"
                    value={formData.description}
                    onChange={(event) => onFormChange({ description: event.target.value })}
                    placeholder="Brief description..."
                />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    icon={<Save size={16} />}
                    onClick={onSubmit}
                    disabled={isSubmitDisabled}
                >
                    {editingProject ? 'Update' : 'Create'}
                </Button>
            </div>
        </Card>
    );
};

export default ProjectFormCard;
