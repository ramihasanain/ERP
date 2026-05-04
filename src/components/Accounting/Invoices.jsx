import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Filter, FileText, MoreVertical, CreditCard, ArrowLeft } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import { useLanguage } from '@/context/LanguageContext';
import InvoicePaymentModal from '@/components/Accounting/InvoicePaymentModal';

const Invoices = () => {
    const navigate = useNavigate();
    const { invoices, customers } = useAccounting();
    const { language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [customerFilter, setCustomerFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const getCustomerName = (id) => {
        const cust = customers.find(c => c.id === id);
        return cust ? cust.name : id;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid':
                return { bg: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))', color: 'var(--color-success)' };
            case 'Partial':
                return { bg: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))', color: 'var(--color-warning)' };
            case 'Posted':
                return { bg: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))', color: 'var(--color-primary-500)' };
            case 'Draft':
                return { bg: 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-card))', color: 'var(--color-text-secondary)' };
            case 'Overdue':
                return { bg: 'color-mix(in srgb, var(--color-error) 18%, var(--color-bg-card))', color: 'var(--color-error)' };
            default:
                return { bg: 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-card))', color: 'var(--color-text-secondary)' };
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCustomerName(inv.customerId).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        const matchesCustomer = customerFilter === 'All' || inv.customerId === customerFilter;

        const invDate = new Date(inv.date);
        const matchesDateFrom = !dateFrom || invDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || invDate <= new Date(dateTo);

        return matchesSearch && matchesStatus && matchesCustomer && matchesDateFrom && matchesDateTo;
    });

    const handleRecordPayment = (e, invoice) => {
        e.stopPropagation(); // Prevent row click
        setSelectedInvoice(invoice);
        setPaymentModalOpen(true);
    };

    const isRtl = language === 'ar';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate('/admin/accounting')}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isRtl ? 'فواتير المبيعات' : 'Sales Invoices'}</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{isRtl ? 'إدارة الفواتير والتحصيلات.' : 'Manage billing and revenue.'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }} className="shrink-0">
                    <Button icon={<Plus size={18} />} onClick={() => navigate('new')} className="cursor-pointer">{isRtl ? 'إنشاء فاتورة' : 'Create Invoice'}</Button>
                </div>
            </div>

            <Card className="padding-none">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '300px' }}>
                            <Input
                                placeholder={isRtl ? 'بحث برقم الفاتورة أو العميل...' : "Search invoice or client..."}
                                startIcon={<Search size={16} />}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '180px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                            value={customerFilter}
                            onChange={e => setCustomerFilter(e.target.value)}
                        >
                            <option value="All">{isRtl ? 'كل العملاء' : 'All Customers'}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{isRtl ? 'من:' : 'From:'}</span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{isRtl ? 'إلى:' : 'To:'}</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Filter size={14} color="var(--color-text-muted)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>{isRtl ? 'الحالة:' : 'Status:'}</span>
                            {['All', 'Paid', 'Partial', 'Posted', 'Draft', 'Overdue'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid ' + (statusFilter === status ? 'var(--color-primary-600)' : 'var(--color-border)'),
                                        background: statusFilter === status ? 'var(--color-primary-600)' : 'var(--color-bg-surface)',
                                        color: statusFilter === status ? 'white' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {(searchTerm || statusFilter !== 'All' || customerFilter !== 'All' || dateFrom || dateTo) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
                                    setCustomerFilter('All');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                            >
                                {isRtl ? 'مسح الفلاتر' : 'Clear Filters'}
                            </Button>
                        )}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', textAlign: isRtl ? 'right' : 'left', color: 'var(--color-text-secondary)' }}>
                            <th style={{ padding: '1rem 1.5rem' }}>{isRtl ? 'رقم الفاتورة' : 'Invoice #'}</th>
                            <th style={{ padding: '1rem 1rem' }}>{isRtl ? 'العميل' : 'Client'}</th>
                            <th style={{ padding: '1rem 1rem' }}>{isRtl ? 'التاريخ' : 'Date'}</th>
                            <th style={{ padding: '1rem 1rem' }}>{isRtl ? 'استحقاق' : 'Due Date'}</th>
                            <th style={{ padding: '1rem 1rem', textAlign: isRtl ? 'left' : 'right' }}>{isRtl ? 'القيمة' : 'Amount'}</th>
                            <th style={{ padding: '1rem 1.5rem' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                            <th style={{ padding: '1rem 1rem' }}>{isRtl ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(inv => {
                            const statusStyle = getStatusStyle(inv.status);
                            return (
                                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} className="erp-table-row-hover" onClick={() => navigate(inv.id)}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{inv.id}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{getCustomerName(inv.customerId)}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{inv.date}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{inv.dueDate}</td>
                                    <td style={{ padding: '1rem 1rem', textAlign: isRtl ? 'left' : 'right', fontWeight: 600 }}>{inv.total.toLocaleString()} JOD</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: statusStyle.bg, color: statusStyle.color,
                                            fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        {(inv.status === 'Posted' || inv.status === 'Partial') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<CreditCard size={14} />}
                                                onClick={(e) => handleRecordPayment(e, inv)}
                                            >
                                                {isRtl ? 'سداد' : 'Pay'}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>

            {paymentModalOpen && selectedInvoice && (
                <InvoicePaymentModal
                    invoice={selectedInvoice}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setSelectedInvoice(null);
                    }}
                />
            )}
        </div>
    );
};

export default Invoices;
