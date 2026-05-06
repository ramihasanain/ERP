import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Filter, CreditCard, ArrowLeft, Edit } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import InvoicePaymentModal from '@/components/Accounting/InvoicePaymentModal';
import Pagination from '@/core/Pagination';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch } from '@/hooks/useMutation';
import { toast } from 'sonner';

const Invoices = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [customerFilter, setCustomerFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const invoicesUrl = useMemo(() => {
        const params = new URLSearchParams({
            page: String(currentPage),
            page_size: '15',
        });
        const trimmedSearch = searchTerm.trim();

        if (trimmedSearch) params.set('search', trimmedSearch);
        if (statusFilter !== 'All') params.set('status', statusFilter.toLowerCase());
        if (customerFilter !== 'All') params.set('customer', customerFilter);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);

        return `/api/sales/invoices/?${params.toString()}`;
    }, [currentPage, searchTerm, statusFilter, customerFilter, dateFrom, dateTo]);

    const invoicesQuery = useCustomQuery(
        invoicesUrl,
        ['sales-invoices', currentPage, searchTerm, statusFilter, customerFilter, dateFrom, dateTo],
        {
            keepPreviousData: true,
        }
    );
    const postInvoiceMutation = useCustomPatch(
        (id) => `/api/sales/invoices/${id}/`,
        [['sales-invoices'], ['sales-invoice-preview']]
    );

    const getStatusLabel = (status) => {
        if (!status) return 'Draft';
        const value = String(status).toLowerCase();
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const getStatusStyle = (statusLabel) => {
        switch (statusLabel) {
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

    const invoicesCount = invoicesQuery.data?.count ?? 0;

    const normalizedInvoices = useMemo(() => {
        const apiInvoices = invoicesQuery.data?.data ?? [];

        return apiInvoices.map((invoice) => {
            const status = getStatusLabel(invoice.status);
            const total = Number(invoice.grand_total ?? 0);
            const remainingBalance = Number(invoice.remaining_balance ?? 0);

            return {
                ...invoice,
                number: invoice.number || invoice.id,
                customerId: invoice.customer,
                customerDisplayName: invoice.customer_name || invoice.customer,
                date: invoice.invoice_date,
                dueDate: invoice.due_date,
                status,
                total,
                remainingBalance,
                payments: [],
            };
        });
    }, [invoicesQuery.data]);

    const customerOptions = useMemo(() => {
        const map = new Map();
        normalizedInvoices.forEach((invoice) => {
            if (invoice.customerId) {
                map.set(String(invoice.customerId), invoice.customerDisplayName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [normalizedInvoices]);

    const filteredInvoices = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const getDateValue = (value) => {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? null : date.getTime();
        };
        const fromTime = dateFrom ? getDateValue(dateFrom) : null;
        const toTime = dateTo ? getDateValue(dateTo) : null;

        return normalizedInvoices.filter(inv => {
            const invoiceNumber = String(inv.number || '').toLowerCase();
            const customerName = String(inv.customerDisplayName || '').toLowerCase();
            const matchesSearch =
                !normalizedSearch ||
                invoiceNumber.includes(normalizedSearch) ||
                customerName.includes(normalizedSearch);
            const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
            const matchesCustomer = customerFilter === 'All' || String(inv.customerId) === customerFilter;

            const invoiceTime = getDateValue(inv.date);
            const matchesDateFrom = !fromTime || (invoiceTime !== null && invoiceTime >= fromTime);
            const matchesDateTo = !toTime || (invoiceTime !== null && invoiceTime <= toTime);

            return matchesSearch && matchesStatus && matchesCustomer && matchesDateFrom && matchesDateTo;
        });
    }, [normalizedInvoices, searchTerm, statusFilter, customerFilter, dateFrom, dateTo]);

    const handleRecordPayment = (e, invoice) => {
        e.stopPropagation(); // Prevent row click
        setSelectedInvoice(invoice);
        setPaymentModalOpen(true);
    };

    const handleEditInvoice = (e, invoice) => {
        e.stopPropagation();
        navigate(`${invoice.id}/edit`);
    };
    const handlePostInvoice = async (e, invoice) => {
        e.stopPropagation();
        try {
            await postInvoiceMutation.mutateAsync({
                id: invoice.id,
                status: 'posted',
            });
            toast.success(isRtl ? 'تم ترحيل الفاتورة بنجاح.' : 'Invoice posted successfully.');
        } catch (error) {
            toast.error(error?.response?.data?.message || (isRtl ? 'فشل ترحيل الفاتورة.' : 'Failed to post invoice.'));
        }
    };

    const updateFilter = (setter, value) => {
        setter(value);
        setCurrentPage(1);
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
                                onChange={e => updateFilter(setSearchTerm, e.target.value)}
                            />
                        </div>

                        <select
                            style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '180px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                            value={customerFilter}
                            onChange={e => updateFilter(setCustomerFilter, e.target.value)}
                        >
                            <option value="All">{isRtl ? 'كل العملاء' : 'All Customers'}</option>
                            {customerOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{isRtl ? 'من:' : 'From:'}</span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => updateFilter(setDateFrom, e.target.value)}
                                style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{isRtl ? 'إلى:' : 'To:'}</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => updateFilter(setDateTo, e.target.value)}
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
                                    onClick={() => updateFilter(setStatusFilter, status)}
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
                                    setCurrentPage(1);
                                }}
                                style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                            >
                                {isRtl ? 'مسح الفلاتر' : 'Clear Filters'}
                            </Button>
                        )}
                    </div>
                </div>

                {invoicesQuery.isLoading && (
                    <div style={{ minHeight: '220px', display: 'grid', placeItems: 'center' }}>
                        <Spinner />
                    </div>
                )}
                {invoicesQuery.isError && (
                    <div style={{ padding: '1.25rem 1.5rem', color: 'var(--color-error)' }}>
                        {isRtl ? 'تعذر تحميل الفواتير.' : 'Failed to load invoices.'}
                    </div>
                )}
                {!invoicesQuery.isLoading && !invoicesQuery.isError && (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
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
                                        const isPaid = inv.status === 'Paid';
                                        const isDraft = inv.status === 'Draft';
                                        return (
                                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} className="erp-table-row-hover" onClick={() => navigate(inv.id)}>
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{inv.number}</td>
                                                <td style={{ padding: '1rem 1rem' }}>{inv.customerDisplayName}</td>
                                                <td style={{ padding: '1rem 1rem' }}>{inv.date}</td>
                                                <td style={{ padding: '1rem 1rem' }}>{inv.dueDate}</td>
                                                <td style={{ padding: '1rem 1rem', textAlign: isRtl ? 'left' : 'right', fontWeight: 600 }}>
                                                    {inv.currency} {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
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
                                                    {!isPaid && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            {isDraft ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => handlePostInvoice(e, inv)}
                                                                    className="cursor-pointer"
                                                                    disabled={postInvoiceMutation.isPending}
                                                                >
                                                                    {isRtl ? 'ترحيل' : 'Post'}
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    icon={<CreditCard size={14} />}
                                                                    onClick={(e) => handleRecordPayment(e, inv)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {isRtl ? 'سداد' : 'Pay'}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Edit size={14} />}
                                                                onClick={(e) => handleEditInvoice(e, inv)}
                                                                className="cursor-pointer"
                                                                aria-label={isRtl ? 'تعديل الفاتورة' : 'Edit invoice'}
                                                                title={isRtl ? 'تعديل الفاتورة' : 'Edit invoice'}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                                {isRtl ? 'لا توجد فواتير مطابقة.' : 'No invoices found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <Pagination
                                currentPage={currentPage}
                                count={invoicesCount}
                                onPageChange={setCurrentPage}
                                pageSize={15}
                            />
                        </div>
                    </>
                )}
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
