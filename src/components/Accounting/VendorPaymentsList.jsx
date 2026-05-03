import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Modal from '@/components/Shared/Modal';
import { get, post } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Search, ArrowLeft, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCustomQuery from '@/hooks/useQuery';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { toast } from 'sonner';
import BillPaymentModal from '@/components/Procurement/BillPaymentModal';

const VendorPaymentsList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPaymentId, setSelectedPaymentId] = useState('');
    const [payingBill, setPayingBill] = useState(null);
    const [resolvingPaymentId, setResolvingPaymentId] = useState('');
    const statusParam = useMemo(
        () => (filterStatus === 'All' ? '' : filterStatus.toLowerCase().replace(/\s+/g, '_')),
        [filterStatus]
    );
    const searchParam = useMemo(() => searchTerm.trim(), [searchTerm]);
    const paymentsListUrl = useMemo(() => {
        const queryParams = new URLSearchParams();
        if (searchParam) queryParams.set('search', searchParam);
        if (statusParam) queryParams.set('status', statusParam);
        const serialized = queryParams.toString();
        return serialized ? `/api/purchasing/payments/?${serialized}` : '/api/purchasing/payments/';
    }, [searchParam, statusParam]);
    const vendorPaymentsQuery = useCustomQuery(paymentsListUrl, ['purchasing-vendor-payments', searchParam, statusParam]);
    const selectedPaymentQuery = useCustomQuery(
        selectedPaymentId ? `/api/purchasing/payments/${selectedPaymentId}/` : '',
        ['purchasing-vendor-payment-details', selectedPaymentId || 'none'],
        {
            enabled: Boolean(selectedPaymentId),
        }
    );

    const rejectPaymentMutation = useMutation({
        mutationFn: (paymentId) => post(`/api/purchasing/payments/${paymentId}/reject/`, {}),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['purchasing-vendor-payments'] });
            toast.success('Payment rejected successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to reject payment.'));
        },
    });

    const normalizedPayments = useMemo(() => {
        const response = vendorPaymentsQuery.data;
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.results)) return response.results;
        return [];
    }, [vendorPaymentsQuery.data]);

    const filteredPayments = normalizedPayments;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
            case 'Approved': return 'var(--color-success)';
            case 'rejected':
            case 'Rejected': return 'var(--color-error)';
            case 'pending_approval':
            case 'Pending Approval': return 'var(--color-warning)';
            default: return 'var(--color-text-muted)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
            case 'Approved': return <CheckCircle size={16} />;
            case 'rejected':
            case 'Rejected': return <XCircle size={16} />;
            case 'pending_approval':
            case 'Pending Approval': return <Clock size={16} />;
            default: return null;
        }
    };

    const resolveBillIdFromPayload = (payload) => {
        if (!payload) return '';
        if (payload.bill_id != null && payload.bill_id !== '') return String(payload.bill_id);
        const nested = payload.bill;
        if (nested && typeof nested === 'object' && nested.id != null) return String(nested.id);
        if (typeof nested === 'string' && nested) return nested;
        return '';
    };

    const buildBillStubFromPaymentPayload = (payload, payFallback) => ({
        id: resolveBillIdFromPayload(payload),
        totalAmount: Number.parseFloat(payload?.amount ?? payFallback?.amount ?? 0) || 0,
        vendorName: payload?.vendor_name || payFallback?.vendor_name || '-',
        vendorId: payload?.vendor_id ?? payFallback?.vendor_id,
    });

    const openBillPayment = async (pay) => {
        let billStub = buildBillStubFromPaymentPayload(pay, pay);
        if (!billStub.id) {
            setResolvingPaymentId(String(pay.id));
            try {
                const detail = await get(`/api/purchasing/payments/${pay.id}/`);
                billStub = buildBillStubFromPaymentPayload(detail, pay);
            } catch (error) {
                toast.error(getApiErrorMessage(error, 'Failed to load payment for pay action.'));
                return;
            } finally {
                setResolvingPaymentId('');
            }
        }
        if (!billStub.id) {
            toast.error('Could not find the linked bill for this payment.');
            return;
        }
        setPayingBill(billStub);
    };

    const handleBillPaymentSuccess = async () => {
        await queryClient.invalidateQueries({ queryKey: ['purchasing-vendor-payments'] });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vendor Payment Clearances</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Pay or reject bill payment requests from Procurement.</p>
                    </div>
                </div>
            </div>

            <Card className="padding-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by bill, payment number, or vendor..."
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
                    {['All', 'Pending Approval', 'Approved', 'Rejected'].map(status => (
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
                            {status === 'Pending Approval' ? 'Pending' : status}
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Payment ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bill Reference</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Amount</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendorPaymentsQuery.isPending && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Loading payment requests...
                                </td>
                            </tr>
                        )}
                        {vendorPaymentsQuery.isError && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                    Failed to load payment requests.
                                </td>
                            </tr>
                        )}
                        {filteredPayments.map(pay => (
                            <tr key={pay.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>{pay.number || pay.id}</td>
                                <td style={{ padding: '1rem' }}>{pay.payment_date || '-'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{pay.bill_number || '-'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        {pay.vendor_name || '-'}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 700 }}>
                                    {(Number.parseFloat(pay.amount || 0) || 0).toLocaleString()} JOD
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {(() => {
                                        const statusValue = pay.status_display || pay.status || '-';
                                        const statusKey = pay.status || pay.status_display || '';
                                        return (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 10px', borderRadius: '20px',
                                        background: `${getStatusColor(statusKey)}15`,
                                        color: getStatusColor(statusKey),
                                        fontWeight: 600, fontSize: '0.75rem'
                                    }}>
                                        {getStatusIcon(statusKey)}
                                        {statusValue}
                                    </span>
                                        );
                                    })()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedPaymentId(pay.id)}
                                        >
                                            View
                                        </Button>
                                        {pay.status === 'pending_approval' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<CreditCard size={14} />}
                                                    onClick={() => openBillPayment(pay)}
                                                    disabled={resolvingPaymentId === String(pay.id) || rejectPaymentMutation.isPending}
                                                    style={{ color: 'var(--color-primary-600)', borderColor: 'var(--color-primary-200)' }}
                                                >
                                                    Pay
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                                    onClick={() => rejectPaymentMutation.mutate(pay.id)}
                                                    disabled={resolvingPaymentId === String(pay.id) || rejectPaymentMutation.isPending}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!vendorPaymentsQuery.isPending && !vendorPaymentsQuery.isError && filteredPayments.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No payment requests found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <Modal
                isOpen={Boolean(selectedPaymentId)}
                onClose={() => setSelectedPaymentId('')}
                title="Vendor Payment Details"
                size="lg"
            >
                {selectedPaymentQuery.isLoading && (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading payment details...</p>
                )}

                {selectedPaymentQuery.isError && (
                    <p style={{ color: 'var(--color-error)' }}>
                        {getApiErrorMessage(selectedPaymentQuery.error, 'Failed to load payment details.')}
                    </p>
                )}

                {!selectedPaymentQuery.isLoading && !selectedPaymentQuery.isError && selectedPaymentQuery.data && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                        <div><strong>Payment Number:</strong> {selectedPaymentQuery.data.number || '-'}</div>
                        <div><strong>Status:</strong> {selectedPaymentQuery.data.status_display || '-'}</div>
                        <div><strong>Payment Date:</strong> {selectedPaymentQuery.data.payment_date || '-'}</div>
                        <div><strong>Amount:</strong> {(Number.parseFloat(selectedPaymentQuery.data.amount || 0) || 0).toLocaleString()} JOD</div>
                        <div><strong>Bill Number:</strong> {selectedPaymentQuery.data.bill_number || '-'}</div>
                        <div><strong>Invoice Number:</strong> {selectedPaymentQuery.data.vendor_invoice_number || '-'}</div>
                        <div><strong>Vendor:</strong> {selectedPaymentQuery.data.vendor_name || '-'}</div>
                        <div><strong>Method:</strong> {selectedPaymentQuery.data.method_display || '-'}</div>
                        <div><strong>Paid From:</strong> {selectedPaymentQuery.data.paid_from_name || '-'}</div>
                        <div><strong>Reference:</strong> {selectedPaymentQuery.data.reference || '-'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {selectedPaymentQuery.data.notes || '-'}</div>
                    </div>
                )}
            </Modal>

            {payingBill && (
                <BillPaymentModal
                    bill={payingBill}
                    onClose={() => setPayingBill(null)}
                    onPaymentSuccess={handleBillPaymentSuccess}
                />
            )}
        </div>
    );
};

export default VendorPaymentsList;
