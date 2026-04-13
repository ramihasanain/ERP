import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Upload, FileSpreadsheet, ArrowLeft, CheckCircle, AlertTriangle, Trash2, Save, Eye } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';

const TEMPLATE_HEADERS = ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance', 'Category'];

const SAMPLE_DATA = [
    ['2025-03-01', 'Opening Balance', '', '', '', '15000.00', 'Bank'],
    ['2025-03-02', 'Client Payment - ABC Corp', 'INV-001', '5000.00', '', '20000.00', 'Revenue'],
    ['2025-03-03', 'Office Rent Payment', 'RENT-MAR', '', '2500.00', '17500.00', 'Expense'],
    ['2025-03-05', 'Electricity Bill', 'UTIL-003', '', '350.00', '17150.00', 'Expense'],
    ['2025-03-07', 'Freelancer Payment', 'FRL-012', '', '1200.00', '15950.00', 'Expense'],
    ['2025-03-10', 'Product Sale', 'INV-002', '3200.00', '', '19150.00', 'Revenue'],
];

const BankStatementImport = () => {
    const navigate = useNavigate();
    const { addJournalEntry } = useAccounting();
    const fileInputRef = useRef(null);

    const [uploadedData, setUploadedData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importStatus, setImportStatus] = useState(null); // null | 'preview' | 'success' | 'error'
    const [errors, setErrors] = useState([]);
    const [importedCount, setImportedCount] = useState(0);

    const downloadTemplate = () => {
        const csvContent = [
            TEMPLATE_HEADERS.join(','),
            ...SAMPLE_DATA.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bank_statement_template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const rows = [];
                const parseErrors = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    if (values.length < 4) {
                        parseErrors.push(`Row ${i}: Insufficient columns (${values.length})`);
                        continue;
                    }

                    const row = {};
                    headers.forEach((h, idx) => {
                        row[h] = values[idx] || '';
                    });

                    // Validate date
                    if (!row.Date || isNaN(new Date(row.Date).getTime())) {
                        parseErrors.push(`Row ${i}: Invalid date "${row.Date}"`);
                    }

                    // Validate amounts
                    const debit = parseFloat(row.Debit) || 0;
                    const credit = parseFloat(row.Credit) || 0;
                    if (debit === 0 && credit === 0) {
                        parseErrors.push(`Row ${i}: Both Debit and Credit are zero`);
                    }

                    row._debit = debit;
                    row._credit = credit;
                    row._balance = parseFloat(row.Balance) || 0;
                    row._valid = !!row.Date && !isNaN(new Date(row.Date).getTime()) && (debit > 0 || credit > 0);
                    rows.push(row);
                }

                setUploadedData(rows);
                setErrors(parseErrors);
                setImportStatus('preview');
            } catch (err) {
                setErrors([`Failed to parse file: ${err.message}`]);
                setImportStatus('error');
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        const validRows = uploadedData.filter(r => r._valid);
        let count = 0;

        validRows.forEach(row => {
            const isDebit = row._debit > 0;
            addJournalEntry({
                date: row.Date,
                description: `[Bank Import] ${row.Description || 'N/A'}`,
                reference: row.Reference || `BANK-${Date.now()}-${count}`,
                lines: [
                    {
                        accountId: '101',
                        accountName: 'Bank Account',
                        debit: row._debit,
                        credit: row._credit,
                        description: row.Description
                    },
                    {
                        accountId: isDebit ? '400' : '500',
                        accountName: isDebit ? 'Revenue' : 'Expenses',
                        debit: row._credit,
                        credit: row._debit,
                        description: row.Description
                    }
                ],
                status: 'Posted'
            });
            count++;
        });

        setImportedCount(count);
        setImportStatus('success');
    };

    const resetUpload = () => {
        setUploadedData(null);
        setFileName('');
        setImportStatus(null);
        setErrors([]);
        setImportedCount(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const totalDebit = uploadedData?.reduce((sum, r) => sum + r._debit, 0) || 0;
    const totalCredit = uploadedData?.reduce((sum, r) => sum + r._credit, 0) || 0;
    const validCount = uploadedData?.filter(r => r._valid).length || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bank Statement Import</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Download the template, fill it, and upload to import transactions.</p>
                    </div>
                </div>
            </div>

            {/* Step 1: Download Template */}
            <Card className="padding-lg" style={{ border: '2px solid var(--color-border)', background: 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '3.5rem', height: '3.5rem', borderRadius: '16px',
                        background: 'var(--color-primary-100)', color: 'var(--color-primary-600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FileSpreadsheet size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Step 1: Download Template</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Download the CSV template, fill in your bank transactions, then come back to upload it.
                        </p>
                    </div>
                    <Button icon={<Download size={18} />} onClick={downloadTemplate}>Download Template</Button>
                </div>

                {/* Template Preview */}
                <div style={{ marginTop: '1.25rem', overflowX: 'auto' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Template Preview:</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-table-header)' }}>
                                {TEMPLATE_HEADERS.map(h => (
                                    <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SAMPLE_DATA.slice(0, 3).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    {row.map((cell, j) => (
                                        <td key={j} style={{ padding: '5px 12px', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{cell || '—'}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Step 2: Upload */}
            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '3.5rem', height: '3.5rem', borderRadius: '16px',
                        background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)',
                    }}>
                        <Upload size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Step 2: Upload Your Statement</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Upload the filled CSV file to preview and import transactions.</p>
                    </div>
                </div>

                {importStatus === 'success' ? (
                    <div style={{
                        textAlign: 'center', padding: '3rem',
                        background: 'var(--color-success-dim)', borderRadius: '12px'
                    }}>
                        <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: '1rem' }} />
                        <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Import Successful!</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            {importedCount} transactions have been imported as journal entries.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button variant="outline" onClick={resetUpload}>Import Another</Button>
                            <Button onClick={() => navigate('/admin/accounting/journal')}>View Journal Entries</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />

                        {!uploadedData ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--color-border)', borderRadius: '12px',
                                    padding: '3rem', textAlign: 'center', cursor: 'pointer',
                                    background: 'var(--color-bg-subtle)', transition: 'border-color 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary-400)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                <Upload size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
                                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Click to upload CSV file</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>or drag and drop your bank statement here</p>
                            </div>
                        ) : (
                            <div>
                                {/* File info + errors */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <FileSpreadsheet size={20} style={{ color: 'var(--color-primary-600)' }} />
                                        <span style={{ fontWeight: 600 }}>{fileName}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({uploadedData.length} rows)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={resetUpload}>Remove</Button>
                                        <Button size="sm" icon={<Save size={14} />} onClick={handleImport} disabled={validCount === 0}>
                                            Import {validCount} Transactions
                                        </Button>
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-subtle)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Rows</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{uploadedData.length}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-success-dim)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 500 }}>Valid</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{validCount}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-primary-50)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>Total Debit</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{totalDebit.toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-error-dim)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 500 }}>Total Credit</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error)' }}>{totalCredit.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Errors */}
                                {errors.length > 0 && (
                                    <div style={{
                                        padding: '0.75rem', borderRadius: '8px', background: 'var(--color-warning-dim)',
                                        marginBottom: '1rem', fontSize: '0.8rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.5rem' }}>
                                            <AlertTriangle size={16} /> {errors.length} Warning(s)
                                        </div>
                                        {errors.slice(0, 5).map((err, i) => (
                                            <div key={i} style={{ color: 'var(--color-text-secondary)', paddingLeft: '1.5rem' }}>• {err}</div>
                                        ))}
                                        {errors.length > 5 && (
                                            <div style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', fontStyle: 'italic' }}>
                                                ...and {errors.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Data Table */}
                                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-table-header)' }}>
                                                <th style={{ padding: '8px 12px', textAlign: 'center', width: '30px' }}>#</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reference</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Debit</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Credit</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Balance</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadedData.map((row, i) => (
                                                <tr key={i} style={{
                                                    borderBottom: '1px solid var(--color-border)',
                                                    background: row._valid ? 'var(--color-bg-surface)' : 'var(--color-error-dim)'
                                                }}>
                                                    <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                                                    <td style={{ padding: '6px 12px' }}>{row.Date}</td>
                                                    <td style={{ padding: '6px 12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.Description}</td>
                                                    <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)' }}>{row.Reference || '—'}</td>
                                                    <td style={{ padding: '6px 12px', textAlign: 'right', color: row._debit > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: row._debit > 0 ? 600 : 400 }}>
                                                        {row._debit > 0 ? row._debit.toLocaleString() : '—'}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', textAlign: 'right', color: row._credit > 0 ? 'var(--color-error)' : 'var(--color-text-muted)', fontWeight: row._credit > 0 ? 600 : 400 }}>
                                                        {row._credit > 0 ? row._credit.toLocaleString() : '—'}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>{row._balance > 0 ? row._balance.toLocaleString() : '—'}</td>
                                                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                        {row._valid ? (
                                                            <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                                        ) : (
                                                            <AlertTriangle size={16} style={{ color: 'var(--color-error)' }} />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Instructions */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Instructions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary-600)' }}>Template Columns</h4>
                        <ul style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0 }}>
                            <li>📅 <strong>Date</strong> — Transaction date (YYYY-MM-DD)</li>
                            <li>📝 <strong>Description</strong> — Transaction description</li>
                            <li>🔗 <strong>Reference</strong> — Invoice or reference number</li>
                            <li>➕ <strong>Debit</strong> — Money coming in</li>
                            <li>➖ <strong>Credit</strong> — Money going out</li>
                            <li>💰 <strong>Balance</strong> — Running balance</li>
                            <li>🏷️ <strong>Category</strong> — Revenue, Expense, Bank, etc.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary-600)' }}>Tips</h4>
                        <ul style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0 }}>
                            <li>✅ Use the exact date format: <strong>YYYY-MM-DD</strong></li>
                            <li>✅ Each row must have either a Debit or Credit amount</li>
                            <li>✅ Download most bank statements as CSV from your bank</li>
                            <li>✅ Column headers must match the template exactly</li>
                            <li>⚠️ Invalid rows will be flagged but won't block import</li>
                            <li>✅ Imported transactions will appear as journal entries</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BankStatementImport;
