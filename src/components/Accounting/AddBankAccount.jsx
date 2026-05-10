import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, ArrowLeft, Landmark } from 'lucide-react';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';

const AddBankAccount = () => {
    const navigate = useNavigate();
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
    const createBankAccountMutation = useCustomPost('/accounting/bank-accounts/create/', [['accounting-bank-accounts']]);

    const defaultCurrencyId = 'b03ed094-c56f-4d58-b563-2407f4c4977d';

    const [formData, setFormData] = useState({
        name: '',
        customBankName: '',
        accountNumber: '',
        currency: defaultCurrencyId,
        balance: '',
        type: 'bank',
        bank: '',
    });

    const bankOptions = useMemo(
        () => (banksQuery.data ?? []).filter((bank) => bank?.is_active),
        [banksQuery.data]
    );
    const currencySelectOptions = useMemo(
        () =>
            (currenciesQuery.data ?? []).map((currency) => ({
                value: currency.id,
                label: `${currency.code} - ${currency.name}`,
            })),
        [currenciesQuery.data]
    );

    const isBankType = formData.type === 'bank';
    const isFormValid = useMemo(() => {
        const hasCommonRequired = Boolean(formData.name.trim()) && Boolean(formData.currency) && formData.balance !== '';
        if (!hasCommonRequired) return false;
        if (!isBankType) return true;
        const hasBankValue = Boolean(formData.bank) || Boolean(formData.customBankName.trim());
        return hasBankValue && Boolean(formData.accountNumber.trim());
    }, [formData, isBankType]);

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const payload = {
            account_type: formData.type,
            name: formData.name.trim(),
            currency: formData.currency,
            opening_balance: Number(formData.balance || 0).toFixed(2),
            is_active: true,
            ...(isBankType
                ? {
                    account_number: formData.accountNumber.trim(),
                    ...(formData.bank
                        ? { bank: formData.bank }
                        : { bank_name: formData.customBankName.trim() }),
                }
                : {}),
        };

        try {
            await createBankAccountMutation.mutateAsync(payload);
            toast.success('Bank account created successfully.');
            navigate(-1);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create bank account.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/admin/accounting')}
                    className="cursor-pointer shrink-0"
                />
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
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    type: e.target.value,
                                    bank: e.target.value === 'cash' ? '' : formData.bank,
                                    customBankName: e.target.value === 'cash' ? '' : formData.customBankName,
                                    accountNumber: e.target.value === 'cash' ? '' : formData.accountNumber,
                                })
                            }
                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
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
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                disabled={banksQuery.isPending}
                            >
                                <option value="">
                                    {banksQuery.isPending ? 'Loading banks...' : 'Select Bank...'}
                                </option>
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
                        placeholder={formData.type === 'cash' ? 'e.g., Main Cash Box' : 'e.g., Arab Bank - Corporate'}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    {isBankType && (
                        <Input
                            label="Account Number / IBAN"
                            placeholder="xxxx-xxxx-xxxx-xxxx"
                            value={formData.accountNumber}
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <SelectWithLoadMore
                            id="add-bank-account-currency"
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
                            label="Opening Balance"
                            type="number"
                            placeholder="0.00"
                            value={formData.balance}
                            onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button
                            icon={<Save size={18} />}
                            onClick={handleSubmit}
                            disabled={!isFormValid || createBankAccountMutation.isPending}
                        >
                            {createBankAccountMutation.isPending ? 'Saving...' : 'Save Account'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddBankAccount;
