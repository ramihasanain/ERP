import React, { useEffect, useMemo, useState } from 'react';
import { useHR } from '@/context/HRContext';
import { useCustomQuery } from '@/hooks/useQuery';
import { useCustomPost, useCustomRemove } from '@/hooks/useMutation';
import { post } from '@/api';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Edit3, Trash2, Save, Eye, FileText, Copy, ArrowLeft, Star, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import { toast } from 'sonner';

const humanizeTag = (tag) => tag.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const formatTemplateDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsed);
};

const ContractTemplates = () => {
    const navigate = useNavigate();
    const { updateContractTemplate } = useHR();
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewEmployee, setPreviewEmployee] = useState('');
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [isWidePreviewHeader, setIsWidePreviewHeader] = useState(
        typeof window !== 'undefined' ? window.innerWidth > 850 : true
    );
    const [isLargeEditorLayout, setIsLargeEditorLayout] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1200 : true
    );
    const [formData, setFormData] = useState({ name: '', contract_type: 'full_time', body: '', is_default: false });
    const employeesQuery = useCustomQuery('/api/hr/employees/', ['hr-employees-contract-preview']);
    const templatesQuery = useCustomQuery('/api/hr/contract-templates/', ['hr-contract-templates']);
    const tagsQuery = useCustomQuery('/api/hr/contract-templates/tags/', ['hr-contract-template-tags']);
    const [isRenderingPreview, setIsRenderingPreview] = useState(false);
    const createTemplateMutation = useCustomPost('/api/hr/contract-templates/', [['hr-contract-templates']]);
    const deleteTemplateMutation = useCustomRemove(
        (templateId) => `/api/hr/contract-templates/${templateId}/`,
        [['hr-contract-templates']]
    );
    const activeEmployees = useMemo(
        () => (employeesQuery.data?.data || []).filter((employee) => employee.status === 'active'),
        [employeesQuery.data]
    );
    const templatesFromApi = useMemo(() => {
        const rows = templatesQuery.data?.data;
        if (!Array.isArray(rows)) return [];
        return rows.map((template) => ({
            id: template.id,
            name: template.name,
            contractType: template.contract_type || 'full_time',
            type: template.contract_type_display || template.contract_type || '—',
            content: template.body || '',
            isDefault: Boolean(template.is_default),
            lastModified: formatTemplateDate(template.updated_at),
        }));
    }, [templatesQuery.data]);
    const availableVariables = useMemo(() => {
        // Django endpoint returns { tags: [...] } as top-level payload.
        const tagsPayload = tagsQuery.data;
        const tags =
            tagsPayload?.tags ||
            tagsPayload?.data?.tags ||
            [];
        if (!Array.isArray(tags)) return [];
        return tags.map((tag) => ({ key: tag, label: humanizeTag(tag) }));
    }, [tagsQuery.data]);
    useEffect(() => {
        if (!activeEmployees.length) return;
        const selectedEmployeeExists = activeEmployees.some((employee) => employee.id === previewEmployee);
        if (!selectedEmployeeExists) {
            setPreviewEmployee(activeEmployees[0].id);
        }
    }, [activeEmployees, previewEmployee]);

    useEffect(() => {
        const handleResize = () => {
            setIsWidePreviewHeader(window.innerWidth > 850);
            setIsLargeEditorLayout(window.innerWidth >= 1200);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name || '',
            contract_type: template.contractType || 'full_time',
            body: template.content || '',
            is_default: Boolean(template.isDefault),
        });
    };

    const handleNew = () => {
        setEditingTemplate({ id: null });
        setFormData({ name: '', contract_type: 'full_time', body: '', is_default: false });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.body) {
            toast.error('Please fill in template name and body.');
            return;
        }
        if (editingTemplate?.id) {
            updateContractTemplate(editingTemplate.id, {
                name: formData.name,
                type: formData.contract_type,
                content: formData.body,
                isDefault: formData.is_default,
            });
            toast.success('Template updated successfully.');
            setEditingTemplate(null);
            return;
        }
        try {
            await createTemplateMutation.mutateAsync({
                name: formData.name,
                contract_type: formData.contract_type,
                is_default: Boolean(formData.is_default),
                body: formData.body,
            });
            toast.success('Template created successfully.');
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not create contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not create contract template.');
            return;
        }
        setEditingTemplate(null);
    };

    const handlePreview = async (template) => {
        if (!previewEmployee) {
            toast.error('Please select an employee for preview.');
            return;
        }
        setPreviewData({ templateId: template.id, templateName: template.name });
        setPreviewHtml('');
        setIsRenderingPreview(true);
        try {
            const response = await post(`/api/hr/contract-templates/${template.id}/render/?output=html`, {
                employee_id: previewEmployee,
            });
            const html =
                typeof response === 'string'
                    ? response
                    : typeof response?.data === 'string'
                        ? response.data
                        : typeof response?.html === 'string'
                            ? response.html
                            : '';
            if (!html) {
                toast.error('Template render returned empty HTML.');
                return;
            }
            setPreviewHtml(html);
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not render contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not render contract template.');
        } finally {
            setIsRenderingPreview(false);
        }
    };

    const handlePrint = () => {
        if (!previewHtml) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title></title>
                <style>
                    @page { size: auto; margin: 0; }
                    html, body { margin: 0; padding: 0; }
                    body {
                        font-family: 'Times New Roman', serif;
                        line-height: 1.8;
                        font-size: 14px;
                        color: #000;
                        background: #fff;
                    }
                    .print-root {
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="print-root">${previewHtml}</div>
            </body>
            </html>
        `);
        printWindow.document.title = '';
        printWindow.document.close();
        printWindow.print();
    };

    const getCopyContent = () => {
        if (!previewHtml) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(previewHtml, 'text/html');
        const bodyChildren = Array.from(doc.body.children);

        if (bodyChildren.length === 1 && bodyChildren[0].tagName.toLowerCase() === 'div') {
            return bodyChildren[0].innerHTML;
        }

        return doc.body.innerHTML || previewHtml;
    };

    const handleCopy = async () => {
        const contentToCopy = getCopyContent();
        if (!contentToCopy) return;
        await navigator.clipboard.writeText(contentToCopy);
        toast.success('Copied to clipboard.');
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete?.id) return;
        try {
            await deleteTemplateMutation.mutateAsync(templateToDelete.id);
            toast.success('Template deleted successfully.');
            setTemplateToDelete(null);
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not delete contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not delete contract template.');
        }
    };

    const insertVariable = (key) => {
        const textarea = document.getElementById('template-editor');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.body;
            const newText = text.substring(0, start) + `{{${key}}}` + text.substring(end);
            setFormData({ ...formData, body: newText });
        }
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
    };
    const renderVariablesList = (compact = false) => (
        <Card
            className="padding-md"
            style={
                compact
                    ? undefined
                    : {
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                    }
            }
        >
            {!isLargeEditorLayout && (
                <>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Available Variables</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Click to insert at cursor position.
                    </p>
                </>
            )}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    flex: compact ? undefined : 1,
                    minHeight: 0,
                    maxHeight: compact ? '180px' : 'none',
                    overflowY: 'auto',
                }}
            >
                {tagsQuery.isLoading ? (
                    <Spinner />
                ) : tagsQuery.isError ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-error)' }}>
                            Could not load available variables.
                        </p>
                        <Button size="sm" variant="outline" onClick={() => tagsQuery.refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : availableVariables.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        No variables available.
                    </p>
                ) : (
                    availableVariables.map(v => (
                        <button
                            key={v.key}
                            onClick={() => insertVariable(v.key)}
                            style={{
                                padding: '6px 10px', border: 'none', borderRadius: '6px',
                                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <span>{v.label}</span>
                            <code style={{ fontSize: '0.7rem', color: 'var(--color-primary-600)', background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                                {`{{${v.key}}}`}
                            </code>
                        </button>
                    ))
                )}
            </div>
        </Card>
    );

    // Preview Modal
    if (previewData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: isWidePreviewHeader ? 'nowrap' : 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: isWidePreviewHeader ? '1 1 auto' : '1 1 320px', minWidth: 0 }}>
                        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => setPreviewData(null)} />
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Contract Preview</h1>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{previewData.templateName}</p>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginLeft: 'auto',
                            flex: isWidePreviewHeader ? '0 0 auto' : '1 1 100%',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Button
                            variant="outline"
                            icon={<Copy size={16} />}
                            disabled={!previewHtml}
                            onClick={handleCopy}
                        >
                            Copy
                        </Button>
                        <Button icon={<Printer size={16} />} onClick={handlePrint} disabled={!previewHtml}>
                            Print
                        </Button>
                    </div>
                </div>
                <Card className="padding-lg" style={{ background: 'var(--color-bg-surface)', maxWidth: '900px', margin: '0 auto', width: '100%', border: '1px solid var(--color-border)' }}>
                    {isRenderingPreview ? (
                        <Spinner />
                    ) : !previewHtml ? (
                        <div style={{ color: 'var(--color-text-secondary)', padding: '1rem' }}>
                            No rendered HTML returned for this template.
                        </div>
                    ) : (
                        <iframe
                            title={`${previewData.templateName} preview`}
                            srcDoc={previewHtml}
                            style={{
                                width: '100%',
                                minHeight: '70vh',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                background: 'var(--color-bg-card)',
                            }}
                        />
                    )}
                </Card>
            </div>
        );
    }

    // Editor View
    if (editingTemplate) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => setEditingTemplate(null)} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingTemplate.id ? 'Edit Template' : 'New Template'}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button variant="ghost" onClick={() => setEditingTemplate(null)} disabled={createTemplateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button icon={<Save size={16} />} onClick={handleSave} isLoading={createTemplateMutation.isPending}>
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
                    {/* Left: Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                        <Card className="padding-md">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Input label="Template Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Standard Employment Contract" />
                                </div>
                                <div style={{ width: '220px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contract Type</label>
                                    <select style={selectStyle} value={formData.contract_type} onChange={e => setFormData({ ...formData, contract_type: e.target.value })}>
                                        <option value="full_time">Full-Time</option>
                                        <option value="part_time">Part-Time</option>
                                        <option value="fixed_term">Fixed-Term</option>
                                        <option value="freelance">Freelance</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content', paddingBottom: '0.4rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked })} style={{ width: '1rem', height: '1rem' }} />
                                        Set as Default
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {!isLargeEditorLayout && renderVariablesList(true)}

                        <Card className="padding-md" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Contract Body</label>
                            <textarea
                                id="template-editor"
                                value={formData.body}
                                onChange={e => setFormData({ ...formData, body: e.target.value })}
                                placeholder="Write your contract template here... Use {{variable_name}} for dynamic fields."
                                style={{
                                    width: '100%', height: '100%', minHeight: '500px', padding: '1rem',
                                    borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem', fontFamily: "'Courier New', monospace",
                                    lineHeight: 1.6, resize: 'vertical',
                                    background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)'
                                }}
                            />
                        </Card>
                    </div>

                    {/* Right: Variable Reference */}
                    {isLargeEditorLayout && renderVariablesList(false)}
                </div>
            </div>
        );
    }

    // List View
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/hr')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Contract Templates</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Create and manage employment contract formats.</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={handleNew}>New Template</Button>
            </div>

            {/* Preview Employee Selector */}
            <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Preview for:</span>
                <select
                    style={{ ...selectStyle, maxWidth: '400px' }}
                    value={previewEmployee}
                    onChange={e => setPreviewEmployee(e.target.value)}
                    disabled={employeesQuery.isLoading || !activeEmployees.length}
                >
                    {!activeEmployees.length && <option value="">No active employees</option>}
                    {activeEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} ({emp.position_name || 'No Position'} - {emp.department_name || 'No Department'})
                        </option>
                    ))}
                </select>
            </Card>

            {/* Templates Grid */}
            {templatesQuery.isLoading ? (
                <Spinner />
            ) : templatesQuery.isError ? (
                <ResourceLoadError
                    error={templatesQuery.error}
                    title="Could not load contract templates"
                    onGoBack={() => navigate(-1)}
                    onRefresh={() => templatesQuery.refetch()}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {templatesFromApi.length === 0 && (
                        <Card className="padding-lg" style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                No contract templates found.
                            </p>
                        </Card>
                    )}
                    {templatesFromApi.map((template) => (
                        <Card
                            key={template.id}
                            className="padding-lg"
                            style={{
                                border: template.isDefault ? '2px solid var(--color-primary-300)' : undefined,
                                background: template.isDefault
                                    ? 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))'
                                    : undefined,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div
                                            style={{
                                                width: '3rem',
                                                height: '3rem',
                                                borderRadius: '12px',
                                                background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                                                color: 'var(--color-primary-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <FileText size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{template.name}</h3>
                                                {template.isDefault && <Star size={14} style={{ color: 'var(--color-warning)' }} fill="var(--color-warning)" />}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: 'var(--color-bg-subtle)',
                                                    color: 'var(--color-text-secondary)',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {template.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    Last modified:{' '}
                                    <span dir="ltr" style={{ unicodeBidi: 'isolate', display: 'inline-block', textAlign: 'left' }}>
                                        {template.lastModified}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'var(--color-bg-secondary)',
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        maxHeight: '100px',
                                        overflow: 'hidden',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: 1.5,
                                        marginBottom: '1rem',
                                        position: 'relative',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    {(template.content || '').substring(0, 200)}...
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: '40px',
                                            background: 'linear-gradient(transparent, var(--color-bg-secondary))',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="outline" icon={<Eye size={14} />} onClick={() => handlePreview(template)} style={{ flex: 1 }}>
                                    Preview
                                </Button>
                                <Button size="sm" variant="outline" icon={<Edit3 size={14} />} onClick={() => handleEdit(template)} style={{ flex: 1 }}>
                                    Edit
                                </Button>
                                {!template.isDefault && (
                                    <button
                                        onClick={() => setTemplateToDelete(template)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '0 8px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {templateToDelete && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1100,
                        padding: '1rem',
                    }}
                >
                    <Card className="padding-lg" style={{ width: '100%', maxWidth: '460px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Delete template?
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                            Are you sure you want to delete <strong>{templateToDelete.name}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <Button
                                variant="ghost"
                                onClick={() => setTemplateToDelete(null)}
                                disabled={deleteTemplateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteTemplate}
                                isLoading={deleteTemplateMutation.isPending}
                            >
                                Delete
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ContractTemplates;
