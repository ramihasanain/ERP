import React, { useState } from 'react';
import { useHR } from '@/context/HRContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Edit3, Trash2, Save, X, Eye, FileText, Copy, ArrowLeft, Star, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const availableVariables = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_address', label: 'Company Address' },
    { key: 'company_registration', label: 'Registration No.' },
    { key: 'employee_full_name', label: 'Employee Full Name' },
    { key: 'employee_national_id', label: 'National ID' },
    { key: 'employee_address', label: 'Employee Address' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'manager_name', label: 'Manager Name' },
    { key: 'contract_start_date', label: 'Start Date' },
    { key: 'contract_end_date', label: 'End Date' },
    { key: 'basic_salary', label: 'Basic Salary' },
    { key: 'housing_allowance', label: 'Housing Allowance' },
    { key: 'transportation_allowance', label: 'Transport Allowance' },
    { key: 'other_allowance', label: 'Other Allowances' },
    { key: 'total_salary', label: 'Total Salary' },
    { key: 'currency', label: 'Currency' },
    { key: 'probation_period', label: 'Probation (Months)' },
    { key: 'probation_notice', label: 'Probation Notice (Days)' },
    { key: 'annual_leave_days', label: 'Annual Leave Days' },
    { key: 'ss_employee_rate', label: 'SS Employee Rate %' },
    { key: 'notice_period', label: 'Notice Period (Days)' },
    { key: 'working_hours', label: 'Working Hours/Week' },
];

const ContractTemplates = () => {
    const navigate = useNavigate();
    const { contractTemplates, addContractTemplate, updateContractTemplate, deleteContractTemplate, generateContract, employees } = useHR();
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewEmployee, setPreviewEmployee] = useState('EMP-001');
    const [formData, setFormData] = useState({ name: '', type: 'Full-Time', content: '', isDefault: false });

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({ name: template.name, type: template.type, content: template.content, isDefault: template.isDefault });
    };

    const handleNew = () => {
        setEditingTemplate({ id: null });
        setFormData({ name: '', type: 'Full-Time', content: '', isDefault: false });
    };

    const handleSave = () => {
        if (!formData.name || !formData.content) return;
        if (editingTemplate?.id) {
            updateContractTemplate(editingTemplate.id, formData);
        } else {
            addContractTemplate(formData);
        }
        setEditingTemplate(null);
    };

    const handlePreview = (template) => {
        const generated = generateContract(template.id, previewEmployee);
        setPreviewData({ templateName: template.name, content: generated });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Contract - ${previewData.templateName}</title>
            <style>body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; font-size: 14px; white-space: pre-wrap; }</style>
            </head><body>${previewData.content}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const insertVariable = (key) => {
        const textarea = document.getElementById('template-editor');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.content;
            const newText = text.substring(0, start) + `{{${key}}}` + text.substring(end);
            setFormData({ ...formData, content: newText });
        }
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
    };

    // Preview Modal
    if (previewData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => setPreviewData(null)} />
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Contract Preview</h1>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{previewData.templateName}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button variant="outline" icon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(previewData.content)}>Copy</Button>
                        <Button icon={<Printer size={16} />} onClick={handlePrint}>Print</Button>
                    </div>
                </div>
                <Card className="padding-lg" style={{ background: 'var(--color-bg-surface)', maxWidth: '800px', margin: '0 auto', width: '100%', border: '1px solid var(--color-border)' }}>
                    <pre style={{
                        fontFamily: "'Times New Roman', serif", fontSize: '0.95rem',
                        lineHeight: 1.8, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                        color: 'var(--color-text-main)'
                    }}>
                        {previewData.content}
                    </pre>
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
                        <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSave}>Save Template</Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
                    {/* Left: Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Card className="padding-md">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <Input label="Template Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Standard Employment Contract" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contract Type</label>
                                    <select style={selectStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Fixed-Term">Fixed-Term</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} style={{ width: '1rem', height: '1rem' }} />
                                        Set as Default
                                    </label>
                                </div>
                            </div>
                        </Card>

                        <Card className="padding-md" style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Contract Body</label>
                            <textarea
                                id="template-editor"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write your contract template here... Use {{variable_name}} for dynamic fields."
                                style={{
                                    width: '100%', minHeight: '500px', padding: '1rem',
                                    borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem', fontFamily: "'Courier New', monospace",
                                    lineHeight: 1.6, resize: 'vertical',
                                    background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)'
                                }}
                            />
                        </Card>
                    </div>

                    {/* Right: Variable Reference */}
                    <Card className="padding-md" style={{ alignSelf: 'flex-start', position: 'sticky', top: '5rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Available Variables</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Click to insert at cursor position.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '600px', overflowY: 'auto' }}>
                            {availableVariables.map(v => (
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
                            ))}
                        </div>
                    </Card>
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
                <select style={{ ...selectStyle, maxWidth: '300px' }} value={previewEmployee} onChange={e => setPreviewEmployee(e.target.value)}>
                    {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.id})</option>
                    ))}
                </select>
            </Card>

            {/* Templates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {contractTemplates.map(template => (
                    <Card key={template.id} className="padding-lg" style={{
                        border: template.isDefault ? '2px solid var(--color-primary-300)' : undefined,
                        background: template.isDefault ? 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))' : undefined
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '3rem', height: '3rem', borderRadius: '12px',
                                    background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))', color: 'var(--color-primary-600)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{template.name}</h3>
                                        {template.isDefault && <Star size={14} style={{ color: 'var(--color-warning)' }} fill="var(--color-warning)" />}
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                        background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontWeight: 500
                                    }}>{template.type}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Last modified: {template.lastModified}
                        </div>

                        <div style={{
                            padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-secondary)',
                            fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '100px', overflow: 'hidden',
                            color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem',
                            position: 'relative', border: '1px solid var(--color-border)',
                        }}>
                            {template.content.substring(0, 200)}...
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
                                background: 'linear-gradient(transparent, var(--color-bg-secondary))'
                            }} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="outline" icon={<Eye size={14} />} onClick={() => handlePreview(template)} style={{ flex: 1 }}>Preview</Button>
                            <Button size="sm" variant="outline" icon={<Edit3 size={14} />} onClick={() => handleEdit(template)} style={{ flex: 1 }}>Edit</Button>
                            {!template.isDefault && (
                                <button onClick={() => deleteContractTemplate(template.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '0 8px' }}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ContractTemplates;
