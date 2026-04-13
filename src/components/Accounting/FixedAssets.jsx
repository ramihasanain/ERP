import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import IconPicker from '@/components/Shared/IconPicker';
import { Plus, X, Monitor, Wrench, Calendar, Percent, DollarSign, CreditCard, Eye } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, size = 24 }) => {
    const Icon = LucideIcons[name] || Monitor;
    return <Icon size={size} />;
};

const FixedAssets = () => {
    const navigate = useNavigate();
    const { accounts, getAccountBalance, addAccount, updateAccount, addEntry, entries, updateEntry, openDrawer } = useAccounting();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Asset State
    const [assetForm, setAssetForm] = useState({
        name: '',
        description: '',
        icon: 'Box',
        depreciationRate: '',
        purchaseCost: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        sourceAccountId: ''
    });

    // 1. Asset Accounts (Categories)
    const assetAccounts = accounts.filter(a => a.parentCode === '1200' && !a.isGroup);

    // 2. Source Accounts (Bank, Cash, Payables, Loans) for "Paid From"
    const sourceAccounts = accounts.filter(a =>
        !a.isGroup && (
            // Cash & Bank
            (a.type === 'Asset' && (a.parentCode === '1130' || a.parentCode === '1110')) ||
            // Accounts Payable
            a.code === '2110' ||
            // Credit Cards & Loans
            a.code === '2180' || a.code === '2170' || a.code === '2210'
        )
    );

    const openCreateModal = () => {
        setEditingId(null);
        setAssetForm({
            name: '',
            description: '',
            icon: 'Box',
            depreciationRate: '',
            purchaseCost: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            sourceAccountId: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        setEditingId(account.id);
        const depRate = account.depreciationRate || '';

        // Find associated Journal Entry for Cost/Date
        // Look for entry where this asset was debited and ref is associated
        const entry = entries.find(e =>
            (e.reference === 'ASSET-PURCH' || e.reference === 'ASSET-OP-BAL') &&
            e.lines.some(l => l.account === account.id && Number(l.debit) > 0)
        );

        let cost = '';
        let date = '';
        let source = '';

        if (entry) {
            date = entry.date;
            const assetLine = entry.lines.find(l => l.account === account.id && Number(l.debit) > 0);
            if (assetLine) cost = assetLine.debit;

            const sourceLine = entry.lines.find(l => l.credit > 0); // Assuming simple 2-line entry
            if (sourceLine) source = sourceLine.account;
        }

        setAssetForm({
            name: account.name,
            description: account.description || '',
            icon: account.icon || 'Box',
            depreciationRate: depRate,
            purchaseCost: cost,
            purchaseDate: date || new Date().toISOString().split('T')[0],
            sourceAccountId: source
        });
        setIsModalOpen(true);
    };

    const handleSaveAsset = () => {
        if (!assetForm.name) return;

        if (editingId) {
            // 1. Update Metadata
            updateAccount(editingId, {
                name: assetForm.name,
                description: assetForm.description,
                icon: assetForm.icon,
                depreciationRate: assetForm.depreciationRate
            });

            // 2. Update Financials (Journal Entry)
            // Find the original entry again
            const existingEntry = entries.find(e =>
                (e.reference === 'ASSET-PURCH' || e.reference === 'ASSET-OP-BAL') &&
                e.lines.some(l => l.account === editingId && Number(l.debit) > 0)
            );

            if (existingEntry) {
                // Determine new Source Account (or keep old if not valid/changed) or fallback to Equity
                const sourceAcc = assetForm.sourceAccountId || (existingEntry.lines.find(l => l.credit > 0)?.account || '3000');
                const cost = Number(assetForm.purchaseCost);

                updateEntry(existingEntry.id, {
                    date: assetForm.purchaseDate,
                    isAutomatic: true,
                    sourceType: 'Fixed Asset',
                    lines: [
                        { id: 1, account: editingId, description: `Asset Cost - ${assetForm.name}`, debit: cost, credit: 0, costCenter: '' },
                        { id: 2, account: sourceAcc, description: 'Payment / Payable', debit: 0, credit: cost, costCenter: '' }
                    ]
                });
            } else {
                // If no entry existed (rare, maybe legacy), create one if cost is provided
                if (assetForm.purchaseCost && Number(assetForm.purchaseCost) > 0) {
                    const sourceAcc = assetForm.sourceAccountId || '3000'; // Default to Equity if missing
                    addEntry({
                        date: assetForm.purchaseDate,
                        reference: 'ASSET-PURCH',
                        description: `Purchase of Asset: ${assetForm.name}`,
                        status: 'Posted',
                        isAutomatic: true,
                        sourceType: 'Fixed Asset',
                        lines: [
                            { id: 1, account: editingId, description: `Asset Cost - ${assetForm.name}`, debit: Number(assetForm.purchaseCost), credit: 0, costCenter: '' },
                            { id: 2, account: sourceAcc, description: 'Payment / Payable', debit: 0, credit: Number(assetForm.purchaseCost), costCenter: '' }
                        ]
                    });
                }
            }

        } else {
            // Create New Asset Category/Account
            const newAccount = addAccount({
                name: assetForm.name,
                description: assetForm.description,
                type: 'Asset',
                parentCode: '1200', // Fixed Assets
                icon: assetForm.icon,
                depreciationRate: assetForm.depreciationRate
            });

            // Create Purchase Journal Entry
            if (assetForm.purchaseCost && Number(assetForm.purchaseCost) > 0) {
                if (assetForm.sourceAccountId) {
                    addEntry({
                        date: assetForm.purchaseDate,
                        reference: 'ASSET-PURCH',
                        description: `Purchase of Asset: ${assetForm.name}`,
                        status: 'Posted',
                        isAutomatic: true,
                        sourceType: 'Fixed Asset',
                        lines: [
                            { id: 1, account: newAccount.id, description: `Asset Cost - ${assetForm.name}`, debit: Number(assetForm.purchaseCost), credit: 0, costCenter: '' },
                            { id: 2, account: assetForm.sourceAccountId, description: 'Payment / Payable', debit: 0, credit: Number(assetForm.purchaseCost), costCenter: '' }
                        ]
                    });
                } else {
                    addEntry({
                        date: assetForm.purchaseDate,
                        reference: 'ASSET-OP-BAL',
                        description: `Opening Balance for ${assetForm.name}`,
                        status: 'Posted',
                        isAutomatic: true,
                        sourceType: 'Fixed Asset',
                        lines: [
                            { id: 1, account: newAccount.id, description: 'Asset Cost', debit: Number(assetForm.purchaseCost), credit: 0, costCenter: '' },
                            { id: 2, account: '3000', description: 'Opening Balance Equity', debit: 0, credit: Number(assetForm.purchaseCost), costCenter: '' }
                        ]
                    });
                }
            }
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Fixed Assets</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Track assets, depreciation, and book value.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button icon={<Plus size={18} />} onClick={openCreateModal}>New Asset Category</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {assetAccounts.map(account => {
                    const balance = getAccountBalance(account.id);

                    return (
                        <Card key={account.id} className="padding-lg" style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => openDrawer('Asset', account.id)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-primary-600)', padding: '0.25rem'
                                    }}
                                    title="View Activity"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={() => openEditModal(account)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', padding: '0.25rem'
                                    }}
                                    title="Edit Category"
                                >
                                    <Wrench size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                                    borderRadius: '0.75rem',
                                    color: 'var(--color-primary-600)'
                                }}>
                                    <DynamicIcon name={account.icon || 'Box'} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600 }}>{account.name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{account.code}</p>
                                    {account.depreciationRate && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            background: 'var(--color-bg-subtle)',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '1rem',
                                            marginTop: '0.5rem',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            <Percent size={12} />
                                            <span>{account.depreciationRate}% Depr. Rate</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Original Cost</span>
                                <span style={{ fontWeight: 600 }}>{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD</span>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>Net Book Value</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>
                                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD
                                </span>
                            </div>
                        </Card>
                    );
                })}

                {assetAccounts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        No Fixed Asset categories found. Click "New Asset Category" to start.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{editingId ? 'Edit Asset Category' : 'Register New Asset'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Asset Name"
                                placeholder="e.g. Heavy Machinery"
                                value={assetForm.name}
                                onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                            />

                            <Input
                                label="Description"
                                placeholder="Description of this asset class"
                                value={assetForm.description}
                                onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <Input
                                    label="Depr. Rate (%)"
                                    type="number"
                                    placeholder="20"
                                    value={assetForm.depreciationRate}
                                    onChange={e => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
                                />
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Select Icon</label>
                                    <IconPicker
                                        selectedIcon={assetForm.icon}
                                        onSelect={(icon) => setAssetForm({ ...assetForm, icon })}
                                    />
                                </div>
                            </div>

                            <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={16} /> Purchase Details
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Input
                                            label="Purchase Cost"
                                            type="number"
                                            placeholder="0.00"
                                            value={assetForm.purchaseCost}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                                        />
                                        <Input
                                            label="Purchase Date"
                                            type="date"
                                            value={assetForm.purchaseDate}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Paid From (Source Account)</label>
                                        <select
                                            style={{
                                                width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)', fontSize: '0.9rem',
                                                background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                                            }}
                                            value={assetForm.sourceAccountId}
                                            onChange={e => setAssetForm({ ...assetForm, sourceAccountId: e.target.value })}
                                        >
                                            <option value="">-- Leave Empty for Opening Balance --</option>

                                            <optgroup label="Bank & Cash">
                                                {sourceAccounts.filter(a => a.type === 'Asset').map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </optgroup>

                                            <optgroup label="Payables & Loans">
                                                {sourceAccounts.filter(a => a.type === 'Liability').map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                            Select the account used to pay for this asset. Leave empty only for Opening Balance entries.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveAsset}>{editingId ? 'Save Changes' : 'Register Asset'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedAssets;
