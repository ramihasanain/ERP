import React from 'react';
import { useAccounting } from '@/context/AccountingContext';
import { Monitor, Eye } from 'lucide-react';

const formatStatusLabel = (status) => {
    if (!status || typeof status !== 'string') return '';
    const s = status.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const getEntryTotalAmount = (entry) => {
    if (entry.total != null && entry.total !== '') return Number(entry.total);
    if (Array.isArray(entry.lines)) {
        return entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
    }
    return 0;
};

const isSystemSourceEntry = (entry) => {
    if (entry.isAutomatic) return true;
    const normalizedSource = (entry.sourceType || entry.source || '').toString().trim().toLowerCase();
    if (normalizedSource && normalizedSource !== 'manual') return true;
    return /\bPAYROLL\b/i.test(entry.reference || '');
};

const formatSourceLabel = (entry) => {
    const rawSource = (entry.sourceType || entry.source || '').toString().trim();
    if (!rawSource) {
        return isSystemSourceEntry(entry) ? 'System' : 'Manual';
    }

    return rawSource
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const JournalEntryList = ({ entries = [], limit, onViewEntry }) => {
    const { openDrawer } = useAccounting();
    // Keep backend order exactly as received.
    const displayEntries = limit ? entries.slice(0, limit) : entries;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Title</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Reference</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Source</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {displayEntries.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No journal entries found.
                            </td>
                        </tr>
                    ) : (
                        displayEntries.map((entry) => {
                            const totalAmount = getEntryTotalAmount(entry);
                            const currency = entry.currency || 'JOD';
                            const isAuto = isSystemSourceEntry(entry);
                            const sourceLabel = formatSourceLabel(entry);
                            const statusKey = (entry.status || '').toLowerCase();
                            const statusLabel = formatStatusLabel(entry.status);

                            return (
                                <tr
                                    key={entry.id}
                                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                                    className="erp-table-row-hover"
                                    onClick={() => onViewEntry?.(entry.id)}
                                >
                                    <td style={{ padding: '1rem 1rem' }}>{entry.date}</td>
                                    <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{entry.title}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{entry.reference || '-'}</td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        {isAuto ? (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-600)',
                                                background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))', padding: '0.25rem 0.5rem', borderRadius: '4px'
                                            }}>
                                                <Monitor size={12} /> {sourceLabel}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{sourceLabel}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {entry.description}
                                    </td>

                                    <td style={{ padding: '1rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                        {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            background: statusKey === 'posted'
                                                ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))'
                                                : statusKey === 'draft'
                                                    ? 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-card))'
                                                    : 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))',
                                            color: statusKey === 'posted' ? 'var(--color-success)' :
                                                statusKey === 'draft' ? 'var(--color-text-secondary)' : 'var(--color-primary-500)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            border: `1px solid ${statusKey === 'posted' ? 'color-mix(in srgb, var(--color-success) 35%, var(--color-border))' :
                                                statusKey === 'draft' ? 'var(--color-border)' : 'color-mix(in srgb, var(--color-primary-600) 30%, var(--color-border))'}`
                                        }}>{statusLabel}</span>
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDrawer('Journal', entry.id);
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}
                                            title="View Activity"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default JournalEntryList;
