import React, { useState, useEffect } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { X, Save } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import { useLanguage } from '@/context/LanguageContext';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { toast } from 'sonner';

/**
 * Collect user-facing strings from typical API error bodies:
 * { detail: "..." }, { field: ["..."] }, nested arrays, non_field_errors.
 */
function flattenApiErrorMessages(data) {
    if (data == null) return [];
    if (typeof data === 'string') return [data];
    if (typeof data !== 'object' || Array.isArray(data)) return [];

    const lines = [];

    if (typeof data.detail === 'string') {
        return [data.detail];
    }
    if (Array.isArray(data.detail)) {
        for (const item of data.detail) {
            if (typeof item === 'string') lines.push(item);
            else if (item && typeof item === 'object') {
                const msg = item.msg ?? item.message ?? item.detail;
                if (typeof msg === 'string') lines.push(msg);
            }
        }
        if (lines.length) return lines;
    }

    const appendMessages = (v) => {
        if (v == null) return;
        if (typeof v === 'string') {
            lines.push(v);
            return;
        }
        if (Array.isArray(v)) {
            v.forEach((item) => appendMessages(item));
            return;
        }
        if (typeof v === 'object') {
            if (typeof v.message === 'string') lines.push(v.message);
            else if (typeof v.msg === 'string') lines.push(v.msg);
            else {
                const nested = flattenApiErrorMessages(v);
                nested.forEach((m) => lines.push(m));
            }
        }
    };

    for (const [key, value] of Object.entries(data)) {
        if (key === 'detail') continue;
        appendMessages(value);
    }

    // De-duplicate while preserving order
    const seen = new Set();
    return lines.filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
    });
}

const BillPaymentModal = ({ bill, onClose, onPaymentSuccess }) => {
    const { recordBillPayment } = useAccounting();
    const { language } = useLanguage();
    const billId = bill?.id || '';

    const billDetailsQuery = useCustomQuery(
        `/api/purchasing/bills/${billId}/`,
        ['purchasing-bill-details', billId],
        {
            enabled: Boolean(billId),
        }
    );

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
        `/api/purchasing/bills/${billId}/pay/`,
        [['purchasing-bills']]
    );

    const billDetails = billDetailsQuery.data;
    const payableAmount = Number(billDetails?.remaining_balance ?? billDetails?.total_payable ?? bill?.totalAmount ?? 0);
    const paymentAccounts = bankAccountsQuery.data ?? [];

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: bill.totalAmount,
        method: 'bank_transfer',
        accountId: '',
        reference: '',
        notes: ''
    });

    useEffect(() => {
        if (paymentAccounts.length > 0 && !formData.accountId) {
            setFormData(prev => ({ ...prev, accountId: paymentAccounts[0].id }));
        }
    }, [paymentAccounts]);

    useEffect(() => {
        if (!billDetails) return;
        setFormData((prev) => ({
            ...prev,
            date: billDetails.bill_date || prev.date,
            amount: Number(billDetails.remaining_balance ?? billDetails.total_payable ?? prev.amount),
            notes: prev.notes || `Payment for PO ${billDetails.po_number || billDetails.number || billDetails.id || bill?.id}`,
        }));
    }, [billDetails, bill?.id]);

    const isAmountValid = Number(formData.amount) > 0;
    const isDateValid = Boolean(formData.date);
    const isMethodValid = Boolean(formData.method);
    const isAccountValid = Boolean(formData.accountId);
    const hasRequiredPaymentData = isAmountValid && isDateValid && isMethodValid && isAccountValid;

    const handleSubmit = async () => {
        if (!hasRequiredPaymentData) return;

        try {
            await submitPaymentMutation.mutateAsync({
                payment_date: formData.date,
                paid_from_account_id: formData.accountId,
                method: formData.method,
                reference: formData.reference,
                notes: formData.notes,
            });

            recordBillPayment(bill.id, {
                ...formData,
                vendorId: bill.vendorId
            });

            toast.success('Bill payment recorded successfully.');
            if (onPaymentSuccess) onPaymentSuccess(bill.id, formData.amount);
            onClose();
        } catch (error) {
            const data = error?.response?.data;
            const lines = flattenApiErrorMessages(data);
            const fallback =
                (typeof data?.detail === 'string' ? data.detail : null) ||
                error?.message ||
                (language === 'ar' ? 'تعذر تسجيل الدفع.' : 'Failed to record payment.');

            if (lines.length > 0) {
                const title = language === 'ar' ? 'تعذر تسجيل الدفع' : 'Could not record payment';
                toast.error(title, {
                    description: (
                        <div
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                            className="flex flex-col gap-1.5 text-start"
                            style={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.45,
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            {lines.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    ),
                });
            } else {
                toast.error(fallback);
            }
        }
    };

    const isRtl = language === 'ar';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
            <Card className="padding-xl" style={{ width: '500px', maxWidth: '95%', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {isRtl ? `تسجيل دفع المورد - ${billDetails?.number || bill.id}` : `Pay Vendor Bill - ${billDetails?.number || bill.id}`}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'إجمالي الفاتورة' : 'Bill Total'}</div>
                        <div style={{ fontWeight: 700 }}>{payableAmount.toLocaleString()} {billDetails?.currency || 'DZD'}</div>
                    </div>
                    <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'المورد' : 'Vendor'}</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>{billDetails?.vendor_name || bill.vendorName}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label={isRtl ? 'المبلغ' : 'Amount to Pay'}
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                        <Input
                            label={isRtl ? 'التاريخ' : 'Payment Date'}
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {isRtl ? 'الدفع من (البنك/الصندوق)' : 'Pay From'}
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                            style={{
                                height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px',
                                border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
                                fontSize: '0.9rem', color: 'var(--color-text-main)',
                            }}
                        >
                            <option value="" disabled>{isRtl ? 'اختر حساباً' : 'Select account'}</option>
                            {paymentAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                {isRtl ? 'طريقة الدفع' : 'Method'}
                            </label>
                            <select
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                style={{
                                    height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontSize: '0.9rem', color: 'var(--color-text-main)',
                                }}
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                            </select>
                        </div>
                        <Input
                            label={isRtl ? 'رقم المرجع' : 'Reference #'}
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="e.g. TRX-123"
                        />
                    </div>

                    <Input
                        label={isRtl ? 'ملاحظات' : 'Notes'}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
                        <Button
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={
                                submitPaymentMutation.isPending ||
                                bankAccountsQuery.isPending ||
                                billDetailsQuery.isPending ||
                                !hasRequiredPaymentData
                            }
                        >
                            {isRtl ? 'تأكيد الدفع' : 'Confirm Payment'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BillPaymentModal;
