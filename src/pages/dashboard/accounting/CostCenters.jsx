import React, { useState } from 'react';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import {
    Plus, Edit3, Trash2, Target,
    AlertTriangle, CheckCircle, X, Save, Eye
} from 'lucide-react';

const CostCenters = () => {
    const { costCenters, budgetUsage, addCostCenter, updateCostCenter, deleteCostCenter, openDrawer } = useAccounting();
    const [viewMode, setViewMode] = useState('list'); // list, add, edit
    const [formData, setFormData] = useState({ name: '', code: '', budget: '' });
    const [editingId, setEditingId] = useState(null);

    const handleSave = () => {
        if (!formData.name || !formData.code || !formData.budget) return;

        const data = {
            name: formData.name,
            code: formData.code,
            budget: Number(formData.budget)
        };

        if (viewMode === 'edit' && editingId) {
            updateCostCenter(editingId, data);
        } else {
            addCostCenter(data);
        }
        resetForm();
    };

    const handleEdit = (cc) => {
        setFormData({ name: cc.name, code: cc.code, budget: cc.budget });
        setEditingId(cc.id);
        setViewMode('edit');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this cost center?')) {
            deleteCostCenter(id);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', code: '', budget: '' });
        setEditingId(null);
        setViewMode('list');
    };

    // Calculate totals
    const totalBudget = costCenters.reduce((sum, cc) => sum + Number(cc.budget || 0), 0);
    const totalActual = costCenters.reduce((sum, cc) => sum + (budgetUsage[cc.id] || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Target size={28} color="var(--color-primary-600)" />
                        Cost Centers & Budgets
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Manage departmental budgets and track actual spending.
                    </p>
                </div>
                {viewMode === 'list' && (
                    <Button icon={<Plus size={18} />} onClick={() => setViewMode('add')}>New Cost Center</Button>
                )}
            </div>

            {/* Form Mode */}
            {viewMode !== 'list' && (
                <Card className="padding-lg" style={{ maxWidth: '600px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        {viewMode === 'add' ? 'Add New Cost Center' : 'Edit Cost Center'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Cost Center Name"
                                placeholder="e.g. Marketing"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Input
                                label="Code"
                                placeholder="e.g. MKT"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Annual Budget ($)"
                            type="number"
                            placeholder="0.00"
                            value={formData.budget}
                            onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                            <Button icon={<Save size={18} />} onClick={handleSave}>Save Cost Center</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            {viewMode === 'list' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <SummaryCard
                        title="Total Budget"
                        value={`$${totalBudget.toLocaleString()}`}
                        icon={<Target size={20} />}
                        color="var(--color-primary-600)"
                    />
                    <SummaryCard
                        title="Total Spent"
                        value={`$${totalActual.toLocaleString()}`}
                        icon={<AlertTriangle size={20} />}
                        color="var(--color-warning)"
                    />
                    <SummaryCard
                        title="Remaining"
                        value={`$${(totalBudget - totalActual).toLocaleString()}`}
                        icon={<CheckCircle size={20} />}
                        color="var(--color-success)"
                    />
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <Card className="padding-none">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', width: '10%' }}>Code</th>
                                <th style={{ padding: '1rem', width: '25%' }}>Name</th>
                                <th style={{ padding: '1rem', width: '35%' }}>Budget Utilization</th>
                                <th style={{ padding: '1rem', width: '15%', textAlign: 'right' }}>Budget</th>
                                <th style={{ padding: '1rem', width: '15%', textAlign: 'right' }}>Actual</th>
                                <th style={{ padding: '1rem', width: '10%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costCenters.map(cc => {
                                const actual = budgetUsage[cc.id] || 0;
                                const budget = Number(cc.budget) || 0;
                                const percent = budget > 0 ? (actual / budget) * 100 : 0;
                                const isOver = actual > budget;

                                return (
                                    <tr key={cc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                                            <span style={{ padding: '0.2rem 0.5rem', background: 'var(--color-slate-100)', borderRadius: '4px' }}>
                                                {cc.code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{cc.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: 'var(--color-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.min(percent, 100)}%`,
                                                        height: '100%',
                                                        background: isOver ? 'var(--color-error)' : percent > 80 ? 'var(--color-warning)' : 'var(--color-success)'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontWeight: 600, minWidth: '40px', textAlign: 'right', color: isOver ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                                                    {percent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ${budget.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: isOver ? 'var(--color-error)' : 'var(--color-text-main)' }}>
                                            ${actual.toLocaleString()}
                                            {isOver && <AlertTriangle size={14} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => openDrawer('Cost Center', cc.id)}
                                                    style={{ ...iconBtnStyle, color: 'var(--color-primary-600)' }}
                                                    title="View Activity"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handleEdit(cc)} style={iconBtnStyle} title="Edit"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(cc.id)} style={{ ...iconBtnStyle, color: 'var(--color-error)' }} title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {costCenters.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No cost centers defined. Click "New Cost Center" to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

const SummaryCard = ({ title, value, icon, color }) => (
    <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `${color}15`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</h3>
        </div>
    </Card>
);

const iconBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-muted)', padding: '0.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default CostCenters;
