import React, { useState } from 'react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import { usePayroll } from '../../../../context/PayrollContext';
import { Plus, Edit2, Layers, Check, X } from 'lucide-react';

const SalaryStructures = () => {
    const { salaryStructures, salaryComponents, addSalaryStructure, updateSalaryStructure } = usePayroll();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        components: [] // Array of { componentId, type: 'Fixed', value: 0 }
    });

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', components: [] });
        setIsModalOpen(true);
    };

    const openEdit = (struct) => {
        setEditingId(struct.id);
        setFormData(struct);
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateSalaryStructure(editingId, formData);
        } else {
            addSalaryStructure(formData);
        }
        setIsModalOpen(false);
    };

    const toggleComponent = (compId) => {
        const exists = formData.components.find(c => c.componentId === compId);
        if (exists) {
            setFormData(prev => ({
                ...prev,
                components: prev.components.filter(c => c.componentId !== compId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                components: [...prev.components, { componentId: compId, type: 'Fixed', value: 0 }]
            }));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Salary Structures</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Define payroll templates for different employee groups.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={openCreate}>Create Structure</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {salaryStructures.map(struct => (
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
                            <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => openEdit(struct)} />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{struct.description}</p>

                        <div style={{ background: 'var(--color-slate-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', maxHeight: '150px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {struct.components.map((c, i) => {
                                    const compDetails = salaryComponents.find(sc => sc.id === c.componentId);
                                    return (
                                        <span key={i} style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.6rem',
                                            background: 'white',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '1rem',
                                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                                        }}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: compDetails?.type === 'Deduction' ? 'var(--color-error-500)' : 'var(--color-success-500)'
                                            }}></span>
                                            {compDetails?.name || c.componentId}
                                        </span>
                                    );
                                })}
                            </div>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Structure Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Executive Staff" />
                                <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Select Components</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    {salaryComponents.map(comp => {
                                        const isSelected = formData.components.find(c => c.componentId === comp.id);
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
                                                        color: comp.type === 'Deduction' ? 'var(--color-error-600)' : 'var(--color-success-600)',
                                                        background: comp.type === 'Deduction' ? 'var(--color-error-50)' : 'var(--color-success-50)',
                                                        padding: '0.1rem 0.4rem', borderRadius: '4px'
                                                    }}>{comp.type}</span>
                                                    <span style={{ color: 'var(--color-text-secondary)', background: 'var(--color-slate-100)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{comp.calculationType}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit}>{editingId ? 'Save Changes' : 'Create Structure'}</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SalaryStructures;
