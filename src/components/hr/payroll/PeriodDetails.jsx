import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import useCustomQuery from '@/hooks/useQuery';
import { ArrowLeft, Download, Lock, CheckCircle, Clock, ChevronRight, ChevronDown } from 'lucide-react';

const formatMoneyAmount = (value, currency = 'USD') => {
    const num = Number(value);
    if (Number.isNaN(num)) return `— ${currency}`;
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const formatPayDate = (value) => {
    if (value == null || value === '') return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const humanizeDetailKey = (key) =>
    String(key)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const PeriodDetails = () => {
    const { t } = useTranslation(['hr', 'common']);

    const { id } = useParams();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const [expandedLineId, setExpandedLineId] = useState(null);

    const periodQuery = useCustomQuery(
        id ? `/api/hr/payroll/periods/${id}/` : null,
        ['hr-payroll-period', id],
        { enabled: Boolean(id) }
    );

    const period = periodQuery.data;
    const lines = Array.isArray(period?.lines) ? period.lines : [];

    const statusLower = String(period?.status ?? '').toLowerCase();
    const isPosted = statusLower === 'posted' || statusLower === 'locked';
    const statusLabel = period?.status
        ? String(period.status).charAt(0).toUpperCase() + String(period.status).slice(1).toLowerCase()
        : '—';

    const currency = period?.currency ?? 'USD';

    if (!id) {
        return (
            <Card className="padding-lg">
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Missing period id.</p>
                <Button variant="outline" className="cursor-pointer" style={{ marginTop: '1rem' }} onClick={() => navigate(`${basePath}/hr/payroll`)}>
                    Back to Payroll
                </Button>
            </Card>
        );
    }

    if (periodQuery.isLoading) {
        return <Spinner />;
    }

    if (periodQuery.isError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Button variant="ghost" className="cursor-pointer" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/hr/payroll`)}>{t('common:actions.back')}</Button>
                <ResourceLoadError
                    error={periodQuery.error}
                    title="Could not load payroll period"
                    onGoBack={() => navigate(`${basePath}/hr/payroll`)}
                />
            </div>
        );
    }

    if (!period) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Button variant="ghost" className="cursor-pointer" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/hr/payroll`)}>{t('common:actions.back')}</Button>
                <ResourceLoadError
                    message="Period not found or you do not have access to it."
                    title="Period unavailable"
                    onGoBack={() => navigate(`${basePath}/hr/payroll`)}
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" className="cursor-pointer" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/hr/payroll`)}>{t('common:actions.back')}</Button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{period.name}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            {formatPayDate(period.period_start)} to {formatPayDate(period.period_end)}
                            {period.pay_date ? ` · Pay date ${formatPayDate(period.pay_date)}` : ''}
                        </span>
                        <span
                            style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: isPosted
                                    ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))'
                                    : 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                color: isPosted ? 'var(--color-success)' : 'var(--color-warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                            }}
                        >
                            {isPosted ? <Lock size={12} /> : <Clock size={12} />}
                            {statusLabel}
                        </span>
                        {period.journal_reference ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Journal: {period.journal_reference}</span>
                        ) : null}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" className="cursor-pointer" icon={<Download size={18} />}>
                        Export XLSX
                    </Button>
                    {!isPosted && (
                        <Button variant="primary" className="cursor-pointer" icon={<CheckCircle size={18} />}>
                            Approve & Lock
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Gross</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatMoneyAmount(period.total_gross, currency)}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Net Pay</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatMoneyAmount(period.total_net, currency)}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Deductions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error)' }}>
                        {formatMoneyAmount(period.total_deductions, currency)}
                    </div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Employees Paid</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Number(period.employees_paid) || 0}</div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Base payroll (net)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatMoneyAmount(period.base_payroll_net, currency)}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total adjustments</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatMoneyAmount(period.total_adjustments, currency)}</div>
                </Card>
            </div>

            <Card className="padding-none">
                <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th
                                    scope="col"
                                    aria-label="Expand row"
                                    style={{ width: '2.5rem', padding: '0.75rem 0.25rem 0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}
                                />
                                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Employee</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Department</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Gross Pay</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Deductions</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Adjustment</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Net Pay</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '1.5rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                        No payroll lines for this period.
                                    </td>
                                </tr>
                            ) : (
                                lines.map((line) => {
                                    const earningsEntries = line.earnings_details && typeof line.earnings_details === 'object'
                                        ? Object.entries(line.earnings_details)
                                        : [];
                                    const deductionsEntries = line.deductions_details && typeof line.deductions_details === 'object'
                                        ? Object.entries(line.deductions_details)
                                        : [];
                                    const hasBreakdown = earningsEntries.length > 0 || deductionsEntries.length > 0;
                                    const isExpanded = expandedLineId === line.id;
                                    const adjReason = line.adjustment_reason ? String(line.adjustment_reason) : '';
                                    return (
                                        <React.Fragment key={line.id}>
                                            <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem 0.25rem 1rem 1rem', verticalAlign: 'middle', width: '2.5rem' }}>
                                                    {hasBreakdown ? (
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer"
                                                            aria-expanded={isExpanded}
                                                            aria-label={isExpanded ? 'Collapse earnings and deductions' : 'Expand earnings and deductions'}
                                                            onClick={() => setExpandedLineId((prev) => (prev === line.id ? null : line.id))}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '2rem',
                                                                height: '2rem',
                                                                padding: 0,
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                background: 'transparent',
                                                                color: 'var(--color-text-secondary)',
                                                            }}
                                                        >
                                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </button>
                                                    ) : null}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{line.employee_name}</td>
                                                <td style={{ padding: '1rem 1rem' }}>{line.department || '—'}</td>
                                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>{formatMoneyAmount(line.gross_pay, currency)}</td>
                                                <td style={{ padding: '1rem 1rem', textAlign: 'right', color: 'var(--color-error)' }}>
                                                    {formatMoneyAmount(line.deductions, currency)}
                                                </td>
                                                <td style={{ padding: '1rem 1rem', textAlign: 'right', fontSize: '0.85rem' }}>
                                                    <div>{formatMoneyAmount(line.adjustment_amount, currency)}</div>
                                                    {adjReason ? (
                                                        <div style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', maxWidth: '12rem' }} title={adjReason}>
                                                            {adjReason.length > 48 ? `${adjReason.slice(0, 45)}…` : adjReason}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td style={{ padding: '1rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                    {formatMoneyAmount(line.net_pay, currency)}
                                                </td>
                                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="cursor-pointer"
                                                        onClick={() => navigate(`${basePath}/hr/payroll/payslip/${line.employee_id}?periodId=${id}&lineId=${line.id}`)}
                                                    >
                                                        View Payslip
                                                    </Button>
                                                </td>
                                            </tr>
                                            {hasBreakdown && isExpanded && (
                                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-muted, var(--color-bg-card))' }}>
                                                    <td colSpan={8} style={{ padding: '0 1.5rem 1rem 3.25rem', verticalAlign: 'top' }}>
                                                        <div style={{ fontSize: '0.8rem', paddingTop: '0.25rem' }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                                                Earnings & deductions breakdown
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                                                {earningsEntries.length > 0 && (
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Earnings</div>
                                                                        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--color-text-secondary)' }}>
                                                                            {earningsEntries.map(([k, v]) => (
                                                                                <li key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                                                    <span>{humanizeDetailKey(k)}</span>
                                                                                    <span>{formatMoneyAmount(v, currency)}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {deductionsEntries.length > 0 && (
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Deductions</div>
                                                                        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--color-text-secondary)' }}>
                                                                            {deductionsEntries.map(([k, v]) => (
                                                                                <li key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                                                    <span>{humanizeDetailKey(k)}</span>
                                                                                    <span>{formatMoneyAmount(v, currency)}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default PeriodDetails;
