import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, Plus, Trash2, ArrowLeft, Upload, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Monitor, Lock } from 'lucide-react';
import JournalEntryList from '@/components/Accounting/JournalEntryList';
import ConfirmationModal from '@/components/Shared/ConfirmationModal';

const NewJournalEntry = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const { costCenters, addEntry, updateEntry, entries, budgetUsage, accounts, getAccountBalance, getPeriodStatus } = useAccounting();

    // Sort accounts by code
    const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

    const getDepth = (acc) => {
        if (!acc.parentCode) return 0;
        const parent = accounts.find(a => a.code === acc.parentCode);
        return parent ? 1 + getDepth(parent) : 1;
    };

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('JOD');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [attachedFile, setAttachedFile] = useState(null);
    const [createdBy, setCreatedBy] = useState('Admin User');
    const [status, setStatus] = useState('Draft');
    const [sourceType, setSourceType] = useState('Manual');
    const [isAutomatic, setIsAutomatic] = useState(false);

    const [lines, setLines] = useState([
        { id: 1, account: '', description: '', debit: 0, credit: 0, costCenter: '' },
        { id: 2, account: '', description: '', debit: 0, credit: 0, costCenter: '' }
    ]);

    const [warningModal, setWarningModal] = useState({ isOpen: false, messages: [], pendingAction: null });
    const [blockingErrors, setBlockingErrors] = useState([]);

    // Load Data if Editing
    useEffect(() => {
        if (id) {
            const entry = entries.find(e => e.id === id);
            if (entry) {
                setDate(entry.date);
                setReference(entry.reference);
                setDescription(entry.description);
                setCurrency(entry.currency || 'JOD');
                setExchangeRate(entry.exchangeRate || 1);
                setAttachedFile(entry.attachedFile);
                setCreatedBy(entry.createdBy);
                setStatus(entry.status);
                setIsAutomatic(entry.isAutomatic || false);
                setSourceType(entry.sourceType || 'Manual');
                // Ensure lines have unique IDs for React keys if coming from DB/Context
                setLines(entry.lines.map((l, index) => ({ ...l, id: l.id || index + 1 })));
            }
        }
    }, [id, entries]);

    // Update Exchange Rate defaults
    useEffect(() => {
        if (!id) { // Only set defaults if NEW entry
            if (currency === 'JOD') setExchangeRate(1);
            if (currency === 'USD') setExchangeRate(0.71);
            if (currency === 'EUR') setExchangeRate(0.78);
            if (currency === 'SAR') setExchangeRate(0.19);
        }
    }, [currency, id]);

    // Permissions / Lock Logic
    const periodStatus = getPeriodStatus(date);
    const isPeriodLocked = periodStatus === 'Hard Lock';
    const isReadOnly = isAutomatic || isPeriodLocked;

    const addLine = () => {
        setLines([...lines, { id: Date.now(), account: '', description: '', debit: 0, credit: 0, costCenter: '' }]);
    };

    const removeLine = (lineId) => {
        if (lines.length > 2) {
            setLines(lines.filter(l => l.id !== lineId));
        }
    };

    const updateLine = (lineId, field, value) => {
        setLines(lines.map(l => l.id === lineId ? { ...l, [field]: value } : l));
    };

    // Calculations
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    const baseAmount = (totalDebit * exchangeRate).toFixed(2);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setAttachedFile(e.target.files[0].name);
        }
    };

    const handleSave = (newStatus) => {
        // Reset errors
        setBlockingErrors([]);

        // 1. & 5. ACCOUNT & BALANCE VALIDATION (BLOCKING)
        const validationErrors = [];

        // Rule 5: Account Validation
        lines.forEach((line, index) => {
            if (!line.account) {
                validationErrors.push(`Line ${index + 1}: Missing Account selection.`);
            }
            if ((Number(line.debit) === 0 && Number(line.credit) === 0)) {
                // validationErrors.push(`Line ${index + 1}: Amount must be positive and non-zero.`);
                // Allow 0 for now if user wants to just add lines, but ideally valid entries have amounts.
                // Strict validation:
                validationErrors.push(`Line ${index + 1}: Amount must be positive and non-zero.`);
            }
            if (Number(line.debit) < 0 || Number(line.credit) < 0) {
                validationErrors.push(`Line ${index + 1}: Amounts cannot be negative.`);
            }
            if (Number(line.debit) > 0 && Number(line.credit) > 0) {
                validationErrors.push(`Line ${index + 1}: Cannot have both Debit and Credit. Use separate lines.`);
            }
        });

        // Rule 1: Balance Rule
        if (newStatus !== 'Draft') {
            if (!isBalanced) {
                validationErrors.push("Journal Entry is not balanced (Total Debit ? Total Credit).");
            }
        }

        if (validationErrors.length > 0) {
            setBlockingErrors(validationErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 2. & 3. WARNING CHECKS (NON-BLOCKING)
        const warnings = [];

        if (newStatus !== 'Draft') {
            // Rule 2: Bank & Cash Check
            lines.forEach(line => {
                const creditAmount = Number(line.credit);
                if (creditAmount > 0) {
                    const accObj = accounts.find(a => a.code === line.account);
                    const isCashOrBank = accObj && (accObj.parentCode === '1110' || accObj.parentCode === '1130');

                    if (isCashOrBank) {
                        const currentBalance = accObj ? getAccountBalance(accObj.id) : 0;
                        const transactionAmountBase = creditAmount * exchangeRate;
                        const projectedBalance = currentBalance - transactionAmountBase;

                        if (projectedBalance < 0) {
                            warnings.push(`CASH WARNING: Credit to [${accObj.name}] will result in negative balance (${projectedBalance.toFixed(2)} JOD).`);
                        }
                    }
                }
            });

            // Rule 3: Budget Control
            const spendingByCC = {};
            lines.forEach(line => {
                const debitAmount = Number(line.debit);
                if (debitAmount > 0 && line.costCenter) {
                    const account = accounts.find(a => a.code === line.account);
                    if (account && account.type === 'Expense') {
                        spendingByCC[line.costCenter] = (spendingByCC[line.costCenter] || 0) + (debitAmount * exchangeRate);
                    }
                }
            });

            Object.entries(spendingByCC).forEach(([ccId, amount]) => {
                const cc = costCenters.find(c => c.id === ccId);
                if (cc) {
                    const currentSpent = budgetUsage[ccId] || 0;
                    const maxBudget = cc.budget || 0;
                    if (currentSpent + amount > maxBudget) {
                        const excess = (currentSpent + amount) - maxBudget;
                        warnings.push(`BUDGET WARNING: [${cc.name}] exceeds budget by ${excess.toFixed(2)} JOD.`);
                    }
                }
            });
        }

        if (warnings.length > 0) {
            setWarningModal({
                isOpen: true,
                messages: warnings,
                pendingAction: () => executeSave(newStatus)
            });
            return;
        }

        executeSave(newStatus);
    };

    const executeSave = (finalStatus) => {
        const entryData = {
            date,
            reference,
            description,
            currency,
            exchangeRate,
            attachedFile,
            createdBy,
            status: finalStatus,
            lines
        };

        if (id) {
            updateEntry(id, entryData);
        } else {
            addEntry(entryData);
        }
        
        navigate('/admin/accounting/journal');
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/admin/accounting/journal')}><ArrowLeft size={18} /> Back</Button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {id ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </h1>
                </div>
            </div>

            {/* Read-Only Banner */}
            {isReadOnly && (
                <div style={{ 
                    background: 'var(--color-warning-50)', border: '1px solid var(--color-warning-200)', 
                    borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-warning-800)'
                }}>
                    {isAutomatic ? <Monitor size={24} /> : <Lock size={24} />}
                    <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {isAutomatic ? `Auto-Generated Entry (${sourceType})` : 'Period Locked'}
                        </h4>
                        <p style={{ fontSize: '0.85rem' }}>
                            {isAutomatic 
                                ? "This entry was automatically generated. Please edit the original source transaction to make changes." 
                                : "The accounting period for this date is closed. Entries cannot be modified."}
                        </p>
                    </div>
                </div>
            )}

            {blockingErrors.length > 0 && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <XCircle size={18} /> Please fix the following errors:
                    </div>
                    <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                        {blockingErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '1.5rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} /> General Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isReadOnly} />
                            <Input label="Reference" placeholder="e.g. INV-2025-001" value={reference} onChange={(e) => setReference(e.target.value)} disabled={isReadOnly} />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Input label="Description" placeholder="Description of the transaction..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isReadOnly} />
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                             <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Journal Lines</h3>
                             <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                                 <span style={{ color: 'var(--color-text-secondary)' }}>Total Debit: <strong>{totalDebit.toFixed(2)}</strong></span>
                                 <span style={{ color: 'var(--color-text-secondary)' }}>Total Credit: <strong>{totalCredit.toFixed(2)}</strong></span>
                                 <span style={{ 
                                     color: isBalanced ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                                     fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem'
                                 }}>
                                     {isBalanced ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                     {isBalanced ? 'Balanced' : 'Unbalanced'}
                                 </span>
                             </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: '0.75rem', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                <div>Account</div>
                                <div>Line Description</div>
                                <div>Cost Center</div>
                                <div style={{ textAlign: 'right' }}>Debit</div>
                                <div style={{ textAlign: 'right' }}>Credit</div>
                                <div></div>
                            </div>
                            
                            {lines.map((line, index) => (
                                <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', gap: '0.75rem', alignItems: 'start' }}>
                                     <select 
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', height: '38px' }}
                                        value={line.account}
                                        onChange={(e) => updateLine(line.id, 'account', e.target.value)}
                                        disabled={isReadOnly}
                                     >
                                        <option value="">Select Account</option>
                                        {sortedAccounts.map(acc => (
                                            <option key={acc.id} value={acc.code} disabled={acc.isGroup} style={{ fontWeight: acc.isGroup ? 600 : 400 }}>
                                                {'\u00A0'.repeat(getDepth(acc) * 3)} {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                     </select>
                                     
                                     <input 
                                        type="text" 
                                        placeholder="Description"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                                        value={line.description}
                                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                        disabled={isReadOnly}
                                     />

                                     <select
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', height: '38px' }}
                                        value={line.costCenter}
                                        onChange={(e) => updateLine(line.id, 'costCenter', e.target.value)}
                                        disabled={isReadOnly}
                                     >
                                         <option value="">None</option>
                                         {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>)}
                                     </select>

                                     <input 
                                        type="number" 
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', textAlign: 'right' }}
                                        value={line.debit}
                                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                                        disabled={isReadOnly}
                                     />

                                     <input 
                                        type="number" 
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', textAlign: 'right' }}
                                        value={line.credit}
                                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                                        disabled={isReadOnly}
                                     />

                                     <button 
                                        onClick={() => removeLine(line.id)}
                                        style={{ background: 'none', border: 'none', color: isReadOnly ? 'var(--color-text-muted)' : 'var(--color-danger-500)', cursor: isReadOnly ? 'not-allowed' : 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        disabled={isReadOnly}
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                </div>
                            ))}

                            {!isReadOnly && (
                                <button 
                                    onClick={addLine}
                                    style={{ 
                                        background: 'none', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', 
                                        padding: '0.75rem', color: 'var(--color-primary-600)', fontSize: '0.9rem', fontWeight: 500,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    <Plus size={16} /> Add Line
                                </button>
                            )}
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Entry Settings</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                                <select 
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="JOD">JOD - Jordanian Dinar</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="SAR">SAR - Saudi Riyal</option>
                                </select>
                            </div>

                            {currency !== 'JOD' && (
                                <Input label="Exchange Rate" type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} disabled={isReadOnly} />
                            )}
                            
                            <Input label="Created By" value={createdBy} disabled />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Attachment</label>
                                <div style={{ 
                                    border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', 
                                    textAlign: 'center', cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--color-bg-secondary)' 
                                }}>
                                    <input type="file" id="file" hidden onChange={handleFileChange} disabled={isReadOnly} />
                                    <label htmlFor="file" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <Upload size={20} />
                                        <span style={{ fontSize: '0.85rem' }}>{attachedFile || 'Upload Document'}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {!isReadOnly && (
                                <>
                                    <Button fullWidth onClick={() => handleSave('Posted')} icon={<CheckCircle size={18} />}>
                                        Post Entry
                                    </Button>
                                    <Button fullWidth variant="outline" onClick={() => handleSave('Draft')} icon={<Save size={18} />}>
                                        Save as Draft
                                    </Button>
                                </>
                            )}
                            {isReadOnly && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    Viewing Mode Only
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={warningModal.isOpen} 
                onClose={() => setWarningModal({ ...warningModal, isOpen: false })}
                onConfirm={warningModal.pendingAction}
                title="Validation Warnings"
                message={
                    <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                        {warningModal.messages.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                }
                confirmText="Proceed Anyway"
                type="warning"
            />
        </div>
    );
};

export default NewJournalEntry;
