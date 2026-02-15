import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePayroll } from '../../../context/PayrollContext';
import { useHR } from '../../../context/HRContext';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, CheckCircle, Printer, Calculator, DollarSign, Calendar, FileText, AlertTriangle } from 'lucide-react';

const FinalSettlement = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { calculateFinalSettlement, addFinalSettlement } = usePayroll();
    const { terminateEmployee, employees } = useHR();
    const { addEntry } = useAccounting();

    const [calculation, setCalculation] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [terminationData, setTerminationData] = useState(null);

    // New State for Adjustments & Overrides
    const [adjustments, setAdjustments] = useState([]); // [{ id, description, amount, type: 'Addition' | 'Deduction' }]
    const [overrides, setOverrides] = useState({}); // { gratuityAmount: null, leaveEncashment: null }
    const [newAdjustment, setNewAdjustment] = useState({ description: '', amount: '', type: 'Addition' });

    // Payment Date & Notice Pay State
    const [paymentDate, setPaymentDate] = useState('');
    const [includeNoticePay, setIncludeNoticePay] = useState(false);
    const [finalNetPayable, setFinalNetPayable] = useState(0);
    const [isViewMode, setIsViewMode] = useState(false);

    useEffect(() => {
        // Mode 1: New Calculation
        if (location.state && location.state.employeeId && location.state.terminationData) {
            const emp = employees.find(e => e.id === location.state.employeeId);
            setEmployee(emp);
            setTerminationData(location.state.terminationData);

            // Default Payment Date: Termination Date + 1 day
            const termDate = new Date(location.state.terminationData.date);
            termDate.setDate(termDate.getDate() + 1);
            setPaymentDate(termDate.toISOString().split('T')[0]);

            if (emp) {
                const result = calculateFinalSettlement(emp, location.state.terminationData);
                setCalculation(result);
            }
        }
        // Mode 2: View Existing Settlement
        else if (location.state && location.state.settlement) {
            const sett = location.state.settlement;
            setIsViewMode(true);

            setEmployee({
                firstName: sett.employeeName.split(' ')[0],
                lastName: sett.employeeName.split(' ').slice(1).join(' '),
                joinDate: 'N/A',
                departmentId: ''
            });

            setTerminationData({
                date: sett.terminationDate,
                type: sett.type,
                reason: 'Recorded in Settlement',
                noticePeriod: 30
            });

            setPaymentDate(sett.paymentDate || sett.terminationDate);
            setIncludeNoticePay(sett.details?.includeNoticePay || false);
            setFinalNetPayable(sett.amount);
            setCalculation(sett.details);

            // Populate View Mode State
            setAdjustments(sett.details?.adjustments || []);
            setOverrides(sett.details?.overrides || {});
        }
        else {
            navigate('/admin/hr/employees');
        }
    }, [location.state, employees]);

    // Recalculate Final Net whenever options change (Only in Edit Mode)
    useEffect(() => {
        if (calculation && !isViewMode) {
            let total = 0;

            // 1. Gratuity (Override or Calculated)
            total += (overrides.gratuityAmount !== undefined ? parseFloat(overrides.gratuityAmount) : calculation.gratuityAmount);

            // 2. Leave Encashment (Override or Calculated)
            total += (overrides.leaveEncashment !== undefined ? parseFloat(overrides.leaveEncashment) : calculation.leaveEncashment);

            // 3. Salary
            total += calculation.currentMonthSalary;

            // 4. Notice Pay
            if (includeNoticePay) {
                total += calculation.noticePeriodPay;
            }

            // 5. Adjustments
            const adjustmentTotal = adjustments.reduce((acc, curr) => {
                return curr.type === 'Addition' ? acc + parseFloat(curr.amount) : acc - parseFloat(curr.amount);
            }, 0);

            total += adjustmentTotal;

            setFinalNetPayable(Math.max(0, total));
        }
    }, [calculation, includeNoticePay, isViewMode, adjustments, overrides]);

    const handleAddAdjustment = () => {
        if (!newAdjustment.description || !newAdjustment.amount) return;
        setAdjustments([...adjustments, { ...newAdjustment, id: Date.now(), amount: parseFloat(newAdjustment.amount) }]);
        setNewAdjustment({ description: '', amount: '', type: 'Addition' });
    };

    const handleRemoveAdjustment = (id) => {
        setAdjustments(adjustments.filter(a => a.id !== id));
    };

    const handleFinalize = () => {
        if (!employee || !calculation || isViewMode) return;

        // 1. Create Accounting Journal Entry
        const jeDescription = `Final Settlement - ${employee.firstName} ${employee.lastName} - ${terminationData.type}`;

        // Use Overrides or Calculated Values
        const gratuityVal = overrides.gratuityAmount !== undefined ? parseFloat(overrides.gratuityAmount) : calculation.gratuityAmount;
        const leaveVal = overrides.leaveEncashment !== undefined ? parseFloat(overrides.leaveEncashment) : calculation.leaveEncashment;

        const jeLines = [
            // Gratuity
            { id: 1, account: '6430', description: 'End of Service Gratuity', debit: gratuityVal, credit: 0, costCenter: employee.departmentId || '' },
            // Leave Encashment 
            { id: 2, account: '6110', description: 'Leave Encashment', debit: leaveVal, credit: 0, costCenter: employee.departmentId || '' },
            // Current Month Salary
            { id: 3, account: '6110', description: 'Final Month Salary', debit: calculation.currentMonthSalary, credit: 0, costCenter: employee.departmentId || '' }
        ];

        if (includeNoticePay && calculation.noticePeriodPay > 0) {
            jeLines.push({ id: 4, account: '6110', description: 'Notice Period Pay', debit: calculation.noticePeriodPay, credit: 0, costCenter: employee.departmentId || '' });
        }

        // Add Manual Adjustments to JE
        adjustments.forEach((adj, index) => {
            const lineId = jeLines.length + 1;
            if (adj.type === 'Addition') {
                // Debit Expense (Default: 6110 or specific if we had a selector)
                jeLines.push({
                    id: lineId,
                    account: '6110', // Defaulting to Staff Cost for now
                    description: `Adjustment: ${adj.description}`,
                    debit: adj.amount,
                    credit: 0,
                    costCenter: employee.departmentId || ''
                });
            } else {
                // Credit (Deduction) - e.g. Loan Repayment (1100) or Other Income
                // Start with 1130 (Employee Advances/Receivables) as a safe default for deductions
                jeLines.push({
                    id: lineId,
                    account: '1130',
                    description: `Deduction: ${adj.description}`,
                    debit: 0,
                    credit: adj.amount,
                    costCenter: ''
                });
            }
        });

        // Credit Total to Payable
        jeLines.push({ id: jeLines.length + 1, account: '2130', description: `Payable to ${employee.firstName} ${employee.lastName}`, debit: 0, credit: finalNetPayable, costCenter: '' });

        const newEntry = addEntry({
            date: paymentDate,
            reference: `EOS-${employee.id}`,
            description: jeDescription,
            status: 'Posted',
            sourceType: 'Payroll',
            isAutomatic: true,
            lines: jeLines
        });

        if (!newEntry) return; // Failed (e.g. locked period)

        // 2. Update Employee Status in HR
        terminateEmployee(employee.id, terminationData);

        // 3. Add Settlement Record in Payroll
        addFinalSettlement({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            terminationDate: terminationData.date,
            paymentDate: paymentDate,
            type: terminationData.type,
            amount: finalNetPayable,
            journalEntryId: newEntry.id,
            details: {
                ...calculation,
                includeNoticePay,
                finalNetPayable,
                adjustments, // Save adjustments list
                overrides    // Save overrides
            }
        });

        // 4. Navigate back using simplified navigate object to avoid circular references if any
        navigate('/admin/hr/payroll', { state: { successMessage: 'Employee settlement finalized and Journal Entry posted.' } });
    };

    if (!employee || !calculation) return <div>Loading...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                Back
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {isViewMode ? 'Settlement Details' : 'Final Settlement'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {isViewMode ? 'View Only' : 'Terminating'}: {employee.firstName} {employee.lastName}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Printer size={16} />}>Print</Button>
                    {!isViewMode && (
                        <Button variant="primary" icon={<CheckCircle size={16} />} onClick={handleFinalize}>Finalize & Create Journal Entry</Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Employment & Settings Card */}
                    <Card title="Settlement Configuration">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
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
                                        style={{
                                            width: '100%', padding: '0.6rem',
                                            borderRadius: '4px', border: '1px solid var(--color-border)'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--color-warning-50)', borderRadius: '6px', border: '1px dashed var(--color-warning-200)' }}>
                            <input
                                type="checkbox"
                                id="noticePay"
                                checked={includeNoticePay}
                                onChange={(e) => !isViewMode && setIncludeNoticePay(e.target.checked)}
                                disabled={isViewMode}
                                style={{ transform: 'scale(1.2)' }}
                            />
                            <label htmlFor="noticePay" style={{ cursor: isViewMode ? 'default' : 'pointer' }}>
                                <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-warning-900)' }}>Include Pay in Lieu of Notice?</span>
                                {calculation.noticePeriodPay && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-warning-700)' }}>
                                        Add {calculation.noticePeriodPay.toLocaleString()} JOD for {terminationData?.noticePeriod || 30} days notice period.
                                    </span>
                                )}
                            </label>
                        </div>
                    </Card>

                    {/* Breakdown Card */}
                    <Card title="Calculation Breakdown">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {/* Gratuity Section */}
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={18} color="var(--color-primary-600)" />
                                        End of Service Gratuity
                                    </span>
                                    {isViewMode ? (
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {(overrides.gratuityAmount !== undefined ? parseFloat(overrides.gratuityAmount) : calculation.gratuityAmount)?.toLocaleString()} JOD
                                            {overrides.gratuityAmount !== undefined && <span style={{ fontSize: '0.7rem', color: 'var(--color-warning-700)', marginLeft: '0.5rem' }}>(Overridden)</span>}
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                value={overrides.gratuityAmount !== undefined ? overrides.gratuityAmount : calculation.gratuityAmount}
                                                onChange={(e) => setOverrides({ ...overrides, gratuityAmount: e.target.value })}
                                                style={{
                                                    textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', width: '120px',
                                                    padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: '4px',
                                                    background: overrides.gratuityAmount !== undefined ? 'var(--color-warning-50)' : 'white'
                                                }}
                                            />
                                            <span style={{ fontWeight: 600 }}>JOD</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '1.7rem' }}>
                                    <div>Tenure: {calculation.yearsOfService?.toFixed(2)} Years</div>
                                    <div style={{ color: 'var(--color-primary-700)', marginTop: '0.25rem' }}>Rule: {calculation.ruleApplied}</div>
                                </div>
                            </div>

                            {/* Leave Encashment */}
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CalculatorsIcon size={18} color="var(--color-indigo-600)" />
                                        Leave Encashment
                                    </span>
                                    {isViewMode ? (
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {(overrides.leaveEncashment !== undefined ? parseFloat(overrides.leaveEncashment) : calculation.leaveEncashment)?.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD
                                            {overrides.leaveEncashment !== undefined && <span style={{ fontSize: '0.7rem', color: 'var(--color-warning-700)', marginLeft: '0.5rem' }}>(Overridden)</span>}
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                value={overrides.leaveEncashment !== undefined ? overrides.leaveEncashment : calculation.leaveEncashment}
                                                onChange={(e) => setOverrides({ ...overrides, leaveEncashment: e.target.value })}
                                                style={{
                                                    textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', width: '120px',
                                                    padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: '4px',
                                                    background: overrides.leaveEncashment !== undefined ? 'var(--color-warning-50)' : 'white'
                                                }}
                                            />
                                            <span style={{ fontWeight: 600 }}>JOD</span>
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '1.7rem' }}>
                                    {calculation.leaveBalance} days remaining @ {(calculation.basicSalary / 30)?.toFixed(2)} JOD/day
                                </p>
                            </div>

                            {/* Current Salary */}
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <DollarSign size={18} color="var(--color-success-600)" />
                                        Current Month Salary
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{calculation.currentMonthSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD</span>
                                </div>
                            </div>

                            {/* Notice Pay (Conditional) */}
                            {includeNoticePay && (
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-warning-50)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning-900)' }}>
                                            <AlertTriangle size={18} color="var(--color-warning-700)" />
                                            Notice Period Pay
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning-900)' }}>
                                            {calculation.noticePeriodPay?.toLocaleString(undefined, { minimumFractionDigits: 2 })} JOD
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Adjustments Section */}
                            <div style={{ padding: '1.25rem', background: 'var(--color-slate-50)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Manual Adjustments</h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {adjustments.map(adj => (
                                        <div key={adj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{adj.description}</div>
                                                <div style={{ fontSize: '0.75rem', color: adj.type === 'Addition' ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>{adj.type}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 600, color: adj.type === 'Addition' ? 'var(--color-success-700)' : 'var(--color-danger-700)' }}>
                                                    {adj.type === 'Addition' ? '+' : '-'}{adj.amount.toLocaleString()} JOD
                                                </span>
                                                {!isViewMode && (
                                                    <button onClick={() => handleRemoveAdjustment(adj.id)} style={{ border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>×</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {!isViewMode && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <input
                                                placeholder="Description (e.g. Loan Deduction)"
                                                value={newAdjustment.description}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            />
                                            <select
                                                value={newAdjustment.type}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            >
                                                <option value="Addition">Addition (+)</option>
                                                <option value="Deduction">Deduction (-)</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newAdjustment.amount}
                                                onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                            />
                                            <Button size="sm" onClick={handleAddAdjustment}>Add</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Summary & JE Preview (Right Side) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card className="padding-md" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary-900)' }}>Total Net Payable</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary-800)' }}>Total</span>
                            <span style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--color-primary-700)' }}>
                                {finalNetPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '1rem' }}>JOD</span>
                            </span>
                        </div>
                    </Card>

                    <Card title="Journal Entry Preview">
                        <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                <span>Account</span>
                                <span style={{ textAlign: 'right' }}>Debit</span>
                                <span style={{ textAlign: 'right' }}>Credit</span>
                            </div>

                            <JENode name="End of Service Gratuity (6430)" debit={calculation.gratuityAmount || 0} />
                            <JENode name="Leave Encashment (6110)" debit={calculation.leaveEncashment || 0} />
                            <JENode name="Final Month Salary (6110)" debit={calculation.currentMonthSalary || 0} />
                            {includeNoticePay && <JENode name="Notice Period Pay (6110)" debit={calculation.noticePeriodPay || 0} />}

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderTop: '1px solid var(--color-border)', fontWeight: 600 }}>
                                <span>Salaries Payable (2130)</span>
                                <span style={{ textAlign: 'right' }}>-</span>
                                <span style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{finalNetPayable.toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const JENode = ({ name, debit }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px dashed var(--color-border)' }}>
        <span>{name}</span>
        <span style={{ textAlign: 'right' }}>{debit.toLocaleString()}</span>
        <span style={{ textAlign: 'right' }}>-</span>
    </div>
);

// Fallback icon
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
