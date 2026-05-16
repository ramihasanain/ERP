import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { X, Save } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { toast } from 'sonner';
import translateApiError from '@/utils/translateApiError';

const getCurrencyCode = (invoice) => {
    const currency = invoice?.currency;

    if (typeof currency === 'string' && currency.trim()) return currency.trim();
    if (currency && typeof currency === 'object') {
        return currency.code || currency.currency_code || currency.name || '';
    }

    return invoice?.currency_code || invoice?.customer_currency_code || 'JOD';
};

const InvoicePaymentModal = ({ invoice, onClose }) => {
    const { t } = useTranslation('accounting');
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const { recordInvoicePayment } = useAccounting();
    const invoiceId = invoice?.id || '';
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

    const submitPaymentMutation = useCustomPost(
        `/api/sales/invoices/${invoiceId}/payments/create/`,
        [['sales-invoices'], ['sales-invoice-preview', invoiceId]]
    );

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remaining = Number(invoice.remainingBalance ?? (Number(invoice.total ?? 0) - totalPaid));
    const currencyCode = getCurrencyCode(invoice);
    const formatMoney = (amount) => `${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;

    const [formData, setFormData] = useState({
        date: '2026-05-10',
        amount: '',
        method: 'bank_transfer',
        accountId: "",
        reference: '',
        notes: ''
    });

    const paymentAccounts = bankAccountsQuery.data ?? [];
    const hasSelectedAccount = paymentAccounts.some(acc => String(acc.id) === String(formData.accountId));
    const selectedAccountId = formData.accountId || paymentAccounts[0]?.id || '';

    const handleSubmit = async () => {
        if (!formData.amount || !selectedAccountId) return;
        const paymentAmount = Number(formData.amount);

        if (paymentAmount <= 0) {
            toast.error(t('invoicePayment.invalidAmount'));
            return;
        }

        if (remaining > 0 && paymentAmount > remaining) {
            toast.error(t('invoicePayment.amountExceedsBalance'));
            return;
        }

        try {
            const payload = {
                amount: paymentAmount.toFixed(2),
                payment_date: formData.date,
                bank_account: selectedAccountId,
                payment_method: formData.method,
                notes: formData.notes,
            };

            if (formData.reference.trim()) {
                payload.reference = formData.reference.trim();
            }

            await submitPaymentMutation.mutateAsync(payload);

            recordInvoicePayment(invoice.id, formData);
            toast.success(t('invoicePayment.success'));
            onClose();
        } catch (error) {
            toast.error(translateApiError(error, 'accounting:invoicePayment.failed'));
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
            <Card className="padding-xl" style={{ width: '500px', maxWidth: '95%', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {t('invoicePayment.title', { id: invoice.id })}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{t('invoicePayment.invoiceTotal')}</div>
                        <div style={{ fontWeight: 700 }}>{formatMoney(invoice.total)}</div>
                    </div>
                    <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{t('invoicePayment.remainingBalance')}</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>{formatMoney(remaining)}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label={t('invoicePayment.paymentAmount')}
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                        <Input
                            label={t('invoicePayment.date')}
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {t('invoicePayment.depositTo')}
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                            style={{
                                height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px',
                                border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
                                fontSize: '0.9rem', color: 'var(--color-text-main)',
                            }}
                        >
                            <option value="" disabled>{t('invoicePayment.selectAccount')}</option>
                            {!hasSelectedAccount && selectedAccountId && (
                                <option value={selectedAccountId}>{t('invoicePayment.defaultBankAccount')}</option>
                            )}
                            {paymentAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {t('invoicePayment.paymentMethod')}
                            </label>
                            <select
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                style={{
                                    height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontSize: '0.9rem', color: 'var(--color-text-main)'
                                }}
                            >
                                <option value="bank_transfer">{t('invoicePayment.bankTransfer')}</option>
                                <option value="cash">{t('invoicePayment.cash')}</option>
                                <option value="check">{t('invoicePayment.check')}</option>
                            </select>
                        </div>
                        <Input
                            label={t('invoicePayment.reference')}
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="e.g. 12345"
                        />
                    </div>

                    <Input
                        label={t('invoicePayment.notes')}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="..."
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>{t('common.cancel', { ns: 'accounting' })}</Button>
                        <Button
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={submitPaymentMutation.isPending || bankAccountsQuery.isPending || !formData.amount || !selectedAccountId}
                        >
                            {t('invoicePayment.recordPayment')}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoicePaymentModal;
