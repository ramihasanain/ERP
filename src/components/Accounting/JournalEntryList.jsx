import React from 'react';
import { useAccounting } from '@/context/AccountingContext';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Monitor, User, Eye } from 'lucide-react';

const JournalEntryList = ({ limit }) => {
    const { entries, costCenters, openDrawer } = useAccounting();
    const navigate = useNavigate();

    const getCostCenterName = (id) => {
        const cc = costCenters.find(c => c.id === id);
        return cc ? cc.code : '-';
    };

    // Sort entries by date desc (newest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const displayEntries = limit ? sortedEntries.slice(0, limit) : sortedEntries;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Reference</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Source</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Amount</th>
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
                            const totalAmount = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                            const currency = entry.currency || 'JOD';
                            const isAuto = entry.isAutomatic;

                            return (
                                <tr
                                    key={entry.id}
                                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                                    className="erp-table-row-hover"
                                    onClick={() => navigate(`/admin/accounting/journal/${entry.id}`)}
                                >
                                    <td style={{ padding: '1rem 1rem' }}>{entry.date}</td>
                                    <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{entry.id}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{entry.reference || '-'}</td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        {isAuto ? (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-600)',
                                                background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))', padding: '0.25rem 0.5rem', borderRadius: '4px'
                                            }}>
                                                <Monitor size={12} /> {entry.sourceType || 'System'}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manual</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {entry.description}
                                    </td>

                                    <td style={{ padding: '1rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                        {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            background: entry.status === 'Posted'
                                                ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))'
                                                : entry.status === 'Draft'
                                                    ? 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-card))'
                                                    : 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))',
                                            color: entry.status === 'Posted' ? 'var(--color-success)' :
                                                entry.status === 'Draft' ? 'var(--color-text-secondary)' : 'var(--color-primary-500)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            border: `1px solid ${entry.status === 'Posted' ? 'color-mix(in srgb, var(--color-success) 35%, var(--color-border))' :
                                                entry.status === 'Draft' ? 'var(--color-border)' : 'color-mix(in srgb, var(--color-primary-600) 30%, var(--color-border))'}`
                                        }}>{entry.status}</span>
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
