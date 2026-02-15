import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Plus, Landmark, ArrowRightLeft, X, ArrowRight, Eye, Edit3, Save } from 'lucide-react';

const BankAccounts = () => {
    const navigate = useNavigate();
    const { bankAccounts, openDrawer, updateBankAccount } = useAccounting();
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Edit Modal State
    const [editingAccount, setEditingAccount] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleTransfer = (e) => {
        e.preventDefault();
        alert("Funds transferred successfully!");
        setShowTransferModal(false);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setIsEditModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Bank & Cash</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Treasury management and reconciliation.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button icon={<ArrowRightLeft size={18} />} onClick={() => setShowTransferModal(true)}>Transfer Funds</Button>
                    <Button icon={<Plus size={18} />} onClick={() => navigate('new')}>Add Account</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {bankAccounts.map(account => (
                    <Card
                        key={account.id}
                        className="padding-lg"
                        style={{
                            borderLeft: `4px solid ${account.type === 'Bank' ? 'var(--color-primary-600)' : 'var(--color-slate-500)'}`,
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => openEditModal(account)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--color-slate-400)' }}
                                className="hover:bg-slate-100"
                                title="Edit Account"
                            >
                                <Edit3 size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'var(--color-slate-100)', borderRadius: '0.5rem' }}>
                                    <Landmark size={24} color={account.type === 'Bank' ? 'var(--color-primary-600)' : 'var(--color-slate-600)'} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600 }}>{account.name}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{account.accountNumber}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                            Active
                        </p>
                        <Button
                            variant="outline"
                            size="small"
                            icon={<Eye size={16} />}
                            onClick={() => openDrawer('Bank', account.id)}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            View Activity
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingAccount && (
                <EditBankModal
                    account={editingAccount}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={updateBankAccount}
                />
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div style={modalOverlayStyle}>
                    <Card className="padding-lg" style={{ width: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Transfer Funds</h3>
                            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>From Account</label>
                                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}>
                                        <option>Arab Bank - Corporate</option>
                                        <option>Main Cash Box</option>
                                    </select>
                                </div>
                                <div style={{ paddingTop: '1.5rem' }}>
                                    <ArrowRight size={20} color="var(--color-text-secondary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>To Account</label>
                                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}>
                                        <option>Main Cash Box</option>
                                        <option>Arab Bank - Corporate</option>
                                    </select>
                                </div>
                            </div>

                            <Input label="Amount (JOD)" type="number" placeholder="0.00" />
                            <Input label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            <Input label="Description / Reference" placeholder="e.g., Petty Cash Replenishment" />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="ghost" type="button" onClick={() => setShowTransferModal(false)}>Cancel</Button>
                                <Button type="submit">Complete Transfer</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

const EditBankModal = ({ account, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: account.name,
        accountNumber: account.accountNumber,
        currency: account.currency,
        type: account.type,
        balance: account.balance
    });

    const handleSubmit = () => {
        onSave(account.id, {
            ...formData,
            balance: Number(formData.balance)
        });
        onClose();
    };

    return (
        <div style={modalOverlayStyle}>
            <Card className="padding-xl" style={{ width: '450px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Account Details</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Account Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                        >
                            <option value="Bank">Bank Account</option>
                            <option value="Cash">Cash Account</option>
                        </select>
                    </div>

                    <Input
                        label="Account Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    {formData.type === 'Bank' && (
                        <Input
                            label="Account Number / IBAN"
                            value={formData.accountNumber}
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            >
                                <option value="JOD">JOD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <Input
                            label="Current Balance"
                            type="number"
                            value={formData.balance}
                            onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit}>Save Changes</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)'
};

export default BankAccounts;
