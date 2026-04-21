import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, PlayCircle, Settings, Layout, Percent, List, BarChart2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import FinalSettlementsList from '@/components/hr/payroll/FinalSettlementsList';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import useCustomQuery from '@/hooks/useQuery';

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

const normalizePeriodRow = (item) => ({
    id: item?.id ?? '',
    name: item?.name ?? '',
    status: String(item?.status ?? '').toLowerCase(),
    employeesPaid: Number(item?.employees_paid) || 0,
    totalNet: item?.total_net ?? '0',
    currency: item?.currency ?? 'USD',
});

const normalizeDashboard = (response) => {
    const periods = response?.periods?.data;
    const periodList = Array.isArray(periods) ? periods.map(normalizePeriodRow) : [];
    const tableCurrency = periodList[0]?.currency || 'USD';
    return {
        totalPayrollCost: response?.total_payroll_cost ?? '0',
        totalPayrollCostMeta: response?.total_payroll_cost_meta ?? null,
        costCurrency: tableCurrency,
        activeEmployees: Number(response?.active_employees) || 0,
        activeEmployeesMeta: response?.active_employees_meta ?? null,
        nextPayDate: response?.next_pay_date ?? null,
        nextPayDateMeta: response?.next_pay_date_meta ?? null,
        lastRunStatus: response?.last_run_status ?? null,
        lastRunStatusMeta: response?.last_run_status_meta ?? null,
        periodsCount: Number(response?.periods?.count) || periodList.length,
        periodRows: periodList,
    };
};

const Payroll = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => (location.state?.activeTab === 'settlements' ? 'settlements' : 'overview'));

    useEffect(() => {
        if (location.state?.activeTab === 'settlements') {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from navigate(..., { state })
            setActiveTab('settlements');
        }
    }, [location.state]);

    const dashboardQuery = useCustomQuery('/api/hr/payroll/dashboard/', ['hr-payroll-dashboard'], {
        enabled: activeTab === 'overview',
        select: normalizeDashboard,
    });

    const dashboard = dashboardQuery.data;
    const periodRows = useMemo(() => dashboard?.periodRows ?? [], [dashboard?.periodRows]);

    const overviewLoading = activeTab === 'overview' && dashboardQuery.isLoading;
    const overviewError = activeTab === 'overview' && dashboardQuery.isError;

    const nextPayLabel = dashboard?.nextPayDate != null ? formatPayDate(dashboard.nextPayDate) : null;
    const lastRun = dashboard?.lastRunStatus;
    const lastRunLabelText = (lastRun?.label || '').toLowerCase();
    const lastRunColor = !lastRun?.label
        ? 'var(--color-text-muted)'
        : lastRunLabelText.includes('draft')
            ? 'var(--color-warning)'
            : 'var(--color-success)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payroll Dashboard</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage salary components, structures, and process monthly runs.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Settings size={18} />} onClick={() => navigate('/admin/hr/payroll/components')} className="cursor-pointer">
                        Components
                    </Button>
                    <Button variant="outline" icon={<Layout size={18} />} onClick={() => navigate('/admin/hr/payroll/structures')} className="cursor-pointer">
                        Structures
                    </Button>
                    <Button variant="outline" icon={<Percent size={18} />} onClick={() => navigate('/admin/hr/payroll/tax-slabs')} className="cursor-pointer">
                        Taxes
                    </Button>
                    <Button variant="primary" icon={<PlayCircle size={18} />} onClick={() => navigate('/admin/hr/payroll/run')} className="cursor-pointer">
                        Run Payroll
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '2rem' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="cursor-pointer"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                        border: 'none', background: 'transparent',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: activeTab === 'overview' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'overview' ? 600 : 500
                    }}
                >
                    <BarChart2 size={18} />
                    Overview
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('settlements')}
                    className="cursor-pointer"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                        border: 'none', background: 'transparent',
                        borderBottom: activeTab === 'settlements' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: activeTab === 'settlements' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'settlements' ? 600 : 500
                    }}
                >
                    <List size={18} />
                    Final Settlements & EOS
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {overviewLoading && <Spinner />}

                    {overviewError && (
                        <ResourceLoadError
                            error={dashboardQuery.error}
                            title="Could not load payroll dashboard"
                            onGoBack={() => navigate(-1)}
                            onRefresh={() => window.location.reload()}
                        />
                    )}

                    {!overviewLoading && !overviewError && dashboard && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                <Card className="padding-md">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Payroll Cost</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                                {formatMoneyAmount(dashboard.totalPayrollCost, dashboard.costCurrency)}
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                                {dashboard.totalPayrollCostMeta || 'Aggregate payroll cost'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="padding-md">
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Active Employees</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboard.activeEmployees}</div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        {dashboard.activeEmployeesMeta || `${dashboard.periodsCount} payroll period${dashboard.periodsCount === 1 ? '' : 's'} on record`}
                                    </p>
                                </Card>
                                <Card className="padding-md">
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Next Pay Date</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{nextPayLabel ?? '—'}</div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        {dashboard.nextPayDateMeta || (nextPayLabel ? 'Scheduled pay run' : 'Not scheduled')}
                                    </p>
                                </Card>
                                <Card className="padding-md">
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Last Run Status</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: lastRunColor }}>
                                        {lastRun?.label ?? '—'}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        {dashboard.lastRunStatusMeta || [lastRun?.journal_reference, lastRun?.period_name].filter(Boolean).join(' · ') || 'No recent run'}
                                    </p>
                                </Card>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem' }}>Payroll Periods</h3>
                            <Card className="padding-none">
                                <div className="overflow-x-auto">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Period Name</th>
                                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Employees</th>
                                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total Net</th>
                                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periodRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '1.5rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                                        No payroll periods yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                periodRows.map((period) => {
                                                    const isPosted = period.status === 'posted';
                                                    const statusLabel = period.status ? period.status.charAt(0).toUpperCase() + period.status.slice(1) : '—';
                                                    return (
                                                        <tr key={period.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{period.name}</td>
                                                            <td style={{ padding: '1rem 1rem' }}>
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '1rem',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600,
                                                                    background: isPosted
                                                                        ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))'
                                                                        : 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                                                    color: isPosted ? 'var(--color-success)' : 'var(--color-warning)'
                                                                }}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem 1rem' }}>{period.employeesPaid}</td>
                                                            <td style={{ padding: '1rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                                {formatMoneyAmount(period.totalNet, period.currency)}
                                                            </td>
                                                            <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                                                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => navigate(`/admin/hr/payroll/period/${period.id}`)}>
                                                                    View Details
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="cursor-pointer" icon={<Download size={14} />}></Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </>
            ) : (
                <FinalSettlementsList />
            )}
        </div>
    );
};

export default Payroll;
