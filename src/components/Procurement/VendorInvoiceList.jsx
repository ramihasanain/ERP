import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Plus, Eye, Search, Filter, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BillPaymentModal from '@/components/Procurement/BillPaymentModal';
import VendorBillDetailsModal from '@/components/Procurement/VendorBillDetailsModal';
import useCustomQuery from '@/hooks/useQuery';
import Spinner from '@/core/Spinner';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const toTitleCase = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeBill = (bill) => ({
    id: bill?.id || '',
    billNumber: bill?.number || '',
    vendorInvoiceNumber: bill?.vendor_invoice_number || '',
    date: bill?.bill_date || '-',
    vendorName: bill?.vendor_name || '-',
    poReference: bill?.po_number || '',
    totalAmount: Number(bill?.total_payable ?? 0),
    currency: bill?.currency || 'DZD',
    status: bill?.status_display || toTitleCase(bill?.status || ''),
});

const buildBillsUrl = ({ name, status }) => {
    const params = new URLSearchParams();
    if (name?.trim()) params.set('name', name.trim());
    if (status && status !== 'All') params.set('status', status.toLowerCase());
    const queryString = params.toString();
    return queryString ? `/api/purchasing/bills/?${queryString}` : '/api/purchasing/bills/';
};

const VendorInvoiceList = () => {
    const navigate = useNavigate();
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth < 1100);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [payingBill, setPayingBill] = useState(null);
    const [viewingBillId, setViewingBillId] = useState('');
    const [statusOverrides, setStatusOverrides] = useState({});

    const handlePaymentSuccess = (billId) => {
        setStatusOverrides((prev) => ({ ...prev, [billId]: 'Paid' }));
    };

    const billsUrl = useMemo(
        () => buildBillsUrl({ name: searchTerm, status: filterStatus }),
        [searchTerm, filterStatus]
    );

    const billsQuery = useCustomQuery(billsUrl, ['purchasing-bills', searchTerm.trim(), filterStatus], {
        select: (response) => normalizeArrayResponse(response).map(normalizeBill),
    });

    const invoices = useMemo(
        () =>
            (billsQuery.data ?? []).map((inv) => ({
                ...inv,
                status: statusOverrides[inv.id] || inv.status,
            })),
        [billsQuery.data, statusOverrides]
    );

    const filteredInvoices = invoices;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'var(--color-slate-500)';
            case 'Posted': return 'var(--color-success)';
            case 'Paid': return 'var(--color-primary-700)';
            default: return 'var(--color-text-main)';
        }
    };

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: isNarrowScreen ? 'column' : 'row', justifyContent: 'space-between', alignItems: isNarrowScreen ? 'flex-start' : 'center', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Vendor Invoices (Bills)</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage supplier bills and payments</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} size={isNarrowScreen ? 'sm' : undefined} onClick={() => navigate('/admin/inventory/invoices/new')} style={{ alignSelf: isNarrowScreen ? 'flex-end' : 'auto' }}>
                    Record New Bill
                </Button>
            </div>

            <Card className="padding-md" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search Bills or Vendors..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['All', 'Draft', 'Posted', 'Paid'].map(status => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '6px',
                                background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                                boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                {billsQuery.isPending && (
                    <div style={{ padding: '2rem' }}>
                        <Spinner />
                    </div>
                )}
                {billsQuery.isError && (
                    <div style={{ padding: '2rem', color: 'var(--color-error)' }}>
                        Failed to load vendor bills.
                    </div>
                )}
                {!billsQuery.isPending && !billsQuery.isError && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bill ID (Internal)</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Vendor Inv #</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Vendor</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reference (PO)</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Amount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{inv.billNumber || inv.id}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.vendorInvoiceNumber}</td>
                                <td style={{ padding: '1rem' }}>{inv.date}</td>
                                <td style={{ padding: '1rem' }}>{inv.vendorName}</td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {inv.poReference || '-'}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.totalAmount.toLocaleString()} {inv.currency}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px',
                                        background: `${getStatusColor(inv.status)}20`,
                                        color: getStatusColor(inv.status),
                                        fontWeight: 600, fontSize: '0.8rem'
                                    }}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {inv.status !== 'Paid' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<CreditCard size={14} />}
                                                onClick={() => setPayingBill(inv)}
                                                style={{ color: 'var(--color-primary-600)', borderColor: 'var(--color-primary-200)' }}
                                            >
                                                Pay
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Eye size={14} />}
                                            onClick={() => setViewingBillId(inv.id)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No vendor bills found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                )}
            </Card>

            {payingBill && (
                <BillPaymentModal
                    bill={payingBill}
                    onClose={() => setPayingBill(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
            <VendorBillDetailsModal
                billId={viewingBillId}
                isOpen={Boolean(viewingBillId)}
                onClose={() => setViewingBillId('')}
            />
        </div>
    );
};

export default VendorInvoiceList;
