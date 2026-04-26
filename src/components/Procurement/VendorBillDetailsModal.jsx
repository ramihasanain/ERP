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

    const bankAccountsQuery = useCustomQuery(
        '/accounting/accounts/',
        ['accounting-accounts'],
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
            }))
        );
    }, [bill]);

    useEffect(() => {
        setIsPostedLocked(Boolean(bill?.rawStatus === 'posted'));
    }, [bill?.rawStatus]);

    const isBillPosted = isPostedLocked || bill?.rawStatus === 'posted';
    const allLinesHaveAccount = editableLines.length > 0 && editableLines.every((line) => Boolean(line.accountId));
    const changedLines = useMemo(() => {
        if (!bill?.lines?.length) return [];

        const originalLineById = new Map(
            bill.lines.map((line) => [
                line.id,
                {
                    accountId: line.accountId || '',
                    description: line.description || '',
                },
            ])
        );

        return editableLines
            .filter((line) => {
                const originalLine = originalLineById.get(line.id) || { accountId: '', description: '' };
                const isAccountChanged = Boolean(line.accountId) && line.accountId !== originalLine.accountId;
                const isDescriptionChanged = (line.description || '') !== originalLine.description;
                return isAccountChanged || isDescriptionChanged;
            })
            .map((line) => {
                const originalLine = originalLineById.get(line.id) || { accountId: '', description: '' };
                const nextLine = { id: line.id };

                if (Boolean(line.accountId) && line.accountId !== originalLine.accountId) {
                    nextLine.account_id = line.accountId;
                }

                if ((line.description || '') !== originalLine.description) {
                    nextLine.description = line.description || '';
                }

                return nextLine;
            });
    }, [bill?.lines, editableLines]);

    const hasChangesToSubmit = changedLines.length > 0;
    const canPatchBill = !isBillPosted && allLinesHaveAccount && hasChangesToSubmit;

    const handleLineAccountChange = (lineId, selectedAccountId) => {
        if (isBillPosted) return;
        setEditableLines((prev) =>
            prev.map((line) => (line.id === lineId ? { ...line, accountId: selectedAccountId } : line))
        );
    };

    const handleLineDescriptionChange = (lineId, nextDescription) => {
        if (isBillPosted) return;
        setEditableLines((prev) =>
            prev.map((line) => (line.id === lineId ? { ...line, description: nextDescription } : line))
        );
    };

    const getAccountLabel = (accountId) => {
        const selected = accountOptions.find((account) => (account.account_id || account.id) === accountId);
        return selected?.account_name || selected?.name || 'Unassigned';
    };

    const handlePatchBill = async () => {
        if (!billId || !canPatchBill || isSubmittingPost || updateBillAccountMutation.isPending) return;

        const payload = {
            status: 'posted',
        };

        if (changedLines.length > 0) {
            payload.lines = changedLines;
        }

        try {
            setIsSubmittingPost(true);
            await updateBillAccountMutation.mutateAsync(payload);
            setIsPostedLocked(true);
            toast.success('Bill posted successfully.');
            onClose();
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Failed to post bill.';
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
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Bill Lines</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePatchBill}
                                        disabled={!canPatchBill || updateBillAccountMutation.isPending || isSubmittingPost}
                                        style={{
                                            border: '1px solid',
                                            borderColor: canPatchBill && !updateBillAccountMutation.isPending && !isSubmittingPost
                                                ? 'var(--color-primary)'
                                                : 'var(--color-border)',
                                            borderRadius: '8px',
                                            height: '2.4rem',
                                            padding: '0 1rem',
                                            background: canPatchBill && !updateBillAccountMutation.isPending && !isSubmittingPost
                                                ? 'var(--color-primary)'
                                                : 'var(--color-bg-table-header)',
                                            color: canPatchBill && !updateBillAccountMutation.isPending && !isSubmittingPost
                                                ? 'var(--color-white)'
                                                : 'var(--color-text-secondary)',
                                            boxShadow: canPatchBill && !updateBillAccountMutation.isPending && !isSubmittingPost
                                                ? '0 6px 14px rgba(37, 99, 235, 0.25)'
                                                : 'none',
                                            fontWeight: 700,
                                            letterSpacing: '0.2px',
                                            cursor: canPatchBill && !updateBillAccountMutation.isPending && !isSubmittingPost ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {updateBillAccountMutation.isPending || isSubmittingPost ? 'Posting...' : isBillPosted ? 'Posted' : 'Post Bill'}
                                    </button>
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
                                                        {isBillPosted ? (
                                                            <p style={{ margin: 0, color: 'var(--color-text-main)', fontWeight: 500 }}>
                                                                {getAccountLabel(line.accountId)}
                                                            </p>
                                                        ) : (
                                                            <select
                                                                value={line.accountId || ''}
                                                                onChange={(event) => handleLineAccountChange(line.id, event.target.value)}
                                                                disabled={updateBillAccountMutation.isPending}
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
                                                                    <option key={account.id || account.account_id} value={account.id || account.account_id || ''}>
                                                                        {account.account_name || account.name || 'Unnamed account'}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
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
