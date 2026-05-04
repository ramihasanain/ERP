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

const toDateInputValue = (value) => {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    if (s === '-') return '';
    const ymd = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (ymd) return ymd[1];
    const parsed = new Date(s);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
};

const financeLockedStatuses = new Set(['posted', 'paid']);

const normalizeBillDetails = (bill) => {
    if (!bill) return null;

    const dueDateIso = toDateInputValue(bill.due_date);

    return {
        id: bill.id || '',
        number: bill.number || '-',
        vendorInvoiceNumber: bill.vendor_invoice_number || '-',
        vendorName: bill.vendor_name || '-',
        billDate: bill.bill_date || '-',
        dueDate: dueDateIso || bill.due_date || '-',
        dueDateIso,
        poNumber: bill.po_number || '-',
        description: bill.description || '',
        rawStatus: String(bill.status || '').toLowerCase(),
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

    const updateBillAccountMutation = useCustomPatch(
        billId ? `/api/purchasing/bills/${billId}/` : '/api/purchasing/bills/',
        [['purchasing-bills'], ['purchasing-bill-details', billId]]
    );

    const bill = useMemo(() => billDetailsQuery.data ?? null, [billDetailsQuery.data]);
    const [editableLines, setEditableLines] = useState([]);
    const [editableDueDate, setEditableDueDate] = useState('');
    const [isPostedLocked, setIsPostedLocked] = useState(false);
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);

    useEffect(() => {
        if (!bill?.lines) {
            setEditableLines([]);
            return;
        }

        setEditableLines(
            bill.lines.map((line) => ({
                ...line,
                accountId: line.accountId || '',
                accountName: line.accountName || '',
            }))
        );
    }, [bill]);

    useEffect(() => {
        if (!bill) {
            setEditableDueDate('');
            return;
        }
        setEditableDueDate(bill.dueDateIso || '');
    }, [bill]);

    useEffect(() => {
        setIsPostedLocked(financeLockedStatuses.has(bill?.rawStatus));
    }, [bill?.rawStatus]);

    const isBillPosted = isPostedLocked || financeLockedStatuses.has(bill?.rawStatus);
    const changedLines = useMemo(() => {
        if (!bill?.lines?.length) return [];

        const originalLineById = new Map(
            bill.lines.map((line) => [
                line.id,
                {
                    description: line.description || '',
                },
            ])
        );

        return editableLines
            .filter((line) => {
                const originalLine = originalLineById.get(line.id) || { description: '' };
                const isDescriptionChanged = (line.description || '') !== originalLine.description;
                return isDescriptionChanged;
            })
            .map((line) => {
                const originalLine = originalLineById.get(line.id) || { description: '' };
                const nextLine = { id: line.id };

                if ((line.description || '') !== originalLine.description) {
                    nextLine.description = line.description || '';
                }

                return nextLine;
            });
    }, [bill?.lines, editableLines]);

    const isSendBusy = updateBillAccountMutation.isPending || isSubmittingPost;

    const isDueDateChanged =
        bill &&
        (editableDueDate || '') !== (bill.dueDateIso || '');

    const handleLineDescriptionChange = (lineId, nextDescription) => {
        if (isBillPosted) return;
        setEditableLines((prev) =>
            prev.map((line) => (line.id === lineId ? { ...line, description: nextDescription } : line))
        );
    };

    const handlePatchBill = async () => {
        if (!billId || isSendBusy) return;

        const payload = {
            status: 'posted',
        };

        if (changedLines.length > 0) {
            payload.lines = changedLines;
        }

        if (isDueDateChanged) {
            payload.due_date = editableDueDate || null;
        }

        try {
            setIsSubmittingPost(true);
            await updateBillAccountMutation.mutateAsync(payload);
            setIsPostedLocked(true);
            toast.success('Bill sent to finance successfully.');
            onClose();
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Failed to send bill to finance.';
            toast.error(message);
        } finally {
            setIsSubmittingPost(false);
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
                                        {isBillPosted ? (
                                            <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{bill.dueDate}</p>
                                        ) : (
                                            <input
                                                type="date"
                                                value={editableDueDate}
                                                onChange={(event) => setEditableDueDate(event.target.value)}
                                                disabled={updateBillAccountMutation.isPending}
                                                className="font-normal cursor-pointer"
                                                style={{
                                                    marginTop: '0.2rem',
                                                    width: '100%',
                                                    maxWidth: '220px',
                                                    padding: '0.45rem 0.625rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'var(--color-bg-surface)',
                                                    color: 'var(--color-text-main)',
                                                    fontFamily: 'inherit',
                                                    fontSize: '0.9rem',
                                                }}
                                            />
                                        )}
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
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Bill Lines</h3>
                                    </div>
                                    {!financeLockedStatuses.has(bill?.rawStatus) && (
                                        <button
                                            type="button"
                                            onClick={handlePatchBill}
                                            disabled={isSendBusy}
                                            className="cursor-pointer font-medium"
                                            style={{
                                                border: '1px solid',
                                                borderColor: !isSendBusy ? 'var(--color-primary)' : 'var(--color-border)',
                                                borderRadius: '8px',
                                                height: '2.4rem',
                                                padding: '0 1rem',
                                                background: !isSendBusy ? 'var(--color-primary)' : 'var(--color-bg-table-header)',
                                                color: !isSendBusy ? 'var(--color-white)' : 'var(--color-text-secondary)',
                                                boxShadow: !isSendBusy ? '0 6px 14px rgba(37, 99, 235, 0.25)' : 'none',
                                                fontWeight: 700,
                                                letterSpacing: '0.2px',
                                                cursor: !isSendBusy ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {isSendBusy ? 'Sending...' : 'Send to finance'}
                                        </button>
                                    )}
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
                                                    <td style={{ padding: '0.8rem 1rem', minWidth: '260px' }}>
                                                        {isBillPosted ? (
                                                            <p style={{ margin: 0, color: 'var(--color-text-main)' }}>
                                                                {line.description || '-'}
                                                            </p>
                                                        ) : (
                                                            <textarea
                                                                value={line.description || ''}
                                                                onChange={(event) => handleLineDescriptionChange(line.id, event.target.value)}
                                                                disabled={updateBillAccountMutation.isPending}
                                                                placeholder="Line description"
                                                                style={{
                                                                    width: '100%',
                                                                    minHeight: '64px',
                                                                    resize: 'vertical',
                                                                    padding: '0.5rem 0.625rem',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid var(--color-border)',
                                                                    background: 'var(--color-bg-surface)',
                                                                    color: 'var(--color-text-main)',
                                                                    fontFamily: 'inherit',
                                                                    fontSize: '0.9rem',
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.8rem 1rem', minWidth: '230px' }}>
                                                        <p style={{ margin: 0, color: 'var(--color-text-main)', fontWeight: 500 }}>
                                                            {line.accountName?.trim() ? line.accountName : '—'}
                                                        </p>
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
