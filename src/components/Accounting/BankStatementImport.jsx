import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import { Download, Upload, FileSpreadsheet, ArrowLeft, CheckCircle, AlertTriangle, Trash2, Save } from 'lucide-react';
import { post } from '@/api';
import useCustomQuery from '@/hooks/useQuery';
import { toast } from 'sonner';

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
    const basePath = useBasePath();
    const fileInputRef = useRef(null);

    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedData, setUploadedData] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importStatus, setImportStatus] = useState(null); // null | 'preview' | 'success' | 'error'
    const [errors, setErrors] = useState([]);
    const [importedCount, setImportedCount] = useState(0);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const bankAccountsQuery = useCustomQuery(
        '/accounting/bank-accounts/',
        ['accounting-bank-accounts'],
        {
            select: (response) => {
                if (Array.isArray(response?.data)) return response.data;
                if (Array.isArray(response?.results)) return response.results;
                if (Array.isArray(response)) return response;
                return [];
            },
        }
    );

    const importedFilesQuery = useCustomQuery(
        '/accounting/bank-import/files/',
        ['accounting-bank-import-files'],
        {
            select: (response) => {
                const payload = response?.data ?? response;
                if (Array.isArray(payload?.files)) return payload.files;
                if (Array.isArray(payload)) return payload;
                return [];
            },
        }
    );

    const bankAccountOptions = (bankAccountsQuery.data ?? [])
        .filter((account) => account?.is_active !== false)
        .map((account) => ({
            value: account.id,
            label: `${account.account_code || '—'} - ${account.name || account.account_name || 'Unnamed Account'}`,
        }));

    const importedFiles = importedFilesQuery.data ?? [];

    const handleBankAccountChange = (nextAccountId) => {
        setSelectedBankAccountId(nextAccountId);
        setSelectedFile(null);
        setUploadedData(null);
        setPreviewData(null);
        setFileName('');
        setImportStatus(null);
        setErrors([]);
        setImportedCount(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = () => {
        const csvContent = [
            'sep=,',
            TEMPLATE_HEADERS.join(','),
            ...SAMPLE_DATA.map(row => row.join(','))
        ].join('\r\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bank_statement_template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!selectedBankAccountId) {
            toast.error('Select a bank account first.');
            return;
        }

        setFileName(file.name);
        setSelectedFile(file);
        setIsPreviewLoading(true);
        setErrors([]);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bank_account_id', selectedBankAccountId);

            const response = await post('/accounting/bank-import/preview/', formData);
            setPreviewData(response);
            setUploadedData(response?.rows || []);
            setErrors(response?.warnings?.map((warning) => `Row ${warning.row}: ${warning.message}`) || []);
            setImportStatus('preview');

            if (!response?.all_matched) {
                toast.error('Import is blocked until all rows are matched.');
            } else {
                toast.success('File preview loaded successfully.');
            }
        } catch (err) {
            const apiMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Failed to preview file.';
            setUploadedData(null);
            setPreviewData(null);
            setErrors([apiMessage]);
            setImportStatus('error');
            toast.error(apiMessage);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please upload a file before importing.');
            return;
        }

        if (!selectedBankAccountId) {
            toast.error('Please select a bank account before importing.');
            return;
        }

        if (!previewData?.all_matched) {
            toast.error('Import is not allowed until all rows are matched.');
            return;
        }

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('bank_account_id', selectedBankAccountId);

            const response = await post('/accounting/bank-import/save/', formData);
            const importedRows = response?.imported_count ?? response?.count ?? validCount;

            setImportedCount(importedRows);
            setImportStatus('success');
            toast.success('Bank statement imported successfully.');
        } catch (err) {
            const apiMessage =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                err?.message ||
                'Failed to import bank statement.';
            toast.error(apiMessage);
        } finally {
            setIsImporting(false);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setUploadedData(null);
        setPreviewData(null);
        setFileName('');
        setImportStatus(null);
        setErrors([]);
        setImportedCount(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const totalDebit = parseFloat(previewData?.total_debit || '0');
    const totalCredit = parseFloat(previewData?.total_credit || '0');
    const validCount = previewData?.valid_count || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <style>{`
                .bank-upload-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .bank-upload-header-account {
                    width: 100%;
                    max-width: 360px;
                    margin-left: auto;
                }

                @media (max-width: 1199px) {
                    .bank-upload-header {
                        display: grid;
                        grid-template-columns: 1fr;
                    }

                    .bank-upload-header-account {
                        justify-self: end;
                    }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/accounting`)} className="cursor-pointer shrink-0" />
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
                <div className="bank-upload-header">
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
                    <div className="bank-upload-header-account">
                        <SelectWithLoadMore
                            id="bank-account-select"
                            label="Bank Account"
                            value={selectedBankAccountId}
                            onChange={handleBankAccountChange}
                            options={bankAccountOptions}
                            emptyOptionLabel="Select bank account..."
                            disabled={bankAccountsQuery.isPending || bankAccountsQuery.isError}
                            isInitialLoading={bankAccountsQuery.isPending}
                            paginationError={bankAccountsQuery.isError ? 'Failed to load bank accounts.' : null}
                            hasMore={false}
                        />
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
                            <Button onClick={() => navigate(`${basePath}/accounting/journal`)}>View Journal Entries</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {!selectedBankAccountId ? (
                            <div style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                background: 'var(--color-bg-subtle)'
                            }}>
                                <AlertTriangle size={36} style={{ color: 'var(--color-warning)', marginBottom: '0.75rem' }} />
                                <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Select a bank account first</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    Choose the bank account from the selector above to enable CSV upload.
                                </p>
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
                                        onClick={() => !isPreviewLoading && fileInputRef.current?.click()}
                                        style={{
                                            border: '2px dashed var(--color-border)', borderRadius: '12px',
                                            padding: '3rem', textAlign: 'center', cursor: isPreviewLoading ? 'not-allowed' : 'pointer',
                                            background: 'var(--color-bg-subtle)', transition: 'border-color 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary-400)'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                    >
                                        <Upload size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {isPreviewLoading ? 'Uploading and previewing...' : 'Click to upload CSV file'}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>or drag and drop your bank statement here</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* File info + errors */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <FileSpreadsheet size={20} style={{ color: 'var(--color-primary-600)' }} />
                                                <span style={{ fontWeight: 600 }}>{fileName}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({previewData?.total_rows || uploadedData.length} rows)</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={resetUpload}>Remove</Button>
                                                <Button size="sm" icon={<Save size={14} />} onClick={handleImport} disabled={isImporting || validCount === 0 || !previewData?.all_matched}>
                                                    {isImporting ? 'Saving...' : `Save File`}
                                                </Button>
                                            </div>
                                        </div>
                                        {!previewData?.all_matched && (
                                            <div style={{
                                                padding: '0.75rem', borderRadius: '8px', background: 'var(--color-error-dim)',
                                                marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600
                                            }}>
                                                Import is disabled because not all rows are matched (`all_matched = false`).
                                            </div>
                                        )}

                                        {/* Summary Cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-subtle)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Rows</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{previewData?.total_rows || uploadedData.length}</div>
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
                                        {(errors.length > 0 || previewData?.warnings?.length > 0) && (
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
                                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Errors / Warnings</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {uploadedData.map((row, i) => (
                                                        <tr key={i} style={{
                                                            borderBottom: '1px solid var(--color-border)',
                                                            background: row.status === 'valid'
                                                                ? 'var(--color-bg-surface)'
                                                                : row.status === 'warning'
                                                                    ? 'var(--color-warning-dim)'
                                                                    : 'var(--color-error-dim)'
                                                        }}>
                                                            <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.row || i + 1}</td>
                                                            <td style={{ padding: '6px 12px' }}>{row.date}</td>
                                                            <td style={{ padding: '6px 12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                                                            <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)' }}>{row.reference || '—'}</td>
                                                            <td style={{ padding: '6px 12px', textAlign: 'right', color: parseFloat(row.debit) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: parseFloat(row.debit) > 0 ? 600 : 400 }}>
                                                                {parseFloat(row.debit) > 0 ? parseFloat(row.debit).toLocaleString() : '—'}
                                                            </td>
                                                            <td style={{ padding: '6px 12px', textAlign: 'right', color: parseFloat(row.credit) > 0 ? 'var(--color-error)' : 'var(--color-text-muted)', fontWeight: parseFloat(row.credit) > 0 ? 600 : 400 }}>
                                                                {parseFloat(row.credit) > 0 ? parseFloat(row.credit).toLocaleString() : '—'}
                                                            </td>
                                                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>{parseFloat(row.balance) > 0 ? parseFloat(row.balance).toLocaleString() : '—'}</td>
                                                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                                {row.status === 'valid' ? (
                                                                    <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                                                ) : (
                                                                    <AlertTriangle size={16} style={{ color: row.status === 'warning' ? 'var(--color-warning)' : 'var(--color-error)' }} />
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)' }}>
                                                                {(row.errors?.length || row.warnings?.length) ? (
                                                                    [...(row.errors || []), ...(row.warnings || [])].join(' | ')
                                                                ) : '—'}
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

            <Card className="padding-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Uploaded Files</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {importedFiles.length} file{importedFiles.length === 1 ? '' : 's'}
                    </span>
                </div>

                {importedFilesQuery.isPending ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Loading uploaded files...</p>
                ) : importedFilesQuery.isError ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-error)' }}>Failed to load uploaded files.</p>
                ) : importedFiles.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>No uploaded files found yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-table-header)' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>File Name</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date Uploaded</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedFiles.map((file, index) => (
                                    <tr key={`${file?.url || file?.file_name || 'bank-file'}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '10px 12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                            {file?.file_name || 'Unnamed file'}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                                            {file?.date_uploaded ? new Date(file.date_uploaded).toLocaleString() : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            {file?.url ? (
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: 'var(--color-primary-600)', fontWeight: 600, textDecoration: 'none' }}
                                                >
                                                    Open
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BankStatementImport;
