import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useAudit } from '@/context/AuditContext';
import { useAccounting } from '@/context/AccountingContext';
import {
    Shield, CheckCircle, XCircle, Clock, Edit3, FileText, Building2,
    ThumbsUp, ThumbsDown, AlertTriangle, ArrowRight, GitCompare
} from 'lucide-react';

const AuditorAdjustmentsPage = () => {
    const { auditChanges, approveChange, rejectChange, getPendingChanges, auditFirms, clientCompanies } = useAudit();
    const { updateAccount, updateEntry, entries, setInvoices, invoices, deleteAccount } = useAccounting();
    const [filter, setFilter] = useState('all');
    const [adminNotes, setAdminNotes] = useState({});

    const filtered = filter === 'all' ? auditChanges : auditChanges.filter(c => c.status === filter);
    const pending = getPendingChanges();

    const statusConfig = {
        pending: { label: 'Pending', icon: <Clock size={14} />, bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' },
        approved: { label: 'Approved', icon: <CheckCircle size={14} />, bg: 'var(--color-success-dim)', color: 'var(--color-success)' },
        rejected: { label: 'Rejected', icon: <XCircle size={14} />, bg: 'var(--color-error-dim)', color: 'var(--color-error)' },
    };

    const typeLabels = {
        account: 'Account',
        journal_entry: 'Journal Entry',
        journal_line: 'Journal Line',
        invoice: 'Invoice'
    };

    // Apply the actual data change when admin approves
    const applyChangeToData = (change) => {
        try {
            if (change.entityType === 'account') {
                if (change.field === 'name') {
                    updateAccount(change.entityId, { name: change.newValue });
                } else if (change.field === 'deleted' || change.field === 'new account') {
                    // For new accounts and deletions - already handled or skipped
                }
            } else if (change.entityType === 'journal_entry') {
                if (change.field === 'description') {
                    updateEntry(change.entityId, { description: change.newValue });
                } else if (change.field === 'deleted') {
                    updateEntry(change.entityId, { status: 'Deleted' });
                }
            } else if (change.entityType === 'journal_line') {
                // Parse field like "debit (Cash)" or "credit (Revenue)"
                const isDebit = change.field.startsWith('debit');
                const accountMatch = change.field.match(/\((.+)\)/);
                const accountName = accountMatch ? accountMatch[1] : '';
                const entry = entries?.find(e => e.id === change.entityId);
                if (entry && accountName) {
                    const newLines = entry.lines.map(line => {
                        if (line.account === accountName) {
                            return isDebit
                                ? { ...line, debit: parseFloat(change.newValue) || 0 }
                                : { ...line, credit: parseFloat(change.newValue) || 0 };
                        }
                        return line;
                    });
                    updateEntry(change.entityId, { lines: newLines });
                }
            } else if (change.entityType === 'invoice') {
                if (change.field === 'deleted') {
                    setInvoices(prev => (prev || []).filter(i => i.id !== change.entityId));
                } else {
                    const fieldMap = { customer: 'customerName', total: 'total', status: 'status', date: 'date' };
                    const dataField = fieldMap[change.field] || change.field;
                    const val = change.field === 'total' ? parseFloat(change.newValue) || 0 : change.newValue;
                    setInvoices(prev => (prev || []).map(i => i.id === change.entityId ? { ...i, [dataField]: val } : i));
                }
            }
        } catch (err) {
            console.error('Failed to apply change:', err);
        }
    };

    const handleApprove = (changeId) => {
        const change = auditChanges.find(c => c.id === changeId);
        if (change) applyChangeToData(change);
        approveChange(changeId, adminNotes[changeId] || 'Approved');
        setAdminNotes(prev => ({ ...prev, [changeId]: '' }));
    };

    const handleReject = (changeId) => {
        if (!(adminNotes[changeId] || '').trim()) return alert('Please enter rejection reason');
        rejectChange(changeId, adminNotes[changeId]);
        setAdminNotes(prev => ({ ...prev, [changeId]: '' }));
    };

    const handleApproveAll = () => {
        if (!confirm(`Approve all ${pending.length} pending changes?`)) return;
        pending.forEach(c => {
            applyChangeToData(c);
            approveChange(c.id, 'Batch approved');
        });
    };

    const handleRejectAll = () => {
        const reason = prompt('Enter rejection reason for all pending changes:');
        if (!reason) return;
        pending.forEach(c => rejectChange(c.id, reason));
    };

    const getCompanyName = (companyId) => clientCompanies?.find(c => c.id === companyId)?.name || 'Unknown';

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                        <GitCompare size={24} /> Auditor Change Report
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        Review all changes made by auditors. Compare old and new values before approving.
                    </p>
                </div>
                {pending.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{
                            padding: '0.5rem 1rem', borderRadius: '10px',
                            background: 'var(--color-warning-dim)', color: 'var(--color-warning)',
                            fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <AlertTriangle size={16} /> {pending.length} Pending
                        </div>
                        <Button size="sm" style={{ background: 'var(--color-success)' }} icon={<ThumbsUp size={14} />} onClick={handleApproveAll}>
                            Approve All
                        </Button>
                        <Button size="sm" variant="outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }} icon={<ThumbsDown size={14} />} onClick={handleRejectAll}>
                            Reject All
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Changes', value: auditChanges.length, color: 'var(--color-text-secondary)' },
                    { label: 'Pending', value: auditChanges.filter(c => c.status === 'pending').length, color: 'var(--color-warning)' },
                    { label: 'Approved', value: auditChanges.filter(c => c.status === 'approved').length, color: 'var(--color-success)' },
                    { label: 'Rejected', value: auditChanges.filter(c => c.status === 'rejected').length, color: 'var(--color-error)' },
                ].map((s, i) => (
                    <Card key={i} className="padding-md">
                        <div style={{ fontSize: '0.73rem', color: s.color, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{s.value}</div>
                    </Card>
                ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                        padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: filter === tab.id ? 'var(--color-primary-600)' : 'var(--color-bg-body)',
                        color: filter === tab.id ? '#fff' : 'var(--color-text-secondary)',
                        fontWeight: 600, fontSize: '0.82rem'
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Changes List */}
            {filtered.length === 0 ? (
                <Card className="padding-lg" style={{ textAlign: 'center' }}>
                    <GitCompare size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>No changes found</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Changes will appear when auditors modify accounting data.</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.map(change => {
                        const sc = statusConfig[change.status];
                        return (
                            <Card key={change.id} className="padding-none" style={{ borderLeft: `4px solid ${sc.color}`, overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{ padding: '1rem 1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{change.field}</span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem',
                                                    fontWeight: 700, background: sc.bg, color: sc.color,
                                                    display: 'flex', alignItems: 'center', gap: '0.2rem'
                                                }}>{sc.icon} {sc.label}</span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    background: 'color-mix(in srgb, var(--color-primary-600) 25%, var(--color-bg-card))',
                                                    color: 'var(--color-primary-400)'
                                                }}>{typeLabels[change.entityType] || change.entityType}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                                                <span><Shield size={11} /> {change.auditorName}</span>
                                                <span><Building2 size={11} /> {getCompanyName(change.companyId)}</span>
                                                <span><Clock size={11} /> {change.createdAt}</span>
                                                <span><FileText size={11} /> {change.entityId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* OLD vs NEW Comparison */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem',
                                        alignItems: 'center', padding: '0.75rem', borderRadius: '10px',
                                        background: 'var(--color-bg-body)', border: '1px solid var(--color-border)'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Old Value</div>
                                            <div style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '6px',
                                                background: 'color-mix(in srgb, var(--color-error) 20%, var(--color-bg-card))',
                                                color: 'var(--color-error)',
                                                fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600,
                                                textDecoration: 'line-through', wordBreak: 'break-all'
                                            }}>{change.oldValue}</div>
                                        </div>
                                        <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>New Value</div>
                                            <div style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '6px',
                                                background: 'color-mix(in srgb, var(--color-success) 20%, var(--color-bg-card))',
                                                color: 'var(--color-success)',
                                                fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700,
                                                wordBreak: 'break-all'
                                            }}>{change.newValue}</div>
                                        </div>
                                    </div>

                                    {/* Admin decision note */}
                                    {change.adminNotes && change.status !== 'pending' && (
                                        <div style={{
                                            marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px',
                                            background: change.status === 'approved' ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
                                            fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between'
                                        }}>
                                            <span><strong>Admin:</strong> {change.adminNotes}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Reviewed: {change.reviewedAt}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Approve/Reject for pending */}
                                {change.status === 'pending' && (
                                    <div style={{
                                        padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)',
                                        background: 'var(--color-warning-dim)'
                                    }}>
                                        <textarea
                                            value={adminNotes[change.id] || ''}
                                            onChange={e => setAdminNotes(prev => ({ ...prev, [change.id]: e.target.value }))}
                                            placeholder="Admin notes (required for rejection)..."
                                            style={{
                                                width: '100%', minHeight: '50px', padding: '0.5rem', borderRadius: '6px',
                                                border: '1px solid var(--color-border)', fontSize: '0.82rem',
                                                fontFamily: 'inherit', resize: 'vertical', marginBottom: '0.5rem', boxSizing: 'border-box',
                                                background: 'var(--color-bg-surface)', color: 'var(--color-text-main)'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="outline"
                                                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                icon={<ThumbsDown size={14} />}
                                                onClick={() => handleReject(change.id)}
                                            >
                                                Reject Change
                                            </Button>
                                            <Button
                                                style={{ background: 'var(--color-success)' }}
                                                icon={<ThumbsUp size={14} />}
                                                onClick={() => handleApprove(change.id)}
                                            >
                                                Approve Change
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AuditorAdjustmentsPage;
