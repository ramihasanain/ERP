import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import translateApiError from '@/utils/translateApiError';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Upload, ArrowLeft } from 'lucide-react';
import useCustomQuery from '@/hooks/useQuery';
import { mapPeriodLinesToRows } from '@/components/hr/payroll/payrollPeriodMappers';
import { useCustomPatch } from '@/hooks/useMutation';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';

const formatMoneyAmount = (value, currency = 'USD') => {
    const num = Number(value);
    if (Number.isNaN(num)) return `— ${currency}`;
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const formatAdjustmentAmountForApi = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return '0.00';
    return n.toFixed(2);
};

/** Parses adjustment amount for totals / net pay; allows in-progress typing in a text field. */
const parseAdjustmentAmountInput = (raw) => {
    if (raw === undefined || raw === null) return 0;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    const s = String(raw).trim();
    if (s === '' || s === '-' || s === '+' || s === '.' || s === '-.' || s === '+.') return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
};

const RunPayrollWorkflow = () => {
    const { t } = useTranslation(['hr', 'common']);

    const location = useLocation();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const RUN_PAYROLL_PATH = `${basePath}/hr/payroll/run`;
    const incoming = location.state;
    const periodId = incoming?.periodId;
    const periodName = incoming?.periodName;

    const isValid = Boolean(periodId);

    const periodQuery = useCustomQuery(
        periodId ? `/api/hr/payroll/periods/${periodId}/` : null,
        ['hr-payroll-period-workflow', periodId],
        { enabled: Boolean(periodId) }
    );

    const patchLinesMutation = useCustomPatch(
        periodId ? `/api/hr/payroll/periods/${periodId}/lines/` : '/api/hr/payroll/periods/__/lines/',
        [['hr-payroll-period-workflow', periodId], ['hr-payroll-period', periodId]]
    );

    const period = periodQuery.data;
    const currency = period?.currency ?? 'USD';

    const calculatedPayroll = useMemo(() => (period ? mapPeriodLinesToRows(period) : []), [period]);

    const baselineAdjustments = useMemo(() => {
        const next = {};
        if (!period?.lines?.length) return next;
        period.lines.forEach((line) => {
            next[line.employee_id] = {
                amount: Number(line.adjustment_amount) || 0,
                reason: line.adjustment_reason ? String(line.adjustment_reason) : '',
            };
        });
        return next;
    }, [period]);

    const [adjustmentOverrides, setAdjustmentOverrides] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);

    const adjustmentOverridesRef = useRef({});
    const periodRef = useRef(null);
    const baselineAdjustmentsRef = useRef({});

    useEffect(() => {
        periodRef.current = period;
    }, [period]);

    useEffect(() => {
        baselineAdjustmentsRef.current = baselineAdjustments;
    }, [baselineAdjustments]);

    useEffect(() => {
        adjustmentOverridesRef.current = adjustmentOverrides;
    }, [adjustmentOverrides]);

    useEffect(() => {
        let cancelled = false;
        const t = window.setTimeout(() => {
            if (cancelled) return;
            setAdjustmentOverrides({});
            adjustmentOverridesRef.current = {};
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [periodId]);

    const persistAdjustmentsDebounceRef = useRef(null);

    const persistPayrollLineAdjustments = useCallback(async () => {
        if (!periodId) return;
        const currentPeriod = periodRef.current;
        const lines = Array.isArray(currentPeriod?.lines) ? currentPeriod.lines : [];
        if (!lines.length) return;

        const overrides = adjustmentOverridesRef.current;
        if (!Object.keys(overrides).length) return;

        const baseline = baselineAdjustmentsRef.current;
        const body = {
            lines: lines.map((line) => {
                const base = baseline[line.employee_id] || { amount: 0, reason: '' };
                const over = overrides[line.employee_id];
                const amountRaw = over?.amount !== undefined ? over.amount : base.amount;
                const amount = parseAdjustmentAmountInput(amountRaw);
                const reason = over?.reason !== undefined ? over.reason : base.reason;
                return {
                    id: line.id,
                    adjustment_amount: formatAdjustmentAmountForApi(amount),
                    adjustment_reason: String(reason ?? ''),
                };
            }),
        };

        try {
            await patchLinesMutation.mutateAsync(body);
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                (typeof err?.message === 'string' ? err.message : null) ||
                'Could not save payroll adjustments.';
            toast.error(translateApiError(err, 'hr:runPayroll.adjustmentsSaveFailed'));
        }
    }, [periodId, patchLinesMutation]);

    const schedulePersistPayrollLineAdjustments = useCallback(() => {
        if (persistAdjustmentsDebounceRef.current) {
            clearTimeout(persistAdjustmentsDebounceRef.current);
        }
        persistAdjustmentsDebounceRef.current = setTimeout(() => {
            persistAdjustmentsDebounceRef.current = null;
            void persistPayrollLineAdjustments();
        }, 500);
    }, [persistPayrollLineAdjustments]);

    useEffect(
        () => () => {
            if (persistAdjustmentsDebounceRef.current) {
                clearTimeout(persistAdjustmentsDebounceRef.current);
            }
        },
        []
    );

    const resolveAdjustment = (empId) => {

        const base = baselineAdjustments[empId] || { amount: 0, reason: '' };
        const over = adjustmentOverrides[empId];
        const amountRaw = over && over.amount !== undefined ? over.amount : base.amount;
        const amountInput = typeof amountRaw === 'string' ? amountRaw : String(amountRaw);
        const amount = parseAdjustmentAmountInput(amountInput);
        const reason = over && over.reason !== undefined ? over.reason : base.reason;
        return { amount, reason, amountInput };
    };

    const selectedPeriodLabel = period?.name ?? periodName ?? '—';

    const handleAdjustmentChange = (empId, field, value) => {
        setAdjustmentOverrides((prev) => {
            const base = baselineAdjustments[empId] || { amount: 0, reason: '' };
            const cur = prev[empId] || {};
            const mergedAmount =
                cur.amount !== undefined ? (typeof cur.amount === 'string' ? cur.amount : String(cur.amount)) : String(base.amount);
            const merged = {
                amount: mergedAmount,
                reason: cur.reason !== undefined ? cur.reason : base.reason,
            };
            const next = {
                ...prev,
                [empId]: {
                    ...merged,
                    [field]: value,
                },
            };
            adjustmentOverridesRef.current = next;
            return next;
        });
        schedulePersistPayrollLineAdjustments();
    };

    const handleImportAdjustments = (e) => {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rows = text.split('\n').slice(1);
            setAdjustmentOverrides((prev) => {
                const newAdjustments = { ...prev };
                rows.forEach((row) => {
                    const [empId, amount, reason] = row.split(',').map((s) => s.trim());
                    if (empId && !Number.isNaN(Number(amount))) {
                        newAdjustments[empId] = {
                            amount: String(Number(amount)),
                            reason: reason || 'Bulk Import',
                        };
                    }
                });
                adjustmentOverridesRef.current = newAdjustments;
                return newAdjustments;
            });
            schedulePersistPayrollLineAdjustments();
            alert(`Imported ${rows.length} adjustments successfully!`);
        };
        reader.readAsText(file);
    };

    const summary = useMemo(() => {
        if (calculatedPayroll.length === 0) {
            return { totalGross: 0, totalDeductions: 0, totalNet: 0, totalTax: 0, totalAdjustments: 0 };
        }
        const totalGross = calculatedPayroll.reduce((acc, curr) => acc + curr.gross, 0);
        const totalDed = calculatedPayroll.reduce((acc, curr) => acc + curr.totalDeductions, 0);
        const totalTax = calculatedPayroll.reduce((acc, curr) => acc + curr.tax, 0);
        const totalAdj = calculatedPayroll.reduce((acc, curr) => {
            const base = baselineAdjustments[curr.employeeId] || { amount: 0, reason: '' };
            const over = adjustmentOverrides[curr.employeeId];
            const amountRaw = over?.amount !== undefined ? over.amount : base.amount;
            return acc + parseAdjustmentAmountInput(amountRaw);
        }, 0);
        return {
            totalGross,
            totalDeductions: totalDed,
            totalTax,
            totalAdjustments: totalAdj,
            totalNet: totalGross - totalDed + totalAdj,
        };
    }, [calculatedPayroll, adjustmentOverrides, baselineAdjustments]);

    const goBackToRun = () => {
        navigate(RUN_PAYROLL_PATH);
    };

    if (!isValid) {
        return <Navigate to={RUN_PAYROLL_PATH} replace />;
    }

    if (periodQuery.isLoading) {
        return <Spinner />;
    }

    if (periodQuery.isError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={goBackToRun} type="button" className="cursor-pointer">{t('common:actions.back')}</Button>
                <ResourceLoadError
                    error={periodQuery.error}
                    title="Could not load payroll period for review"
                    onGoBack={goBackToRun}
                />
            </div>
        );
    }

    if (!period) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={goBackToRun} type="button" className="cursor-pointer">{t('common:actions.back')}</Button>
                <ResourceLoadError
                    message="No payroll period data was returned."
                    title="No data for this period"
                    onGoBack={goBackToRun}
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={goBackToRun} type="button" className="cursor-pointer" />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Run Payroll</h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            Process salaries, review calculations, and finalize payments.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>1. Select Period</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>2. Review & Adjust</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>3. Finalize</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Gross Pay</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatMoneyAmount(summary.totalGross, currency)}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                                Sum of employee gross earnings
                            </p>
                        </Card>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Deductions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatMoneyAmount(summary.totalDeductions, currency)}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                                Statutory and voluntary withholdings
                            </p>
                        </Card>
                        <Card className="padding-md">
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Net Payable</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatMoneyAmount(summary.totalNet, currency)}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                                After deductions and adjustments
                            </p>
                        </Card>
                    </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Employee Payroll Review</h3>
                            {patchLinesMutation.isPending && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Saving adjustments…</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                variant="outline"
                                className="cursor-pointer"
                                icon={<Download size={16} />}
                                onClick={() => {
                                    const blob = new Blob(
                                        ['Employee ID, Amount, Reason\nEMP-001, -50, Late Arrival\nEMP-002, 100, Performance Bonus'],
                                        { type: 'text/csv' }
                                    );
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'adjustments_template.csv';
                                    a.click();
                                }}
                            >
                                Download CSV Template
                            </Button>

                        </div>
                    </div>

                <Card className="padding-none">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-slate-50)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Employee</th>
                                    <th style={{ padding: '1rem' }}>Gross Pay</th>
                                    <th style={{ padding: '1rem' }}>Deductions</th>
                                    <th style={{ padding: '1rem', width: '300px' }}>Adjustments & Reason (+/-)</th>
                                    <th style={{ padding: '1rem' }}>Net Pay</th>
                                    <th style={{ padding: '1rem' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculatedPayroll.map((item) => {
                                    const adj = resolveAdjustment(item.employeeId);
                                    const finalNet = item.netPay + adj.amount;
                                    const isExpanded = expandedRow === item.employeeId;

                                    return (
                                        <React.Fragment key={item.employeeId}>
                                            <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                                                <td style={{ padding: '1rem' }}>{item.gross.toLocaleString()}</td>
                                                <td style={{ padding: '1rem', color: 'var(--color-error-600)' }}>-{item.totalDeductions.toLocaleString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            className="font-normal"
                                                            value={adj.amountInput}
                                                            onChange={(e) => handleAdjustmentChange(item.employeeId, 'amount', e.target.value)}
                                                            onFocus={(e) => e.currentTarget.select()}
                                                            placeholder="0"
                                                            style={{
                                                                width: '80px',
                                                                padding: '0.4rem 0.5rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid var(--color-border)',
                                                                fontSize: '0.9rem',
                                                                textAlign: 'right',
                                                                color:
                                                                    adj.amount < 0
                                                                        ? 'var(--color-error-600)'
                                                                        : adj.amount > 0
                                                                          ? 'var(--color-success-600)'
                                                                          : 'inherit',
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="font-normal"
                                                            value={adj.reason}
                                                            onChange={(e) => handleAdjustmentChange(item.employeeId, 'reason', e.target.value)}
                                                            placeholder="Adjustment reason..."
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.4rem 0.5rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid var(--color-border)',
                                                                fontSize: '0.85rem',
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>{finalNet.toLocaleString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="cursor-pointer"
                                                        onClick={() => setExpandedRow(isExpanded ? null : item.employeeId)}
                                                    >
                                                        {isExpanded ? 'Hide' : 'View Details'}
                                                    </Button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                                                    <td colSpan="6" style={{ padding: '1.5rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                                            <div>
                                                                <h4
                                                                    style={{
                                                                        fontSize: '0.8rem',
                                                                        textTransform: 'uppercase',
                                                                        color: 'var(--color-text-muted)',
                                                                        marginBottom: '1rem',
                                                                    }}
                                                                >
                                                                    Earnings Details
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    {item.breakdown
                                                                        .filter((b) => b.type === 'Earning')
                                                                        .map((b, idx) => (
                                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                                <span>{b.name}</span>
                                                                                <span style={{ fontWeight: 600 }}>
                                                                                    {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                                                    {currency}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4
                                                                    style={{
                                                                        fontSize: '0.8rem',
                                                                        textTransform: 'uppercase',
                                                                        color: 'var(--color-text-muted)',
                                                                        marginBottom: '1rem',
                                                                    }}
                                                                >
                                                                    Deductions Details
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    {item.breakdown
                                                                        .filter((b) => b.type === 'Deduction')
                                                                        .map((b, idx) => (
                                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                                <span>{b.name}</span>
                                                                                <span style={{ fontWeight: 600, color: 'var(--color-error-600)' }}>
                                                                                    -
                                                                                    {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                                                    {currency}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    {adj.amount < 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '0.9rem',
                                                                                borderTop: '1px dashed var(--color-border)',
                                                                                paddingTop: '0.5rem',
                                                                            }}
                                                                        >
                                                                            <span style={{ fontStyle: 'italic' }}>
                                                                                Manual Adjustment (Deduction): {adj.reason}
                                                                            </span>
                                                                            <span style={{ fontWeight: 600, color: 'var(--color-error-600)' }}>
                                                                                {adj.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                                                {currency}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                </Card>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost" className="cursor-pointer" onClick={goBackToRun}>{t('common:actions.back')}</Button>
                    <Button
                        className="cursor-pointer"
                        onClick={() =>
                            navigate(`${basePath}/hr/payroll/period/${periodId}/finalize`, {
                                state: { periodName: selectedPeriodLabel },
                            })
                        }
                    >
                        Proceed to Finalize
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RunPayrollWorkflow;
