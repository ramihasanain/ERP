import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch } from '@/hooks/useMutation';
import { toast } from 'sonner';

const toTitleCase = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeBillDetails = (bill) => {
    if (!bill) return null;

    return {
        id: bill.id || '',
        number: bill.number || '-',
        vendorInvoiceNumber: bill.vendor_invoice_number || '-',
        vendorName: bill.vendor_name || '-',
        billDate: bill.bill_date || '-',
        dueDate: bill.due_date || '-',
        poNumber: bill.po_number || '-',
        currency: bill.currency || 'DZD',
        status: bill.status_display || toTitleCase(bill.status || '-'),
        totalPayable: Number(bill.total_payable ?? 0),
        lines: Array.isArray(bill.lines)
            ? bill.lines.map((line) => ({
                id: line.id || '',
                accountId: line.account_id || '',
                accountName: line.account_name || '',
                description: line.description || '-',
                amount: Number(line.amount ?? 0),
            }))
            : [],
    };
};

const VendorBillDetailsModal = ({ billId, isOpen, onClose }) => {
    const billDetailsQuery = useCustomQuery(
        billId ? `/api/purchasing/bills/${billId}/` : '/api/purchasing/bills/',
        ['purchasing-bill-details', billId],
        {
            enabled: Boolean(isOpen && billId),
            select: normalizeBillDetails,
        }
    );

    const bankAccountsQuery = useCustomQuery(
        '/accounting/bank-accounts/',
        ['accounting-bank-accounts'],
        {
            enabled: Boolean(isOpen),
            select: (response) => {
                if (Array.isArray(response?.data)) return response.data;
                if (Array.isArray(response?.results)) return response.results;
                if (Array.isArray(response)) return response;
                return [];
            },
        }
    );
    const updateBillAccountMutation = useCustomPatch(
        billId ? `/api/purchasing/bills/${billId}/` : '/api/purchasing/bills/',
        [['purchasing-bills'], ['purchasing-bill-details', billId]]
    );

    const bill = useMemo(() => billDetailsQuery.data ?? null, [billDetailsQuery.data]);
    const accountOptions = useMemo(() => bankAccountsQuery.data ?? [], [bankAccountsQuery.data]);
    const [editableLines, setEditableLines] = useState([]);
    const [savingLineId, setSavingLineId] = useState('');

    useEffect(() => {
        if (!bill?.lines) {
            setEditableLines([]);
            return;
        }

        setEditableLines(
            bill.lines.map((line) => ({
                ...line,
                accountId: line.accountId || '',
            }))
        );
    }, [bill]);

    const handleLineAccountChange = async (lineId, selectedAccountId) => {
        if (!billId || !selectedAccountId) return;

        const previousLine = editableLines.find((line) => line.id === lineId);
        const previousAccountId = previousLine?.accountId || '';

        setEditableLines((prev) =>
            prev.map((line) => (line.id === lineId ? { ...line, accountId: selectedAccountId } : line))
        );

        setSavingLineId(lineId);
        try {
            await updateBillAccountMutation.mutateAsync({
                paid_from_account_id: selectedAccountId,
            });
        } catch (error) {
            setEditableLines((prev) =>
                prev.map((line) => (line.id === lineId ? { ...line, accountId: previousAccountId } : line))
            );
            const message = error?.response?.data?.detail || error?.message || 'Failed to update account.';
            toast.error(message);
        } finally {
            setSavingLineId('');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(2px)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    width: 'min(1000px, 100%)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '12px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 16px 38px rgba(2, 6, 23, 0.2)',
                }}
            >
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-bg-table-header)',
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            Vendor Bill Details
                        </h2>
                        {bill?.number && (
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)' }}>
                                {bill.number}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label="Close details"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                    {billDetailsQuery.isLoading && (
                        <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                            <Spinner />
                        </div>
                    )}

                    {billDetailsQuery.isError && !billDetailsQuery.isLoading && (
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>
                            Failed to load bill details.
                        </p>
                    )}

                    {bill && !billDetailsQuery.isLoading && !billDetailsQuery.isError && (
                        <>
                            <Card className="padding-md" style={{ marginBottom: '1rem' }}>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '0.9rem',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Vendor</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.vendorName}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Vendor Invoice #</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.vendorInvoiceNumber}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Bill Date</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.billDate}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Due Date</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.dueDate}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>PO Number</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.poNumber}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Status</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.status}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Total Payable</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>
                                            {bill.totalPayable.toLocaleString()} {bill.currency}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="padding-none">
                                <div
                                    style={{
                                        padding: '0.9rem 1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    <FileText size={16} />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Bill Lines</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-table-header)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Description</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Account</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editableLines.map((line) => (
                                                <tr key={line.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{line.description}</td>
                                                    <td style={{ padding: '0.8rem 1rem', minWidth: '230px' }}>
                                                        <select
                                                            value={line.accountId || ''}
                                                            onChange={(event) => handleLineAccountChange(line.id, event.target.value)}
                                                            disabled={savingLineId === line.id || updateBillAccountMutation.isPending}
                                                            style={{
                                                                width: '100%',
                                                                height: '2.25rem',
                                                                padding: '0 0.625rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--color-border)',
                                                                background: 'var(--color-bg-surface)',
                                                                color: 'var(--color-text-main)',
                                                            }}
                                                        >
                                                            <option value="">Select account</option>
                                                            {accountOptions.map((account) => (
                                                                <option key={account.account_id || account.id} value={account.account_id || ''}>
                                                                    {account.account_name || account.name || 'Unnamed account'}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                                                        {Number(line.amount || 0).toLocaleString()} {bill.currency}
                                                    </td>
                                                </tr>
                                            ))}
                                            {editableLines.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        style={{
                                                            padding: '1rem',
                                                            textAlign: 'center',
                                                            color: 'var(--color-text-secondary)',
                                                        }}
                                                    >
                                                        This bill has no lines.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorBillDetailsModal;
