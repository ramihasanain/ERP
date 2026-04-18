import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useCustomPatch, useCustomPost } from '@/hooks/useMutation';
import { ArrowLeft, CheckCircle, Printer, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

const num = (v) => {
    if (v == null || v === '') return 0;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

const mapTerminationApiToCalculation = (termination) => ({
    gratuityAmount: num(termination.gratuity_amount),
    yearsOfService: num(termination.gratuity_tenure_years),
    ruleApplied: termination.gratuity_rule_description || '',
    leaveEncashment: num(termination.leave_encashment_amount),
    leaveBalance: num(termination.leave_encashment_days),
    leaveDailyRate: num(termination.leave_encashment_daily_rate),
    basicSalary: num(termination.leave_encashment_daily_rate) * 30,
    currentMonthSalary: num(termination.current_month_salary_amount),
    noticePeriodPay: num(termination.notice_period_pay_amount),
    currency: termination.currency || 'JOD',
    journal_preview: Array.isArray(termination.journal_preview) ? termination.journal_preview : [],
    terminationId: termination.id,
    total_net_payable_raw: num(termination.total_net_payable),
});

const normalizeEmployeeFromApiState = (e) => ({
    id: e.id,
    firstName: e.first_name || '',
    lastName: e.last_name || '',
    departmentId: e.department || '',
    joinDate: e.joining_date || 'N/A',
});

const FinalSettlement = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [termination, setTermination] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [terminationData, setTerminationData] = useState(null);

    const [isViewMode, setIsViewMode] = useState(false);
    const [viewSettlement, setViewSettlement] = useState(null);
    const [viewCalculation, setViewCalculation] = useState(null);
    const [viewFinalAmount, setViewFinalAmount] = useState(0);

    const [paymentDate, setPaymentDate] = useState('');
    const [includeNoticePay, setIncludeNoticePay] = useState(false);
    const [noticePeriodDays, setNoticePeriodDays] = useState('');
    const [gratuityStr, setGratuityStr] = useState('');
    const [leaveEncashStr, setLeaveEncashStr] = useState('');
    const [noticePayStr, setNoticePayStr] = useState('');
    const [newAdjustment, setNewAdjustment] = useState({ description: '', amount: '', kind: 'addition' });

    const lastSavedRef = useRef(null);

    const empId = employee?.id || '';
    const patchTermination = useCustomPatch(`/api/hr/employees/${empId}/termination/`, [['hr-terminations', 'finalized'], ['hr-employee', empId]]);
    const finalizeTermination = useCustomPost(`/api/hr/employees/${empId}/termination/finalize/`, [['hr-terminations', 'finalized'], ['hr-employee', empId]]);

    useEffect(() => {
        const state = location.state || {};

        if (state.termination && state.employee) {
            const t = state.termination;
            setTermination(t);
            lastSavedRef.current = t;
            setEmployee(normalizeEmployeeFromApiState(state.employee));
            setTerminationData({
                date: t.last_working_day,
                type: t.termination_type_display || t.termination_type,
                noticePeriod: t.notice_period_days,
                reason: t.reason || '',
            });
            setIsViewMode(false);
            setViewSettlement(null);
            setViewCalculation(null);
            return;
        }

        if (state.settlement) {
            const sett = state.settlement;
            setIsViewMode(true);
            setViewSettlement(sett);
            setEmployee({
                firstName: sett.employeeName.split(' ')[0],
                lastName: sett.employeeName.split(' ').slice(1).join(' '),
                joinDate: 'N/A',
                departmentId: '',
            });
            setTerminationData({
                date: sett.terminationDate,
                type: sett.type,
                reason: 'Recorded in Settlement',
                noticePeriod: 30,
            });
            setPaymentDate(sett.paymentDate || sett.terminationDate);
            setIncludeNoticePay(sett.details?.includeNoticePay || false);
            setViewFinalAmount(sett.amount);
            const details = sett.details || {};
            setViewCalculation({
                gratuityAmount: details.gratuityAmount ?? 0,
                leaveEncashment: details.leaveEncashment ?? 0,
                currentMonthSalary: details.currentMonthSalary ?? 0,
                noticePeriodPay: details.noticePeriodPay ?? 0,
                yearsOfService: details.yearsOfService ?? 0,
                ruleApplied: details.ruleApplied || '',
                leaveBalance: details.leaveBalance ?? 0,
                leaveDailyRate: details.leaveDailyRate,
                basicSalary: details.basicSalary,
                currency: details.currency || 'JOD',
                journal_preview: details.journal_preview || [],
            });
            setTermination(null);
            return;
        }

        navigate('/admin/hr/employees');
    }, [location.state, navigate]);

    useEffect(() => {
        if (!termination || isViewMode) return;
        setPaymentDate(termination.payment_date || '');
        setIncludeNoticePay(!!termination.include_pay_in_lieu_of_notice);
        setNoticePeriodDays(termination.notice_period_days != null ? String(termination.notice_period_days) : '');
        setGratuityStr(termination.gratuity_amount != null ? String(termination.gratuity_amount) : '');
        setLeaveEncashStr(termination.leave_encashment_amount != null ? String(termination.leave_encashment_amount) : '');
        setNoticePayStr(termination.notice_period_pay_amount != null ? String(termination.notice_period_pay_amount) : '');
    }, [termination, isViewMode]);

    const applyPatch = async (patch) => {
        if (!empId) return;
        try {
            const res = await patchTermination.mutateAsync(patch);
            setTermination(res);
            lastSavedRef.current = res;
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || 'Update failed.';
            toast.error(typeof msg === 'string' ? msg : 'Update failed.');
        }
    };

    const isLiveTermination = !isViewMode && termination && employee?.id;
    const isFinalized = !!(termination?.finalized_at || termination?.status === 'finalized');

    const calculation = isViewMode ? viewCalculation : termination ? mapTerminationApiToCalculation(termination) : null;
    const finalNetPayable = isViewMode ? viewFinalAmount : num(termination?.total_net_payable);

    const handleFinalize = async () => {
        if (!empId || !termination || isViewMode) return;
        try {
            await finalizeTermination.mutateAsync({});
            toast.success('Termination finalized.');
            navigate('/admin/hr/payroll', { state: { activeTab: 'settlements' } });
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || 'Finalize failed.';
            toast.error(typeof msg === 'string' ? msg : 'Finalize failed.');
        }
    };

    const handleAddAdjustment = () => {
        if (!newAdjustment.description?.trim() || !newAdjustment.amount) return;
        const list = termination?.manual_adjustments ? [...termination.manual_adjustments] : [];
        const amountNum = parseFloat(newAdjustment.amount);
        if (!Number.isFinite(amountNum)) return;
        list.push({
            description: newAdjustment.description.trim(),
            amount: amountNum.toFixed(2),
            kind: newAdjustment.kind === 'deduction' ? 'deduction' : 'addition',
        });
        applyPatch({ manual_adjustments: list });
        setNewAdjustment({ description: '', amount: '', kind: 'addition' });
    };

    const handleRemoveAdjustment = (index) => {
        const list = (termination?.manual_adjustments || []).filter((_, i) => i !== index);
        applyPatch({ manual_adjustments: list });
    };

    if (!employee) return <div>Loading...</div>;

    if (!isViewMode && !termination) return <div>Loading...</div>;

    if (isViewMode && !viewSettlement) return <div>Loading...</div>;

    const currencyCode = calculation?.currency || 'JOD';
    const hasJournalPreview = Array.isArray(calculation?.journal_preview) && calculation.journal_preview.length > 0;

    const dailyRateDisplay =
        calculation?.leaveDailyRate != null && calculation.leaveDailyRate > 0
            ? calculation.leaveDailyRate
            : (calculation?.basicSalary || 0) / 30;

    const adjustmentsList = isLiveTermination ? termination.manual_adjustments || [] : [];
    const overrides = isViewMode ? viewSettlement?.details?.overrides || {} : {};
    const legacyAdjustments = isViewMode ? viewSettlement?.details?.adjustments || [] : [];

    return (
        <>
            <style>{`
                .final-settlement-cards {
                    display: grid;
                    gap: 1.5rem;
                    grid-template-columns: minmax(0, 1fr);
                }
                @media (min-width: 960px) {
                    .final-settlement-cards {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
            `}</style>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minWidth: 0 }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                Back
            </Button>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '2rem',
                    rowGap: '1rem',
                }}
            >
                <div style={{ flex: '1 1 220px', minWidth: 0, maxWidth: '100%' }}>
                    <h1
                        style={{
                            fontSize: '1.875rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {isViewMode ? 'Settlement Details' : 'Final Settlement'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {isViewMode ? 'View Only' : 'Terminating'}: {employee.firstName} {employee.lastName}
                    </p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flex: '0 1 auto',
                        minWidth: 0,
                    }}
                >
                    <Button variant="outline" icon={<Printer size={16} />}>
                        Print
                    </Button>
                    {isLiveTermination && !isFinalized && (
                        <Button
                            variant="primary"
                            icon={<CheckCircle size={16} />}
                            onClick={handleFinalize}
                            isLoading={finalizeTermination.isPending}
                            disabled={!empId || patchTermination.isPending}
                        >
                            Finalize & Create Journal Entry
                        </Button>
                    )}
                </div>
            </div>

            <div className="final-settlement-cards">
                    <Card title="Settlement Configuration">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Termination Date</label>
                                <div style={{ padding: '0.6rem', background: 'var(--color-slate-50)', borderRadius: '4px', fontWeight: 600 }}>{terminationData?.date}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payment Date</label>
                                {isViewMode ? (
                                    <div style={{ padding: '0.6rem', background: 'var(--color-slate-50)', borderRadius: '4px', fontWeight: 600 }}>{paymentDate}</div>
                                ) : (
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        onBlur={() => {
                                            if (paymentDate !== (lastSavedRef.current?.payment_date || '')) {
                                                applyPatch({ payment_date: paymentDate });
                                            }
                                        }}
                                        disabled={isFinalized || patchTermination.isPending}
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            borderRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Notice Period (Days)</label>
                                {isViewMode ? (
                                    <div style={{ padding: '0.6rem', background: 'var(--color-slate-50)', borderRadius: '4px', fontWeight: 600 }}>{terminationData?.noticePeriod}</div>
                                ) : (
                                    <input
                                        type="number"
                                        value={noticePeriodDays}
                                        onChange={(e) => setNoticePeriodDays(e.target.value)}
                                        onBlur={() => {
                                            const n = parseInt(noticePeriodDays, 10);
                                            const last = lastSavedRef.current?.notice_period_days;
                                            if (Number.isFinite(n) && n !== last) {
                                                applyPatch({ notice_period_days: n });
                                            }
                                        }}
                                        disabled={isFinalized || patchTermination.isPending}
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            borderRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'var(--color-warning-50)',
                                borderRadius: '6px',
                                border: '1px dashed var(--color-warning-200)',
                            }}
                        >
                            <input
                                type="checkbox"
                                id="noticePay"
                                checked={includeNoticePay}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setIncludeNoticePay(v);
                                    if (!isViewMode && v !== !!lastSavedRef.current?.include_pay_in_lieu_of_notice) {
                                        applyPatch({ include_pay_in_lieu_of_notice: v });
                                    }
                                }}
                                disabled={isViewMode || isFinalized || patchTermination.isPending}
                                style={{ transform: 'scale(1.2)' }}
                            />
                            <label htmlFor="noticePay" style={{ cursor: isViewMode ? 'default' : 'pointer' }}>
                                <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-warning-900)' }}>Include Pay in Lieu of Notice?</span>
                                {!!calculation?.noticePeriodPay && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-warning-700)' }}>
                                        Notice pay override below when included ({currencyCode})
                                    </span>
                                )}
                            </label>
                        </div>
                    </Card>

                    <Card className="padding-md" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary-900)' }}>Total Net Payable</h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary-800)' }}>Total</span>
                            <span style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--color-primary-700)', wordBreak: 'break-word' }}>
                                {Number(finalNetPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                <span style={{ fontSize: '1rem' }}>{currencyCode}</span>
                            </span>
                        </div>
                    </Card>

                    <Card title="Calculation Breakdown">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 12rem' }}>
                                        <Calendar size={18} color="var(--color-primary-600)" />
                                        End of Service Gratuity
                                    </span>
                                    {isViewMode ? (
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {(overrides.gratuityAmount !== undefined ? parseFloat(overrides.gratuityAmount) : calculation.gratuityAmount)?.toLocaleString()}{' '}
                                            {currencyCode}
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={gratuityStr}
                                                onChange={(e) => setGratuityStr(e.target.value)}
                                                onBlur={() => {
                                                    const s = gratuityStr.trim();
                                                    if (s !== String(lastSavedRef.current?.gratuity_amount ?? '')) {
                                                        applyPatch({ gratuity_amount: s });
                                                    }
                                                }}
                                                disabled={isFinalized || patchTermination.isPending}
                                                style={{
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    width: '120px',
                                                    padding: '0.25rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <span style={{ fontWeight: 600 }}>{currencyCode}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '1.7rem' }}>
                                    <div>Tenure: {Number(calculation?.yearsOfService ?? 0).toFixed(2)} Years</div>
                                    <div style={{ color: 'var(--color-primary-700)', marginTop: '0.25rem' }}>Rule: {calculation?.ruleApplied}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 12rem' }}>
                                        <CalculatorsIcon size={18} color="var(--color-indigo-600)" />
                                        Leave Encashment
                                    </span>
                                    {isViewMode ? (
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {(overrides.leaveEncashment !== undefined ? parseFloat(overrides.leaveEncashment) : calculation.leaveEncashment)?.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}{' '}
                                            {currencyCode}
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={leaveEncashStr}
                                                onChange={(e) => setLeaveEncashStr(e.target.value)}
                                                onBlur={() => {
                                                    const s = leaveEncashStr.trim();
                                                    if (s !== String(lastSavedRef.current?.leave_encashment_amount ?? '')) {
                                                        applyPatch({ leave_encashment_amount: s });
                                                    }
                                                }}
                                                disabled={isFinalized || patchTermination.isPending}
                                                style={{
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    width: '120px',
                                                    padding: '0.25rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <span style={{ fontWeight: 600 }}>{currencyCode}</span>
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '1.7rem' }}>
                                    {calculation?.leaveBalance} days remaining @ {dailyRateDisplay?.toFixed(4)} {currencyCode}/day
                                </p>
                            </div>

                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 12rem' }}>
                                        <DollarSign size={18} color="var(--color-success-600)" />
                                        Current Month Salary
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        {calculation?.currentMonthSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencyCode}
                                    </span>
                                </div>
                            </div>

                            {includeNoticePay && (
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-warning-50)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--color-warning-900)',
                                                minWidth: 0,
                                                flex: '1 1 12rem',
                                            }}
                                        >
                                            <AlertTriangle size={18} color="var(--color-warning-700)" />
                                            Notice Period Pay
                                        </span>
                                        {isViewMode ? (
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning-900)' }}>
                                                {calculation?.noticePeriodPay?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencyCode}
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={noticePayStr}
                                                    onChange={(e) => setNoticePayStr(e.target.value)}
                                                    onBlur={() => {
                                                        const s = noticePayStr.trim();
                                                        if (s !== String(lastSavedRef.current?.notice_period_pay_amount ?? '')) {
                                                            applyPatch({ notice_period_pay_amount: s });
                                                        }
                                                    }}
                                                    disabled={isFinalized || patchTermination.isPending}
                                                    style={{
                                                        textAlign: 'right',
                                                        fontWeight: 700,
                                                        fontSize: '1.1rem',
                                                        width: '120px',
                                                        padding: '0.25rem',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                                <span style={{ fontWeight: 600 }}>{currencyCode}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '1.25rem', background: 'var(--color-slate-50)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Manual Adjustments</h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {isLiveTermination &&
                                        adjustmentsList.map((adj, index) => (
                                            <div
                                                key={`adj-${index}`}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'white',
                                                    padding: '0.75rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--color-border)',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{adj.description}</div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: adj.kind === 'addition' ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                                                        }}
                                                    >
                                                        {adj.kind === 'addition' ? 'Addition' : 'Deduction'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            color: adj.kind === 'addition' ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                                        }}
                                                    >
                                                        {adj.kind === 'addition' ? '+' : '-'}
                                                        {num(adj.amount).toLocaleString()} {currencyCode}
                                                    </span>
                                                    {!isFinalized && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAdjustment(index)}
                                                            style={{ border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                    {isViewMode &&
                                        legacyAdjustments.map((adj) => (
                                            <div
                                                key={adj.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'white',
                                                    padding: '0.75rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--color-border)',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{adj.description}</div>
                                                    <div style={{ fontSize: '0.75rem', color: adj.type === 'Addition' ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>{adj.type}</div>
                                                </div>
                                                <span style={{ fontWeight: 600 }}>
                                                    {adj.type === 'Addition' ? '+' : '-'}
                                                    {adj.amount.toLocaleString()} {currencyCode}
                                                </span>
                                            </div>
                                        ))}

                                    {isLiveTermination && !isFinalized && (
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                                                gap: '0.5rem',
                                                marginTop: '0.5rem',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <input
                                                placeholder="Description (e.g. Loan Deduction)"
                                                value={newAdjustment.description}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            />
                                            <select
                                                value={newAdjustment.kind}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, kind: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            >
                                                <option value="addition">Addition (+)</option>
                                                <option value="deduction">Deduction (-)</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newAdjustment.amount}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            />
                                            <Button size="sm" onClick={handleAddAdjustment} disabled={patchTermination.isPending}>
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Journal Entry Preview">
                        <div style={{ fontSize: '0.85rem' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr',
                                    padding: '0.5rem 0',
                                    borderBottom: '1px solid var(--color-border)',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)',
                                }}
                            >
                                <span>Account</span>
                                <span style={{ textAlign: 'right' }}>Debit</span>
                                <span style={{ textAlign: 'right' }}>Credit</span>
                            </div>

                            {hasJournalPreview ? (
                                calculation.journal_preview.map((line, idx) => <JournalApiLine key={`${line.account_code}-${idx}`} line={line} />)
                            ) : (
                                <>
                                    <JENode name="End of Service Gratuity (6430)" debit={calculation.gratuityAmount || 0} />
                                    <JENode name="Leave Encashment (6110)" debit={calculation.leaveEncashment || 0} />
                                    <JENode name="Final Month Salary (6110)" debit={calculation.currentMonthSalary || 0} />
                                    {includeNoticePay && <JENode name="Notice Period Pay (6110)" debit={calculation.noticePeriodPay || 0} />}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderTop: '1px solid var(--color-border)', fontWeight: 600 }}>
                                        <span>Salaries Payable (2130)</span>
                                        <span style={{ textAlign: 'right' }}>-</span>
                                        <span style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{Number(finalNetPayable).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
            </div>
            </div>
        </>
    );
};

const JENode = ({ name, debit }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px dashed var(--color-border)', gap: '0.25rem', alignItems: 'start' }}>
        <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{name}</span>
        <span style={{ textAlign: 'right' }}>{debit.toLocaleString()}</span>
        <span style={{ textAlign: 'right' }}>-</span>
    </div>
);

const JournalApiLine = ({ line }) => {
    const d = num(line.debit);
    const c = num(line.credit);
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px dashed var(--color-border)', gap: '0.25rem', alignItems: 'start' }}>
            <span style={{ minWidth: 0, wordBreak: 'break-word' }}>
                {line.label} ({line.account_code})
            </span>
            <span style={{ textAlign: 'right' }}>{d > 0 ? d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
            <span style={{ textAlign: 'right' }}>{c > 0 ? c.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
        </div>
    );
};

const CalculatorsIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="16" y1="14" x2="16" y2="18"></line>
        <path d="M16 10h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M8 14h.01"></path>
        <path d="M12 18h.01"></path>
        <path d="M8 18h.01"></path>
    </svg>
);

export default FinalSettlement;
