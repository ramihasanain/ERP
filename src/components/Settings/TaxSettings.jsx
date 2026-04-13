import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Edit3, Trash2, Globe, AlertCircle } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';

const TaxSettings = () => {
    const { taxJurisdictions, taxRules, addTaxRule, updateTaxRule, companyProfile } = useAccounting();
    // Default to company country, fallback to first available if not found
    const initialJurisdiction = taxJurisdictions.find(j => j.id === companyProfile.country)?.id || taxJurisdictions[0].id;
    const [selectedJurisdiction, setSelectedJurisdiction] = useState(initialJurisdiction);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Filter jurisdictions to only show the company's country (as per user request)
    // If we wanted to allow multi-country later, we could remove this filter or make it optional.
    const visibleJurisdictions = taxJurisdictions.filter(j => j.id === companyProfile.country);

    const filteredRules = taxRules.filter(r => r.jurisdictionId === selectedJurisdiction);
    const activeJurisdiction = taxJurisdictions.find(j => j.id === selectedJurisdiction);

    const handleEdit = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tax Management</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Configure tax rules and rates per jurisdiction.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={handleAdd}>Add Tax Rule</Button>
            </div>

            {/* Jurisdiction Selector */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {visibleJurisdictions.map(jur => (
                    <button
                        key={jur.id}
                        onClick={() => setSelectedJurisdiction(jur.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            border: `1px solid ${selectedJurisdiction === jur.id ? 'var(--color-primary-600)' : 'var(--color-border)'}`,
                            background: selectedJurisdiction === jur.id ? 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))' : 'var(--color-bg-surface)',
                            color: selectedJurisdiction === jur.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Globe size={14} />
                        {jur.name}
                    </button>
                ))}
            </div>

            {/* Rules Table */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: 'var(--color-bg-table-header)' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rule Name</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rate (%)</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Accounts (Sales / Purch)</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRules.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No tax rules defined for {activeJurisdiction?.name}.
                                </td>
                            </tr>
                        ) : (
                            filteredRules.map(rule => (
                                <tr key={rule.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{rule.name}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{rule.rate}%</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                            background: rule.type === 'Standard' ? 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))' : 'var(--color-bg-subtle)',
                                            color: rule.type === 'Standard' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)'
                                        }}>
                                            {rule.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {rule.accountSales} / {rule.accountPurchase}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEdit(rule)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tax Rule Modal */}
            {isModalOpen && (
                <TaxRuleModal
                    rule={editingRule}
                    jurisdictionId={selectedJurisdiction}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(data) => {
                        if (editingRule) {
                            updateTaxRule(editingRule.id, data);
                        } else {
                            addTaxRule({ ...data, jurisdictionId: selectedJurisdiction });
                        }
                        setIsModalOpen(false);
                    }}
                />
            )}
        </Card>
    );
};

const TaxRuleModal = ({ rule, jurisdictionId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: rule?.name || '',
        rate: rule?.rate || 0,
        type: rule?.type || 'Standard',
        accountSales: rule?.accountSales || '2200',
        accountPurchase: rule?.accountPurchase || '1205'
    });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <Card className="padding-xl" style={{ width: '500px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    {rule ? 'Edit Tax Rule' : 'New Tax Rule'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Rule Name"
                        placeholder="e.g. Standard VAT 16%"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Rate (%)"
                            type="number"
                            value={formData.rate}
                            onChange={e => setFormData({ ...formData, rate: e.target.value })}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                            >
                                <option value="Standard">Standard</option>
                                <option value="Zero">Zero Rated</option>
                                <option value="Exempt">Exempt</option>
                                <option value="Reverse Charge">Reverse Charge</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Sales GL Account (Output)"
                            value={formData.accountSales}
                            onChange={e => setFormData({ ...formData, accountSales: e.target.value })}
                        />
                        <Input
                            label="Purchase GL Account (Input)"
                            value={formData.accountPurchase}
                            onChange={e => setFormData({ ...formData, accountPurchase: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => onSave(formData)}>Save Rule</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TaxSettings;
