import React, { useState } from 'react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import { usePayroll } from '../../../../context/PayrollContext';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown } from 'lucide-react';
import FormulaBuilder from './FormulaBuilder';

const SalaryComponents = () => {
    const { salaryComponents, addSalaryComponent, updateSalaryComponent } = usePayroll();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', type: 'Earning', calculationType: 'Fixed', isTaxable: true, glCode: '', formula: ''
    });

    const variables = [
        { code: 'BASIC', name: 'Basic Salary' },
        { code: 'GROSS', name: 'Gross Pay' },
        { code: 'OT_HOURS', name: 'Overtime Hours' },
        { code: 'ABSENT_DAYS', name: 'Absent Days' },
        { code: 'WORKING_DAYS', name: 'Working Days' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateSalaryComponent(editingId, formData);
        } else {
            addSalaryComponent(formData);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ code: '', name: '', type: 'Earning', calculationType: 'Fixed', isTaxable: true, glCode: '' });
    };

    const openEdit = (comp) => {
        setEditingId(comp.id);
        setFormData(comp);
        setIsModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Salary Components</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage earnings, deductions, and company contributions.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Add Component</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {salaryComponents.map(comp => (
                    <Card key={comp.id} className="padding-md">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    background: comp.type === 'Deduction' ? 'var(--color-error-50)' : 'var(--color-success-50)',
                                    color: comp.type === 'Deduction' ? 'var(--color-error-600)' : 'var(--color-success-600)'
                                }}>
                                    {comp.type === 'Deduction' ? <TrendingDown size={20} /> : <DollarSign size={20} />}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{comp.name}</h3>
                                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: 'var(--color-slate-100)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>{comp.code}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => openEdit(comp)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <div>Type: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{comp.type}</span></div>
                            <div>Calc: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{comp.calculationType}</span></div>
                            <div>Taxable: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{comp.isTaxable ? 'Yes' : 'No'}</span></div>
                            <div>GL Code: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{comp.glCode || '-'}</span></div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Simple Modal Implementation */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card style={{ width: '500px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>{editingId ? 'Edit Component' : 'New Component'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                <Input label="Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                                    <select
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Earning">Earning</option>
                                        <option value="Deduction">Deduction</option>
                                        <option value="Contribution">Company Contribution</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Calculation</label>
                                    <select
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                        value={formData.calculationType}
                                        onChange={e => setFormData({ ...formData, calculationType: e.target.value })}
                                    >
                                        <option value="Fixed">Fixed Amount</option>
                                        <option value="Percentage">Percentage</option>
                                        <option value="Formula">Formula</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="GL Code" value={formData.glCode} onChange={e => setFormData({ ...formData, glCode: e.target.value })} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem' }}>
                                    <input type="checkbox" checked={formData.isTaxable} onChange={e => setFormData({ ...formData, isTaxable: e.target.checked })} />
                                    <label>Is Taxable?</label>
                                </div>
                            </div>

                            {formData.calculationType === 'Formula' && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Formula Configuration</label>
                                    <FormulaBuilder
                                        value={formData.formula}
                                        onChange={(val) => setFormData({ ...formData, formula: val })}
                                        variables={variables}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SalaryComponents;
