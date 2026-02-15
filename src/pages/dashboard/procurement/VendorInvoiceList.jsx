import React, { useState } from 'react';
import { useProcurement } from '../../../context/ProcurementContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Plus, Eye, Search, Filter, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BillPaymentModal from './BillPaymentModal';

const VendorInvoiceList = () => {
    const { vendorInvoices, updateInvoiceStatus } = useProcurement();
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [payingBill, setPayingBill] = useState(null);

    const handlePaymentSuccess = (billId) => {
        updateInvoiceStatus(billId, 'Paid');
    };

    const filteredInvoices = vendorInvoices.filter(inv => {
        const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
        const matchesSearch = inv.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'var(--color-slate-500)';
            case 'Posted': return 'var(--color-success)';
            case 'Paid': return 'var(--color-primary-700)';
            default: return 'var(--color-text-primary)';
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Vendor Invoices (Bills)</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage supplier bills and payments</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/inventory/invoices/new')}>
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
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['All', 'Draft', 'Posted', 'Paid'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: filterStatus === status ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: filterStatus === status ? 'var(--color-primary-50)' : 'white',
                                color: filterStatus === status ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500
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
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-slate-50)' }}>
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
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{inv.id}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.vendorInvoiceNumber}</td>
                                <td style={{ padding: '1rem' }}>{inv.date}</td>
                                <td style={{ padding: '1rem' }}>{inv.vendorName}</td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {inv.poReference || '-'}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.totalAmount.toLocaleString()} JOD</td>
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
                                        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => { }}>
                                            View
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No vendor bills found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {payingBill && (
                <BillPaymentModal
                    bill={payingBill}
                    onClose={() => setPayingBill(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default VendorInvoiceList;
