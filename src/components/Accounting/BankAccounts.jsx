import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPut } from '@/hooks/useMutation';
import { post } from '@/api';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Landmark, ArrowRightLeft, X, ArrowRight, Eye, Edit3, Save, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { toast } from 'sonner';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';

const BankAccounts = () => {
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { openDrawer } = useAccounting();
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [conflictSide, setConflictSide] = useState(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [transferDescription, setTransferDescription] = useState('');
    const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

    // Edit Modal State
    const [editingAccount, setEditingAccount] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const resetTransferForm = () => {
        setFromAccountId('');
        setToAccountId('');
        setConflictSide(null);
        setTransferAmount('');
        setTransferDate(new Date().toISOString().split('T')[0]);
        setTransferDescription('');
    };

    const closeTransferModal = () => {
        resetTransferForm();
        setShowTransferModal(false);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();

        if (!fromAccountId || !toAccountId) {
            toast.error('Please select both from and to accounts.');
            return;
        }

        if (!transferAmount || Number(transferAmount) <= 0) {
            toast.error('Please enter a valid transfer amount.');
            return;
        }

        setIsTransferSubmitting(true);

        try {
            await post('/accounting/bank-accounts/transfer/', {
                from_account: fromAccountId,
                to_account: toAccountId,
                amount: Number(transferAmount).toFixed(2),
                date: transferDate,
                description: transferDescription || 'Internal transfer',
            });

            toast.success('Funds transferred successfully!');
            closeTransferModal();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to transfer funds.'));
        } finally {
            setIsTransferSubmitting(false);
        }
    };

    const handleFromAccountChange = (e) => {
        const selectedId = e.target.value;
        setFromAccountId(selectedId);

        if (selectedId && selectedId === toAccountId) {
            setToAccountId('');
            setConflictSide('to');
            return;
        }

        setConflictSide(null);
    };

    const handleToAccountChange = (e) => {
        const selectedId = e.target.value;
        setToAccountId(selectedId);

        if (selectedId && selectedId === fromAccountId) {
            setFromAccountId('');
            setConflictSide('from');
            return;
        }

        setConflictSide(null);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setIsEditModalOpen(true);
    };

    const bankAccountsQuery = useCustomQuery(
        '/accounting/bank-accounts/',
        ['accounting-bank-accounts'],
        {
            select: (response) => {
                if (Array.isArray(response?.data)) return response.data;
                if (Array.isArray(response?.results)) return response.results;
                if (Array.isArray(response)) return response;
                return [];
            },
        }
    );

    const bankAccounts = (bankAccountsQuery.data ?? []).map((account) => ({
        ...account,
        type: account.account_type === 'cash' ? 'Cash' : 'Bank',
        accountNumber: account.account_number || '',
        currency: account.currency_code || '',
        currentBalance: Number(account.current_balance ?? 0),
        openingBalance: Number(account.opening_balance ?? 0),
        isActive: Boolean(account.is_active),
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(`${basePath}/accounting`)}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Bank & Cash</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Treasury management and reconciliation.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }} className="shrink-0">
                    <Button icon={<ArrowRightLeft size={18} />} onClick={() => {
                        resetTransferForm();
                        setShowTransferModal(true);
                    }} className="cursor-pointer">Transfer Funds</Button>
                    <Button icon={<Plus size={18} />} onClick={() => navigate('new')} className="cursor-pointer">Add Account</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {bankAccountsQuery.isPending && (
                    <Card className="padding-lg">
                        <p style={{ color: 'var(--color-text-secondary)' }}>Loading accounts...</p>
                    </Card>
                )}
                {bankAccountsQuery.isError && (
                    <Card className="padding-lg">
                        <p style={{ color: 'var(--color-danger-600)' }}>Failed to load bank accounts.</p>
                    </Card>
                )}
                {!bankAccountsQuery.isPending && !bankAccountsQuery.isError && bankAccounts.length === 0 && (
                    <Card className="padding-lg">
                        <p style={{ color: 'var(--color-text-secondary)' }}>No accounts found.</p>
                    </Card>
                )}
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
                                className="erp-table-row-hover"
                                title="Edit Account"
                            >
                                <Edit3 size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'var(--color-bg-subtle)', borderRadius: '0.5rem' }}>
                                    <Landmark size={24} color={account.type === 'Bank' ? 'var(--color-primary-600)' : 'var(--color-slate-600)'} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600 }}>{account.name}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{account.accountNumber}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {account.currency} {account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Opening: {account.currency} {account.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: account.isActive ? 'var(--color-success)' : 'var(--color-danger-600)' }}></span>
                            {account.isActive ? 'Active' : 'Inactive'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
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
                />
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div style={modalOverlayStyle}>
                    <Card className="padding-lg" style={{ width: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Transfer Funds</h3>
                            <button onClick={closeTransferModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>From Account</label>
                                    <select
                                        value={fromAccountId}
                                        onChange={handleFromAccountChange}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: conflictSide === 'from' ? '1px solid var(--color-danger-600)' : '1px solid var(--color-border)',
                                            background: conflictSide === 'from' ? 'var(--color-danger-50)' : 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <option value="">Select from account</option>
                                        {bankAccounts.map((account) => (
                                            <option
                                                key={`from-${account.id}`}
                                                value={String(account.id)}
                                                style={{
                                                    color: toAccountId && String(account.id) === toAccountId
                                                        ? 'var(--color-danger-600)'
                                                        : 'var(--color-text-main)'
                                                }}
                                            >
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ paddingTop: '1.5rem' }}>
                                    <ArrowRight size={20} color="var(--color-text-secondary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>To Account</label>
                                    <select
                                        value={toAccountId}
                                        onChange={handleToAccountChange}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            border: conflictSide === 'to' ? '1px solid var(--color-danger-600)' : '1px solid var(--color-border)',
                                            background: conflictSide === 'to' ? 'var(--color-danger-50)' : 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <option value="">Select to account</option>
                                        {bankAccounts.map((account) => (
                                            <option
                                                key={`to-${account.id}`}
                                                value={String(account.id)}
                                                style={{
                                                    color: fromAccountId && String(account.id) === fromAccountId
                                                        ? 'var(--color-danger-600)'
                                                        : 'var(--color-text-main)'
                                                }}
                                            >
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {conflictSide && (
                                <p style={{ color: 'var(--color-danger-600)', fontSize: '0.8rem', marginTop: '-0.5rem' }}>
                                    You selected the same account on both sides. The other side was reset to default.
                                </p>
                            )}

                            <Input
                                label="Amount (JOD)"
                                type="number"
                                placeholder="0.00"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                required
                            />
                            <Input
                                label="Date"
                                type="date"
                                value={transferDate}
                                onChange={(e) => setTransferDate(e.target.value)}
                                required
                            />
                            <Input
                                label="Description / Reference"
                                placeholder="e.g., Petty Cash Replenishment"
                                value={transferDescription}
                                onChange={(e) => setTransferDescription(e.target.value)}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="ghost" type="button" onClick={closeTransferModal}>Cancel</Button>
                                <Button type="submit" disabled={isTransferSubmitting}>
                                    {isTransferSubmitting ? 'Transferring...' : 'Complete Transfer'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

const EditBankModal = ({ account, onClose }) => {
    const updateBankAccountMutation = useCustomPut(
        `/accounting/bank-accounts/${account.id}/`,
        [['accounting-bank-accounts'], ['accounting-bank-account', account.id]]
    );
    const banksQuery = useCustomQuery('/accounting/banks/', ['accounting-banks'], {
        select: (response) => {
            if (Array.isArray(response?.data)) return response.data;
            if (Array.isArray(response?.results)) return response.results;
            if (Array.isArray(response)) return response;
            return [];
        },
    });
    const currenciesQuery = useCustomQuery('/api/shared/currencies/', ['shared-currencies'], {
        select: (response) => {
            if (Array.isArray(response?.data)) return response.data;
            if (Array.isArray(response?.results)) return response.results;
            if (Array.isArray(response)) return response;
            return [];
        },
    });
    const accountDetailsQuery = useCustomQuery(
        `/accounting/bank-accounts/${account.id}/`,
        ['accounting-bank-account', account.id],
        {
            enabled: Boolean(account?.id),
            select: (response) => response?.data ?? response ?? null,
        }
    );
    const bankOptions = useMemo(
        () => (banksQuery.data ?? []).filter((bank) => bank?.is_active),
        [banksQuery.data]
    );
    const currencyOptions = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
    const currencySelectOptions = useMemo(
        () =>
            currencyOptions.map((currency) => ({
                value: currency.id,
                label: `${currency.code} - ${currency.name}`,
            })),
        [currencyOptions]
    );
    const defaultCurrencyId = 'b03ed094-c56f-4d58-b563-2407f4c4977d';

    const [formData, setFormData] = useState({
        name: account.name || '',
        customBankName: '',
        accountNumber: account.accountNumber || '',
        currency: defaultCurrencyId,
        balance: account.balance ?? '',
        type: account.type?.toLowerCase() === 'cash' ? 'cash' : 'bank',
        bank: '',
    });
    const isBankType = formData.type === 'bank';

    useEffect(() => {
        const details = accountDetailsQuery.data;
        if (!details) return;

        const matchedBank = bankOptions.find(
            (bank) => bank?.name?.trim().toLowerCase() === (details.bank_name || '').trim().toLowerCase()
        );
        const matchedCurrency = currencyOptions.find(
            (currency) => currency?.code === details.currency_code
        );

        setFormData({
            name: details.name || '',
            customBankName: matchedBank ? '' : (details.bank_name || ''),
            accountNumber: details.account_number || '',
            currency: matchedCurrency?.id || defaultCurrencyId,
            balance: details.opening_balance || '',
            type: details.account_type === 'cash' ? 'cash' : 'bank',
            bank: matchedBank?.id || '',
        });
    }, [accountDetailsQuery.data, bankOptions, currencyOptions]);

    const handleSubmit = async () => {
        try {
            await updateBankAccountMutation.mutateAsync({
                name: formData.name.trim(),
                opening_balance: Number(formData.balance || 0).toFixed(2),
                is_active: true,
            });
            toast.success('Bank account updated successfully.');
            onClose();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to update bank account.'));
        }
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
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    type: e.target.value,
                                    bank: e.target.value === 'cash' ? '' : formData.bank,
                                    customBankName: e.target.value === 'cash' ? '' : formData.customBankName,
                                    accountNumber: e.target.value === 'cash' ? '' : formData.accountNumber,
                                })
                            }
                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                        >
                            <option value="bank">Bank Account</option>
                            <option value="cash">Cash Account (Safe/Box)</option>
                        </select>
                    </div>

                    {isBankType && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Bank</label>
                            <select
                                value={formData.bank}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        bank: e.target.value,
                                        customBankName: e.target.value ? '' : formData.customBankName,
                                    })
                                }
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                disabled={banksQuery.isPending}
                            >
                                <option value="">{banksQuery.isPending ? 'Loading banks...' : 'Select Bank...'}</option>
                                {bankOptions.map((bank) => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isBankType && !formData.bank && (
                        <Input
                            label="Custom Bank Name"
                            placeholder="e.g., Arab Bank"
                            value={formData.customBankName}
                            onChange={e => setFormData({ ...formData, customBankName: e.target.value })}
                        />
                    )}

                    <Input
                        label={formData.type === 'cash' ? 'Cash Box Name' : 'Account Name'}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    {isBankType && (
                        <Input
                            label="Account Number / IBAN"
                            value={formData.accountNumber}
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <SelectWithLoadMore
                            id={`edit-bank-account-currency-${account.id}`}
                            label="Currency"
                            value={formData.currency}
                            onChange={(next) => setFormData({ ...formData, currency: next })}
                            options={currencySelectOptions}
                            emptyOptionLabel={
                                currenciesQuery.isPending ? 'Loading currencies...' : 'Select currency...'
                            }
                            disabled={currenciesQuery.isPending || currenciesQuery.isError}
                            isInitialLoading={currenciesQuery.isPending}
                            paginationError={
                                currenciesQuery.isError ? 'Failed to load currencies.' : null
                            }
                            hasMore={false}
                        />
                        <Input
                            label="Current Balance"
                            type="number"
                            value={formData.balance}
                            onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={updateBankAccountMutation.isPending}>
                            {updateBankAccountMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
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
