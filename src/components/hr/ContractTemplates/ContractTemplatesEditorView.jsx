import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import ContractTemplatesVariablesPanel from './ContractTemplatesVariablesPanel';
import { contractTypeOptions, selectStyle } from './utils';

const ContractTemplatesEditorView = ({
    isEditPage,
    templateDetailsQuery,
    navigate,
    isCompactEditorHeader,
    createTemplateMutation,
    updateTemplateMutation,
    onSave,
    isLargeEditorLayout,
    isNarrowEditorForm,
    formData,
    setFormData,
    tagsQuery,
    availableVariables,
    onInsertVariable,
}) => {
    if (isEditPage && templateDetailsQuery.isLoading) return <Spinner />;
    if (isEditPage && templateDetailsQuery.isError) {
        return (
            <ResourceLoadError
                error={templateDetailsQuery.error}
                title="Could not load contract template"
                onGoBack={() => navigate('/admin/hr/contract-templates')}
                onRefresh={() => templateDetailsQuery.refetch()}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isCompactEditorHeader ? 'flex-start' : 'center',
                    flexDirection: isCompactEditorHeader ? 'column' : 'row',
                    gap: isCompactEditorHeader ? '0.75rem' : 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/hr/contract-templates')} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{isEditPage ? 'Edit Template' : 'New Template'}</h1>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: isCompactEditorHeader ? 'flex-end' : 'initial',
                        width: isCompactEditorHeader ? '100%' : 'auto',
                    }}
                >
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/hr/contract-templates')}
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button icon={<Save size={16} />} onClick={onSave} isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                        Save Template
                    </Button>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isLargeEditorLayout ? '1fr 280px' : '1fr',
                    gap: '1.5rem',
                    alignItems: 'stretch',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                    <Card className="padding-md" style={{ minHeight: '130px' }}>
                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                alignItems: isNarrowEditorForm ? 'stretch' : 'flex-end',
                                flexDirection: isNarrowEditorForm ? 'column' : 'row',
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Input
                                    label="Template Name *"
                                    value={formData.name}
                                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                    placeholder="e.g. Standard Employment Contract"
                                />
                            </div>
                            <div
                                style={{
                                    width: isNarrowEditorForm ? '100%' : '220px',
                                    minWidth: isNarrowEditorForm ? 0 : '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                }}
                            >
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contract Type</label>
                                <select
                                    style={selectStyle}
                                    value={formData.contract_type}
                                    onChange={(event) => setFormData({ ...formData, contract_type: event.target.value })}
                                >
                                    {contractTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: 'fit-content',
                                    paddingBottom: isNarrowEditorForm ? 0 : '0.4rem',
                                }}
                            >
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_default}
                                        onChange={(event) => setFormData({ ...formData, is_default: event.target.checked })}
                                        style={{ width: '1rem', height: '1rem' }}
                                    />
                                    Set as Default
                                </label>
                            </div>
                        </div>
                    </Card>

                    {!isLargeEditorLayout && (
                        <ContractTemplatesVariablesPanel
                            compact
                            isLargeEditorLayout={isLargeEditorLayout}
                            tagsQuery={tagsQuery}
                            availableVariables={availableVariables}
                            onInsertVariable={onInsertVariable}
                        />
                    )}

                    <Card className="padding-md" style={{ display: 'flex', flexDirection: 'column', height: '575px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Contract Body</label>
                        <textarea
                            id="template-editor"
                            value={formData.body}
                            onChange={(event) => setFormData({ ...formData, body: event.target.value })}
                            placeholder="Write your contract template here... Use {{variable_name}} for dynamic fields."
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                fontFamily: "'Courier New', monospace",
                                lineHeight: 1.6,
                                resize: 'vertical',
                                background: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-main)',
                            }}
                        />
                    </Card>
                </div>

                {isLargeEditorLayout && (
                    <ContractTemplatesVariablesPanel
                        isLargeEditorLayout={isLargeEditorLayout}
                        tagsQuery={tagsQuery}
                        availableVariables={availableVariables}
                        onInsertVariable={onInsertVariable}
                    />
                )}
            </div>
        </div>
    );
};

export default ContractTemplatesEditorView;
