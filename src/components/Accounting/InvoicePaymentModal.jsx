import React, { useState, useEffect } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { X, Save, CheckCircle2 } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import { useLanguage } from '@/context/LanguageContext';

const InvoicePaymentModal = ({ invoice, onClose }) => {
    const { recordInvoicePayment, accounts } = useAccounting();
    const { language } = useLanguage();

    // Calculate remaining balance
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = invoice.total - totalPaid;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: remaining,
        method: 'Cash',
        accountId: '', // Will default to first cash/bank found
        reference: '',
        notes: ''
    });

    // Filter for Cash and Bank accounts only (Assets -> 1110, 1130 usually)
    // We can filter by type="Asset" and maybe check codes or just show all assets that are not groups
    // Better: Filter for accounts that are NOT groups and type is Asset
    const paymentAccounts = accounts.filter(a =>
        !a.isGroup && a.type === 'Asset' &&
        (a.code.startsWith('111') || a.code.startsWith('113')) // Heuristic for Cash/Bank in standard CoA
    );

    useEffect(() => {
        if (paymentAccounts.length > 0 && !formData.accountId) {
            setFormData(prev => ({ ...prev, accountId: paymentAccounts[0].id }));
        }
    }, [paymentAccounts]);

    const handleSubmit = () => {
        if (!formData.amount || !formData.accountId) return;
        if (Number(formData.amount) > remaining) {
            alert(language === 'ar' ? 'المبلغ المدخل أكبر من الرصيد المتبقي' : 'Amount exceeds remaining balance');
            return;
        }

        recordInvoicePayment(invoice.id, formData);
        onClose();
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
                        {isRtl ? `تسجيل دفعة - ${invoice.id}` : `Record Payment - ${invoice.id}`}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{isRtl ? 'إجمالي الفاتورة' : 'Invoice Total'}</div>
                        <div style={{ fontWeight: 700 }}>{invoice.total.toLocaleString()} JOD</div>
                    </div>
                    <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{isRtl ? 'الرصيد المتبقي' : 'Remaining Balance'}</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>{remaining.toLocaleString()} JOD</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label={isRtl ? 'المبلغ' : 'Payment Amount'}
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                        <Input
                            label={isRtl ? 'التاريخ' : 'Date'}
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {isRtl ? 'حساب الإيداع (البنك/الصندوق)' : 'Deposit To'}
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
                            {paymentAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {isRtl ? 'طريقة الدفع' : 'Payment Method'}
                            </label>
                            <select
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                style={{
                                    height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontSize: '0.9rem', color: 'var(--color-text-main)'
                                }}
                            >
                                <option value="Cash">{isRtl ? 'نقد (Cash)' : 'Cash'}</option>
                                <option value="Check">{isRtl ? 'شيك (Check)' : 'Check'}</option>
                                <option value="Bank Transfer">{isRtl ? 'حوالة بنكية (Bank Transfer)' : 'Bank Transfer'}</option>
                            </select>
                        </div>
                        <Input
                            label={isRtl ? 'رقم المرجع / الشيك' : 'Reference / Check #'}
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="e.g. 12345"
                        />
                    </div>

                    <Input
                        label={isRtl ? 'ملاحظات' : 'Notes'}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="..."
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit}>
                            {isRtl ? 'تسجيل الدفعة' : 'Record Payment'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoicePaymentModal;
