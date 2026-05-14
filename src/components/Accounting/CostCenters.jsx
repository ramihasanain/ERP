import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPatch, useCustomRemove } from '@/hooks/useMutation';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import {
    Plus, Edit3, Trash2, Target,
    AlertTriangle, CheckCircle, X, Save, Eye, ArrowLeft
} from 'lucide-react';

const CostCenters = () => {
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { addCostCenter, updateCostCenter, deleteCostCenter, openDrawer } = useAccounting();
    const [viewMode, setViewMode] = useState('list'); // list, add, edit
    const [formData, setFormData] = useState({ name: '', code: '', budget: '' });
    const [editingId, setEditingId] = useState(null);
    const [editBaseline, setEditBaseline] = useState(null);
    const [deletingCostCenter, setDeletingCostCenter] = useState(null);

    const deleteCostCenterMutation = useCustomRemove(
        (id) => `/accounting/cost-centers/${id}/`,
        ['accounting-cost-centers-summary', 'accounting-cost-centers']
    );

    const createCostCenterMutation = useCustomPost('/accounting/cost-centers/create/', [
        'accounting-cost-centers-summary',
        'accounting-cost-centers',
    ]);

    const updateCostCenterMutation = useCustomPatch(
        (id) => `/accounting/cost-centers/${id}/`,
        ['accounting-cost-centers-summary', 'accounting-cost-centers']
    );

    const costCentersQuery = useCustomQuery(
        '/accounting/cost-centers/',
        ['accounting-cost-centers'],
        {
            select: (res) => (Array.isArray(res?.data) ? res.data : []),
        }
    );

    const apiCostCenters = costCentersQuery.data ?? [];
    const listLoading = costCentersQuery.isPending;
    const listError = costCentersQuery.isError;

    const annualBudgetPayload = useMemo(() => {
        const trimmed = String(formData.budget ?? '').trim();
        if (!trimmed) return null;
        const n = Number(trimmed);
        if (!Number.isFinite(n)) return null;
        return n.toFixed(2);
    }, [formData.budget]);

    const isCreateFormComplete =
        Boolean(formData.name.trim()) &&
        Boolean(formData.code.trim()) &&
        annualBudgetPayload !== null;

    const isEditDirty =
        viewMode === 'edit' &&
        Boolean(editingId) &&
        Boolean(editBaseline) &&
        (formData.name.trim() !== editBaseline.name ||
            formData.code.trim() !== editBaseline.code ||
            (annualBudgetPayload ?? '') !== editBaseline.annual_budget);

    const saveDisabled =
        createCostCenterMutation.isPending ||
        updateCostCenterMutation.isPending ||
        (viewMode === 'add' && !isCreateFormComplete) ||
        (viewMode === 'edit' && (!isEditDirty || annualBudgetPayload === null));

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.code.trim() || !annualBudgetPayload) return;

        const data = {
            name: formData.name.trim(),
            code: formData.code.trim(),
            budget: Number(formData.budget),
        };

        if (viewMode === 'edit' && editingId) {
            if (!isEditDirty) return;
            const patchBody = {
                id: editingId,
                name: data.name,
                code: data.code,
                annual_budget: annualBudgetPayload,
            };
            try {
                const updated = await updateCostCenterMutation.mutateAsync(patchBody);
                updateCostCenter(editingId, {
                    name: updated?.name ?? data.name,
                    code: updated?.code ?? data.code,
                    budget: Number(updated?.annual_budget ?? updated?.budget ?? annualBudgetPayload),
                });
                toast.success('Cost center updated successfully.');
                resetForm();
            } catch (error) {
                toast.error(
                    error?.response?.data?.message ||
                        error?.response?.data?.detail ||
                        'Failed to update cost center.'
                );
            }
            return;
        }

        const payload = {
            name: data.name,
            code: data.code,
            annual_budget: annualBudgetPayload,
        };

        try {
            const created = await createCostCenterMutation.mutateAsync(payload);
            const budgetValue = Number(
                created?.annual_budget ?? created?.budget ?? formData.budget
            );
            addCostCenter({
                id: created?.id,
                name: created?.name ?? data.name,
                code: created?.code ?? data.code,
                budget: budgetValue,
            });
            toast.success('Cost center created successfully.');
            resetForm();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    'Failed to create cost center.'
            );
        }
    };

    const handleEdit = (cc) => {
        const budgetRaw = cc.annual_budget ?? cc.budget;
        const budgetStr =
            budgetRaw !== undefined && budgetRaw !== null && budgetRaw !== ''
                ? String(budgetRaw)
                : '';
        const budgetNum = Number(budgetRaw);
        const baselineBudget =
            budgetRaw !== undefined && budgetRaw !== null && budgetRaw !== '' && Number.isFinite(budgetNum)
                ? budgetNum.toFixed(2)
                : '';
        setEditBaseline({
            name: (cc.name || '').trim(),
            code: (cc.code || '').trim(),
            annual_budget: baselineBudget,
        });
        setFormData({ name: cc.name, code: cc.code, budget: budgetStr });
        setEditingId(cc.id);
        setViewMode('edit');
    };

    const handleRequestDelete = (cc) => {
        setDeletingCostCenter({
            id: cc.id,
            name: cc.name || '',
            code: cc.code || '',
        });
    };

    const handleConfirmDelete = async () => {
        const id = deletingCostCenter?.id;
        if (!id) {
            toast.error('No cost center selected.');
            return;
        }
        try {
            await deleteCostCenterMutation.mutateAsync(id);
            deleteCostCenter(id);
            toast.success('Cost center deleted successfully.');
            setDeletingCostCenter(null);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    'Failed to delete cost center.'
            );
        }
    };

    const resetForm = () => {
        setEditBaseline(null);
        setFormData({ name: '', code: '', budget: '' });
        setEditingId(null);
        setViewMode('list');
    };

    const summaryQuery = useCustomQuery(
        '/accounting/cost-centers/summary/',
        ['accounting-cost-centers-summary'],
        {
            select: (data) => ({
                totalBudget: Number(data?.total_budget ?? 0),
                totalSpent: Number(data?.total_spent ?? 0),
                remaining: Number(data?.remaining ?? 0),
            }),
        }
    );

    const summaryLoading = summaryQuery.isPending;
    const summaryError = summaryQuery.isError;
    const summary = summaryQuery.data;

    const formatSummaryValue = (amount) => {
        if (summaryLoading) return '…';
        if (summaryError) return '—';
        return `$${Number(amount).toLocaleString()}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(`${basePath}/accounting`)}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Target size={28} color="var(--color-primary-600)" />
                            Cost Centers & Budgets
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            Manage departmental budgets and track actual spending.
                        </p>
                    </div>
                </div>
                {viewMode === 'list' && (
                    <Button icon={<Plus size={18} />} onClick={() => setViewMode('add')} className="cursor-pointer shrink-0">New Cost Center</Button>
                )}
            </div>

            {/* Form Mode */}
            {viewMode !== 'list' && (
                <Card className="padding-lg" style={{ width: '100%' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        {viewMode === 'add' ? 'Add New Cost Center' : 'Edit Cost Center'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
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
                            <Button variant="ghost" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button
                                icon={<Save size={18} />}
                                onClick={handleSave}
                                disabled={saveDisabled}
                            >
                                Save Cost Center
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            {viewMode === 'list' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <SummaryCard
                        title="Total Budget"
                        value={formatSummaryValue(summary?.totalBudget)}
                        icon={<Target size={20} />}
                        color="var(--color-primary-600)"
                    />
                    <SummaryCard
                        title="Total Spent"
                        value={formatSummaryValue(summary?.totalSpent)}
                        icon={<AlertTriangle size={20} />}
                        color="var(--color-warning)"
                    />
                    <SummaryCard
                        title="Remaining"
                        value={formatSummaryValue(summary?.remaining)}
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
                            <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', width: '10%' }}>Code</th>
                                <th style={{ padding: '1rem', width: '25%' }}>Name</th>
                                <th style={{ padding: '1rem', width: '35%' }}>Budget Utilization</th>
                                <th style={{ padding: '1rem', width: '15%', textAlign: 'right' }}>Budget</th>
                                <th style={{ padding: '1rem', width: '15%', textAlign: 'right' }}>Actual</th>
                                <th style={{ padding: '1rem', width: '10%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listLoading && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Loading cost centers…
                                    </td>
                                </tr>
                            )}
                            {!listLoading && listError && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                        Could not load cost centers. Try again later.
                                    </td>
                                </tr>
                            )}
                            {!listLoading && !listError && apiCostCenters.map((cc) => {
                                const budget = Number(cc.annual_budget) || 0;
                                const actual = Number(cc.actual_spent) || 0;
                                const pctFromApi = Number(cc.budget_utilization_pct);
                                const percent = Number.isFinite(pctFromApi)
                                    ? pctFromApi
                                    : (budget > 0 ? (actual / budget) * 100 : 0);
                                const isOver = actual > budget;

                                return (
                                    <tr key={cc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                                            <span style={{ padding: '0.2rem 0.5rem', background: 'var(--color-bg-subtle)', borderRadius: '4px' }}>
                                                {cc.code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{cc.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.min(Math.max(percent, 0), 100)}%`,
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
                                                    type="button"
                                                    onClick={() => openDrawer('Cost Center', cc.id)}
                                                    style={{ ...iconBtnStyle, color: 'var(--color-primary-600)' }}
                                                    title="View Activity"
                                                    className="cursor-pointer"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button type="button" onClick={() => handleEdit(cc)} style={iconBtnStyle} title="Edit" className="cursor-pointer"><Edit3 size={16} /></button>
                                                <button type="button" onClick={() => handleRequestDelete(cc)} style={{ ...iconBtnStyle, color: 'var(--color-error)' }} title="Delete" className="cursor-pointer"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!listLoading && !listError && apiCostCenters.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No cost centers defined. Click &quot;New Cost Center&quot; to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            {deletingCostCenter && (
                <DeleteCostCenterModal
                    costCenter={deletingCostCenter}
                    isDeleting={deleteCostCenterMutation.isPending}
                    onCancel={() => {
                        if (!deleteCostCenterMutation.isPending) {
                            setDeletingCostCenter(null);
                        }
                    }}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};

const DeleteCostCenterModal = ({ costCenter, isDeleting, onCancel, onConfirm }) => (
    <div
        role="presentation"
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
        }}
    >
        <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cost-center-title"
            className="padding-xl"
            style={{ width: '480px', maxWidth: '95%', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ marginBottom: '1rem' }}>
                <h3 id="delete-cost-center-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Delete cost center
                </h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Are you sure you want to delete{' '}
                <strong>{costCenter?.name || 'this cost center'}</strong>
                {costCenter?.code ? (
                    <>
                        {' '}
                        (<span style={{ fontFamily: 'var(--font-mono)' }}>{costCenter.code}</span>)
                    </>
                ) : null}
                ? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button variant="ghost" onClick={onCancel} disabled={isDeleting} className="cursor-pointer">
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={isDeleting} className="cursor-pointer">
                    {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
            </div>
        </Card>
    </div>
);

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
