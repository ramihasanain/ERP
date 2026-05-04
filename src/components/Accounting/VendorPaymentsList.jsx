import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Search, ArrowLeft, CreditCard, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCustomQuery from '@/hooks/useQuery';
import BillPaymentModal from '@/components/Procurement/BillPaymentModal';
import VendorBillDetailsModal from '@/components/Procurement/VendorBillDetailsModal';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    return [];
};

const toTitleCase = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const allowedBillStatuses = new Set(['posted', 'paid']);

const normalizeBill = (bill) => {
    const rawStatus = String(bill?.status || '').toLowerCase();

    return {
        id: bill?.id || '',
        number: bill?.number || '',
        billDate: bill?.bill_date || '-',
        vendorInvoiceNumber: bill?.vendor_invoice_number || '',
        vendorName: bill?.vendor_name || '-',
        vendorId: bill?.vendor_id,
        poNumber: bill?.po_number || '',
        totalAmount: Number(bill?.total_payable ?? 0),
        remainingBalance: Number(bill?.remaining_balance ?? bill?.total_payable ?? 0),
        currency: bill?.currency || 'DZD',
        status: rawStatus,
        statusDisplay: bill?.status_display || toTitleCase(rawStatus),
    };
};

const buildBillsUrl = ({ name, status }) => {
    const queryParams = new URLSearchParams();
    if (name?.trim()) queryParams.set('name', name.trim());
    if (status && status !== 'All') queryParams.set('status', status.toLowerCase());
    const serialized = queryParams.toString();
    return serialized ? `/api/purchasing/bills/?${serialized}` : '/api/purchasing/bills/';
};

const VendorPaymentsList = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBillId, setSelectedBillId] = useState('');
    const [payingBill, setPayingBill] = useState(null);
    const searchParam = useMemo(() => searchTerm.trim(), [searchTerm]);

    const billsListUrl = useMemo(
        () => buildBillsUrl({ name: searchParam, status: filterStatus }),
        [searchParam, filterStatus]
    );

    const vendorBillsQuery = useCustomQuery(billsListUrl, ['purchasing-bills', 'accounting-vendor-payments', searchParam, filterStatus], {
        select: (response) => normalizeArrayResponse(response).map(normalizeBill),
    });

    const filteredBills = useMemo(
        () => (vendorBillsQuery.data ?? []).filter((bill) => allowedBillStatuses.has(bill.status)),
        [vendorBillsQuery.data]
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'posted':
            case 'Posted': return 'var(--color-success)';
            case 'paid':
            case 'Paid': return 'var(--color-primary-700)';
            default: return 'var(--color-text-muted)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} className="cursor-pointer shrink-0" />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vendor Payment Clearances</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Review posted bills and record vendor payments.</p>
                    </div>
                </div>
            </div>

            <Card className="padding-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by bill, invoice number, or vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                            }}
                        />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['All', 'Posted', 'Paid'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '6px 12px', border: 'none', borderRadius: '6px',
                                background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                                boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bill ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Vendor Invoice</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Payable Amount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendorBillsQuery.isPending && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Loading vendor bills...
                                </td>
                            </tr>
                        )}
                        {vendorBillsQuery.isError && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                    Failed to load vendor bills.
                                </td>
                            </tr>
                        )}
                        {filteredBills.map(bill => (
                            <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>{bill.number || bill.id}</td>
                                <td style={{ padding: '1rem' }}>{bill.billDate}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{bill.vendorInvoiceNumber || '-'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        {bill.vendorName}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 700 }}>
                                    {bill.remainingBalance.toLocaleString()} {bill.currency}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 10px', borderRadius: '20px',
                                        background: `${getStatusColor(bill.status)}15`,
                                        color: getStatusColor(bill.status),
                                        fontWeight: 600, fontSize: '0.75rem'
                                    }}>
                                        {bill.statusDisplay}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Eye size={14} />}
                                            onClick={() => setSelectedBillId(bill.id)}
                                        >
                                            View
                                        </Button>
                                        {bill.status === 'posted' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<CreditCard size={14} strokeWidth={2} aria-hidden />}
                                                onClick={() => setPayingBill(bill)}
                                            >
                                                Pay
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!vendorBillsQuery.isPending && !vendorBillsQuery.isError && filteredBills.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No posted or paid vendor bills found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <VendorBillDetailsModal
                billId={selectedBillId}
                isOpen={Boolean(selectedBillId)}
                onClose={() => setSelectedBillId('')}
            />

            {payingBill && (
                <BillPaymentModal
                    bill={payingBill}
                    onClose={() => setPayingBill(null)}
                />
            )}
        </div>
    );
};

export default VendorPaymentsList;
