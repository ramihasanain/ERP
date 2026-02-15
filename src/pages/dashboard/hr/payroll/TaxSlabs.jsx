import React, { useState } from 'react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import { usePayroll } from '../../../../context/PayrollContext';
import { Plus, Trash2, Save, Percent, ShieldCheck } from 'lucide-react';

const TaxSlabs = () => {
    const { taxSlabs, setTaxSlabs } = usePayroll();
    const [localSlabs, setLocalSlabs] = useState([...taxSlabs]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddSlab = () => {
        const lastSlab = localSlabs[localSlabs.length - 1];
        const newMin = lastSlab ? lastSlab.max + 1 : 0;
        setLocalSlabs([...localSlabs, { id: Date.now(), min: newMin, max: newMin + 5000, rate: 0 }]);
    };

    const handleRemoveSlab = (id) => {
        setLocalSlabs(localSlabs.filter(s => s.id !== id));
    };

    const handleChange = (id, field, value) => {
        setLocalSlabs(localSlabs.map(s => s.id === id ? { ...s, [field]: Number(value) } : s));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setTaxSlabs(localSlabs);
            setIsSaving(false);
            alert('Tax Brackets saved successfully!');
        }, 1000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Income Tax Configuration</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Define progressive tax brackets for gross-to-net calculations.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Plus size={18} />} onClick={handleAddSlab}>Add Bracket</Button>
                    <Button variant="primary" icon={<Save size={18} />} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card className="padding-none" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-slate-50)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem' }}>Min Income (JOD)</th>
                                    <th style={{ padding: '1rem' }}>Max Income (JOD)</th>
                                    <th style={{ padding: '1rem' }}>Tax Rate (%)</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localSlabs.map((slab, index) => (
                                    <tr key={slab.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Input
                                                type="number"
                                                value={slab.min}
                                                onChange={(e) => handleChange(slab.id, 'min', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Input
                                                type="number"
                                                value={slab.max}
                                                onChange={(e) => handleChange(slab.id, 'max', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Input
                                                    type="number"
                                                    value={slab.rate}
                                                    onChange={(e) => handleChange(slab.id, 'rate', e.target.value)}
                                                    style={{ paddingRight: '2.5rem' }}
                                                />
                                                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                                    %
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <Button
                                                variant="ghost"
                                                icon={<Trash2 size={18} />}
                                                onClick={() => handleRemoveSlab(slab.id)}
                                                style={{ color: 'var(--color-error-600)' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card className="padding-md" style={{ border: '1px solid var(--color-primary-100)', background: 'var(--color-primary-50)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <ShieldCheck className="text-primary-600" />
                            <h4 style={{ fontWeight: 600 }}>Compliance Rules</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-800)', lineHeight: 1.5 }}>
                            These brackets will be used to calculate Income Tax (PAYE) during payroll runs.
                            Ensure brackets do not overlap to avoid calculation errors.
                        </p>
                    </Card>

                    <Card className="padding-md">
                        <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Quick Summary</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Total Brackets:</span>
                                <b>{localSlabs.length}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Effective Ceiling:</span>
                                <b>{Math.max(...localSlabs.map(s => s.max)).toLocaleString()} JOD</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Max Rate:</span>
                                <b>{Math.max(...localSlabs.map(s => s.rate))}%</b>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TaxSlabs;
