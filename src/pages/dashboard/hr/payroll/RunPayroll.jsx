import React, { useState, useEffect } from 'react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { usePayroll } from '../../../../context/PayrollContext';
import { useHR } from '../../../../context/HRContext';
import { useAccounting } from '../../../../context/AccountingContext';
import { Play, AlertCircle, CheckCircle, Lock, Download, DollarSign, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RunPayroll = () => {
    const { payrollPeriods, salaryStructures, salaryComponents, taxSchemes, socialSecuritySchemes, taxSlabs } = usePayroll();
    const { employees } = useHR();
    const { addEntry } = useAccounting();
    const navigate = useNavigate();

    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [step, setStep] = useState(1); // 1: Select Period, 2: Review & Adjust, 3: Finalize
    const [calculatedPayroll, setCalculatedPayroll] = useState([]);
    const [adjustments, setAdjustments] = useState({}); // { employeeId: { amount: 0, reason: '' } }
    const [summary, setSummary] = useState({ totalGross: 0, totalDeductions: 0, totalNet: 0, totalTax: 0, totalAdjustments: 0 });
    const [expandedRow, setExpandedRow] = useState(null);

    const handleAdjustmentChange = (empId, field, value) => {
        setAdjustments(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || { amount: 0, reason: '' }),
                [field]: field === 'amount' ? (Number(value) || 0) : value
            }
        }));
    };

    const handleImportAdjustments = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Simple CSV parsing: EmpID, Amount, Reason
            const rows = text.split('\n').slice(1); // Skip header
            const newAdjustments = { ...adjustments };

            rows.forEach(row => {
                const [empId, amount, reason] = row.split(',').map(s => s.trim());
                if (empId && !isNaN(amount)) {
                    newAdjustments[empId] = {
                        amount: Number(amount),
                        reason: reason || 'Bulk Import'
                    };
                }
            });

            setAdjustments(newAdjustments);
            alert(`Imported ${rows.length} adjustments successfully!`);
        };
        reader.readAsText(file);
    };

    // Recalculate summary whenever payroll or adjustments change
    useEffect(() => {
        if (calculatedPayroll.length === 0) return;

        const totalGross = calculatedPayroll.reduce((acc, curr) => acc + curr.gross, 0);
        const totalDed = calculatedPayroll.reduce((acc, curr) => acc + curr.totalDeductions, 0);
        const totalTax = calculatedPayroll.reduce((acc, curr) => acc + curr.tax, 0);
        const totalAdj = Object.values(adjustments).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        setSummary({
            totalGross,
            totalDeductions: totalDed,
            totalTax,
            totalAdjustments: totalAdj,
            totalNet: totalGross - totalDed + totalAdj
        });
    }, [calculatedPayroll, adjustments]);

    // Helper: Calculate Payroll for an Employee
    const calculateEmployeePayroll = (employee, structure, components, periods) => {
        if (!structure) return null;

        let gross = 0;
        let totalDeductions = 0;
        let tax = 0;
        const breakdown = [];

        // Basic Helper for Formula Evaluation
        const evaluateFormula = (formula, context) => {
            try {
                // Replace variables in formula with values from context
                let parsedFormula = formula;
                Object.keys(context).forEach(key => {
                    const regex = new RegExp(`\\b${key}\\b`, 'g');
                    parsedFormula = parsedFormula.replace(regex, context[key] || 0);
                });

                // Use Function constructor as a safer alternative to eval for simple math
                // In a production app, use a proper math expression parser library (e.g. mathjs)
                return new Function(`return ${parsedFormula}`)();
            } catch (error) {
                console.error("Formula Evaluation Error:", error, formula);
                return 0;
            }
        };

        structure.components.forEach(compItem => {
            const masterComp = salaryComponents.find(c => c.id === compItem.componentId);
            if (!masterComp) return;

            let amount = 0;

            if (masterComp.calculationType === 'Fixed') {
                amount = compItem.value > 0 ? compItem.value : (employee.contract?.basicSalary || 0);

                // --- DYNAMIC REFLECTION: Contract Allowances ---
                if (compItem.value === 0) {
                    if (masterComp.code === 'HRA' && employee.contract?.housingAllowance) {
                        amount = employee.contract.housingAllowance;
                    } else if (masterComp.code === 'TRANS' && employee.contract?.transportationAllowance) {
                        amount = employee.contract.transportationAllowance;
                    } else if (masterComp.code === 'BASIC') {
                        amount = employee.contract?.basicSalary || 0;
                    } else {
                        // Fallback logic for demo
                        if (masterComp.code === 'HRA') amount = (employee.contract?.basicSalary || 0) * 0.4;
                        if (masterComp.code === 'TRANS') amount = (employee.contract?.basicSalary || 0) * 0.1;
                    }
                }
            }
            else if (masterComp.calculationType === 'Percentage') {
                const basis = masterComp.percentageOf === 'GROSS' ? gross : (employee.contract?.basicSalary || 0);
                let rate = masterComp.value || 0;

                // --- DYNAMIC REFLECTION: SS Scheme ---
                if (masterComp.code === 'SS_EMP' && employee.contract?.ssSchemeId) {
                    const selectedSS = socialSecuritySchemes.find(s => s.id === employee.contract.ssSchemeId);
                    if (selectedSS) rate = selectedSS.employeeRate;
                }

                amount = basis * (rate / 100);
            }
            else if (masterComp.calculationType === 'TaxSlab') {
                // --- DYNAMIC REFLECTION: Tax Scheme ---
                if (employee.contract?.taxSchemeId === 'TAX-EXEMPT') {
                    amount = 0;
                } else {
                    // Standard Slab Calculation Logic
                    const taxableIncome = gross; // simplified for demo
                    const slab = taxSlabs.find(s => taxableIncome >= s.min && taxableIncome <= s.max);
                    if (slab) {
                        amount = taxableIncome * (slab.rate / 100);
                    }
                }
                tax = amount;
            }
            else if (masterComp.calculationType === 'Formula') {
                amount = evaluateFormula(masterComp.formula, {
                    BASIC: employee.contract?.basicSalary || 0,
                    GROSS: gross,
                    OT_HOURS: 0 // Mocked
                });
            }

            // Internal Tax tracking for GL
            if (masterComp.code === 'TAX') tax = amount;

            // Add to totals
            if (masterComp.type === 'Earning') {
                gross += amount;
            } else if (masterComp.type === 'Deduction') {
                totalDeductions += amount;
            }

            breakdown.push({ ...masterComp, amount });
        });

        return {
            employeeId: employee.id,
            name: `${employee.firstName} ${employee.lastName} `,
            department: employee.departmentId, // Should resolve name
            gross,
            totalDeductions,
            tax, // Track tax separately
            netPay: gross - totalDeductions,
            breakdown
        };
    };

    const handleRunCalculation = () => {
        const results = employees.map(emp => {
            // Find Structure for this employee or use first one as default
            const structureId = emp.contract?.salaryStructureId || salaryStructures[0]?.id;
            const structure = salaryStructures.find(s => s.id === structureId) || salaryStructures[0];
            return calculateEmployeePayroll(emp, structure, salaryComponents, payrollPeriods);
        }).filter(Boolean);

        setCalculatedPayroll(results);
        setStep(2);
    };

    const handleFinalize = () => {
        const periodName = payrollPeriods.find(p => p.id === selectedPeriod)?.name || 'Unknown Period';

        // Create Journal Entry
        // Debit: Salaries Expense (Total Gross)
        // Credit: Salaries Payable (Net Pay)
        // Credit: Tax Payable (Total Tax)
        // Credit: Other Deductions (Total Ded - Tax) -> simplified to Accrued Expenses for now

        const otherDeductions = summary.totalDeductions - summary.totalTax;

        const je = {
            date: new Date().toISOString().split('T')[0],
            reference: `PAYROLL - ${selectedPeriod} `,
            description: `Payroll Posting for ${periodName}`,
            status: 'Posted',
            isAutomatic: true,
            sourceType: 'Payroll Engine',
            lines: [
                { id: 1, account: '6110', description: 'Salaries Expense', debit: summary.totalGross, credit: 0, costCenter: 'CC-001' }, // Default CC for MVP
                { id: 2, account: '2130', description: 'Net Salaries Payable', debit: 0, credit: summary.totalNet, costCenter: '' },
            ]
        };

        // Add Tax Liability if exists
        if (summary.totalTax > 0) {
            je.lines.push({ id: 3, account: '2140', description: 'Income Tax Payable', debit: 0, credit: summary.totalTax, costCenter: '' });
        }

        // Add other deductions (e.g. Social Security)
        if (otherDeductions > 0) {
            je.lines.push({ id: 4, account: '2120', description: 'Accrued Deductions (SS/Others)', debit: 0, credit: otherDeductions, costCenter: '' });
        }

        addEntry(je);

        // Here we would also update PayrollPeriod status to 'Locked' via context
        // updatePayrollPeriod(selectedPeriod, { status: 'Locked' }); 

        alert('Payroll finalized and posted to General Ledger successfully! ✅');
        navigate('/admin/accounting/journal');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Run Payroll</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Process salaries, review calculations, and finalize payments.</p>
                </div>
            </div>

            {/* Stepper (Simplified) */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div style={{ fontWeight: step === 1 ? 700 : 400, color: step === 1 ? 'var(--color-primary-600)' : 'var(--color-text-muted)' }}>1. Select Period</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: step === 2 ? 700 : 400, color: step === 2 ? 'var(--color-primary-600)' : 'var(--color-text-muted)' }}>2. Review & Adjust</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: step === 3 ? 700 : 400, color: step === 3 ? 'var(--color-primary-600)' : 'var(--color-text-muted)' }}>3. Finalize</div>
            </div>

            {step === 1 && (
                <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'var(--color-primary-50)', borderRadius: '50%', color: 'var(--color-primary-600)' }}>
                            <Play size={32} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Start New Payroll Run</h2>
                            <p style={{ color: 'var(--color-text-secondary)' }}>Select a payroll period to begin calculations.</p>
                        </div>

                        <div style={{ width: '100%', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payroll Period</label>
                            <select
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                value={selectedPeriod}
                                onChange={e => setSelectedPeriod(e.target.value)}
                            >
                                <option value="">-- Select Period --</option>
                                {payrollPeriods.filter(p => p.status !== 'Locked').map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                                ))}
                            </select>
                        </div>

                        <Button
                            size="lg"
                            disabled={!selectedPeriod}
                            onClick={handleRunCalculation}
                            style={{ width: '100%' }}
                        >
                            Start Calculation
                        </Button>
                    </div>
                </Card>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <Card className="padding-md" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Total Gross Pay</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>{summary.totalGross.toLocaleString()} JOD</div>
                        </Card>
                        <Card className="padding-md" style={{ background: 'var(--color-error-50)', border: '1px solid var(--color-error-100)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-error-700)', marginBottom: '0.5rem' }}>Total Deductions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error-900)' }}>{summary.totalDeductions.toLocaleString()} JOD</div>
                        </Card>
                        <Card className="padding-md" style={{ background: 'var(--color-success-50)', border: '1px solid var(--color-success-100)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-success-700)', marginBottom: '0.5rem' }}>Net Payable</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success-900)' }}>{summary.totalNet.toLocaleString()} JOD</div>
                        </Card>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Employee Payroll Review</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="outline" icon={<Download size={16} />} onClick={() => {
                                const blob = new Blob(['Employee ID, Amount, Reason\nEMP-001, -50, Late Arrival\nEMP-002, 100, Performance Bonus'], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'adjustments_template.csv';
                                a.click();
                            }}>Download CSV Template</Button>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    id="adjustment-upload"
                                    hidden
                                    accept=".csv"
                                    onChange={handleImportAdjustments}
                                />
                                <Button variant="primary" icon={<Upload size={16} />} onClick={() => document.getElementById('adjustment-upload').click()}>
                                    Import Adjustments (CSV)
                                </Button>
                            </div>
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
                                {calculatedPayroll.map(item => {
                                    const adj = adjustments[item.employeeId] || { amount: 0, reason: '' };
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
                                                            type="number"
                                                            value={adj.amount}
                                                            onChange={(e) => handleAdjustmentChange(item.employeeId, 'amount', e.target.value)}
                                                            placeholder="0"
                                                            style={{
                                                                width: '80px',
                                                                padding: '0.4rem 0.5rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid var(--color-border)',
                                                                fontSize: '0.9rem',
                                                                textAlign: 'right',
                                                                color: adj.amount < 0 ? 'var(--color-error-600)' : adj.amount > 0 ? 'var(--color-success-600)' : 'inherit'
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={adj.reason}
                                                            onChange={(e) => handleAdjustmentChange(item.employeeId, 'reason', e.target.value)}
                                                            placeholder="Adjustment reason..."
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.4rem 0.5rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid var(--color-border)',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>{finalNet.toLocaleString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
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
                                                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Earnings Details</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    {item.breakdown.filter(b => b.type === 'Earning').map((b, idx) => (
                                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                            <span>{b.name}</span>
                                                                            <span style={{ fontWeight: 600 }}>{b.amount.toLocaleString()} JOD</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Deductions Details</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    {item.breakdown.filter(b => b.type === 'Deduction').map((b, idx) => (
                                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                            <span>{b.name}</span>
                                                                            <span style={{ fontWeight: 600, color: 'var(--color-error-600)' }}>-{b.amount.toLocaleString()} JOD</span>
                                                                        </div>
                                                                    ))}
                                                                    {adj.amount < 0 && (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem' }}>
                                                                            <span style={{ fontStyle: 'italic' }}>Manual Adjustment (Deduction): {adj.reason}</span>
                                                                            <span style={{ fontWeight: 600, color: 'var(--color-error-600)' }}>{adj.amount.toLocaleString()} JOD</span>
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
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={() => setStep(3)}>Proceed to Finalize</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'var(--color-success-50)', borderRadius: '50%', color: 'var(--color-success-600)' }}>
                            <Lock size={32} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Finalize Payroll</h2>
                            <p style={{ color: 'var(--color-text-secondary)' }}>This will lock the period, generate payslips, and post journal entries.</p>
                        </div>

                        <div style={{ background: 'var(--color-slate-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Period:</span>
                                <b style={{ fontSize: '1rem' }}>{payrollPeriods.find(p => p.id === selectedPeriod)?.name}</b>
                            </div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>Financial Summary</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Base Payroll:</span>
                                <b>{(summary.totalGross - summary.totalDeductions).toLocaleString()} JOD</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Total Adjustments:</span>
                                <b style={{ color: summary.totalAdjustments >= 0 ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
                                    {summary.totalAdjustments >= 0 ? '+' : ''}{summary.totalAdjustments.toLocaleString()} JOD
                                </b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '2px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                <span style={{ fontWeight: 600 }}>Final Total Payable:</span>
                                <b style={{ fontSize: '1.25rem', color: 'var(--color-primary-700)' }}>{summary.totalNet.toLocaleString()} JOD</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Employees:</span>
                                <b>{calculatedPayroll.length}</b>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
                            <Button onClick={handleFinalize} size="lg" icon={<CheckCircle size={18} />} style={{ background: 'var(--color-primary-900)' }}>
                                Finalize & Post Journal Entries
                            </Button>
                            <Button variant="outline" size="lg" icon={<Download size={18} />} onClick={() => alert('Preparing all payslips for bulk download (ZIP)...')}>
                                Download All Payslips (ZIP)
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(2)}>Back to Review</Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default RunPayroll;
