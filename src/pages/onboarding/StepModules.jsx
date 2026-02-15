import React from 'react';
import Card from '../../components/common/Card';
import { Layers, Users, Package } from 'lucide-react';

const modulesList = [
    { id: 'accounting', name: 'Accounting', icon: <Layers />, desc: 'Ledgers, Invoicing, Tax' },
    { id: 'hr', name: 'HR & Payroll', icon: <Users />, desc: 'Employees, Payroll, Leaves' },
    { id: 'inventory', name: 'Inventory', icon: <Package />, desc: 'Stock, Warehouses, POs' },
];

const StepModules = ({ data, updateData }) => {
    const toggleModule = (id) => {
        const current = data.modules || [];
        if (current.includes(id)) {
            updateData('modules', current.filter(m => m !== id));
        } else {
            updateData('modules', [...current, id]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Select Modules</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Choose the apps you want to start with.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modulesList.map((mod) => {
                    const isSelected = data.modules.includes(mod.id);
                    return (
                        <Card
                            key={mod.id}
                            className="padding-md"
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--color-primary-500)' : '1px solid var(--color-border)',
                                background: isSelected ? 'var(--color-primary-50)' : 'var(--color-bg-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onClick={() => toggleModule(mod.id)}
                        >
                            <div style={{ color: isSelected ? 'var(--color-primary-600)' : 'var(--color-text-muted)' }}>
                                {mod.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: 600 }}>{mod.name}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{mod.desc}</p>
                            </div>
                            <div style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                borderRadius: '50%',
                                border: isSelected ? 'none' : '2px solid var(--color-slate-300)',
                                background: isSelected ? 'var(--color-primary-600)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StepModules;
