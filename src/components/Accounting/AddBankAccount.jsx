import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, ArrowLeft, Landmark } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';

const AddBankAccount = () => {
    const navigate = useNavigate();
    const { addBankAccount } = useAccounting();
    const [formData, setFormData] = useState({
        name: '',
        accountNumber: '',
        currency: 'JOD',
        balance: '',
        type: 'Bank' // Default
    });

    const handleSubmit = () => {
        if (!formData.name) {
            alert("Please provide an account name.");
            return;
        }

        if (formData.type === 'Bank' && !formData.accountNumber) {
            alert("Please provide an account number for bank accounts.");
            return;
        }

        addBankAccount({
            ...formData,
            accountNumber: formData.type === 'Cash' ? 'N/A' : formData.accountNumber, // Default for Cash
            balance: Number(formData.balance) || 0
        });

        navigate(-1);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Add Bank Account</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Connect a new bank or cash account.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <Landmark size={48} color="var(--color-primary-600)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Bank Details</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Enter the account information below.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Account Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        >
                            <option value="Bank">Bank Account</option>
                            <option value="Cash">Cash Account (Safe/Box)</option>
                        </select>
                    </div>

                    {formData.type === 'Bank' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Bank</label>
                            <select
                                value={formData.presetName}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        presetName: val,
                                        name: val === 'Other' ? '' : val
                                    });
                                }}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            >
                                <option value="">Select Bank...</option>
                                <option value="Arab Bank">Arab Bank</option>
                                <option value="The Housing Bank">The Housing Bank</option>
                                <option value="Jordan Kuwait Bank">Jordan Kuwait Bank</option>
                                <option value="Etihad Bank">Etihad Bank</option>
                                <option value="Cairo Amman Bank">Cairo Amman Bank</option>
                                <option value="Bank al Etihad">Bank al Etihad</option>
                                <option value="Capital Bank">Capital Bank</option>
                                <option value="Other">Other / Custom Name</option>
                            </select>
                        </div>
                    )}

                    {(formData.presetName === 'Other' || formData.presetName === '' || formData.type === 'Cash' || !formData.presetName) && (
                        <Input
                            label={formData.type === 'Cash' ? "Cash Box Name" : "Account Name (Custom)"}
                            placeholder={formData.type === 'Cash' ? "e.g., Main Office Safe" : "e.g., Arab Bank - Corporate"}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    )}
                    {formData.type === 'Bank' && (
                        <Input
                            label="Account Number / IBAN"
                            placeholder="xxxx-xxxx-xxxx-xxxx"
                            value={formData.accountNumber}
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            >
                                <option value="JOD">JOD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <Input
                            label="Opening Balance"
                            type="number"
                            placeholder="0.00"
                            value={formData.balance}
                            onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button icon={<Save size={18} />} onClick={handleSubmit}>Save Account</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddBankAccount;
