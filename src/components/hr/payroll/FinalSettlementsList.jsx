import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { FileText, Download, Eye, Search } from 'lucide-react';
import useCustomQuery from '@/hooks/useQuery';

const FinalSettlementsList = () => {
    const { t } = useTranslation(['hr', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isError, refetch } = useCustomQuery('/api/hr/terminations/?status=finalized', ['hr-terminations', 'finalized']);

    const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

    const filteredRows = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) => (row.employee_name || '').toLowerCase().includes(q));
    }, [rows, searchTerm]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card className="padding-md">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                            }}
                        />
                    </div>
                </div>
            </Card>

            <Card className="padding-none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Employee</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Termination Type</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Net Payable</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Loading settlements…
                                </td>
                            </tr>
                        )}
                        {isError && !isLoading && (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 1rem', color: 'var(--color-error)' }}>Could not load final settlements.</p>
                                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                                        Retry
                                    </Button>
                                </td>
                            </tr>
                        )}
                        {!isLoading &&
                            !isError &&
                            filteredRows.map((row) => {
                                const isResignation = (row.termination_type || '').toLowerCase().startsWith('resignation');
                                const net = Number(row.net_payable);
                                return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{row.employee_name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    background: isResignation ? 'var(--color-warning-50)' : 'var(--color-danger-50)',
                                                    color: isResignation ? 'var(--color-warning-800)' : 'var(--color-danger-800)',
                                                }}
                                            >
                                                {row.termination_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{row.date}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                                            {Number.isFinite(net)
                                                ? net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : row.net_payable}{' '}
                                            JOD
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: 'var(--color-success-50)',
                                                    color: 'var(--color-success-700)',
                                                }}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Eye size={16} />}
                                                title="View Details"
                                                onClick={() =>
                                                    navigate(`${basePath}/hr/final-settlement`, {
                                                        state: {
                                                            settlement: {
                                                                id: row.id,
                                                                employeeName: row.employee_name,
                                                                terminationDate: row.date,
                                                                type: row.termination_type,
                                                                amount: Number(row.net_payable),
                                                                paymentDate: row.date,
                                                                status: row.status,
                                                                details: {},
                                                            },
                                                        },
                                                    })
                                                }
                                            />
                                            <Button variant="ghost" size="sm" icon={<Download size={16} />} title="Download Slip" />
                                        </td>
                                    </tr>
                                );
                            })}
                        {!isLoading && !isError && filteredRows.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No final settlements found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default FinalSettlementsList;
