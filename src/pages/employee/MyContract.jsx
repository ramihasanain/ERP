import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useHR } from '@/context/HRContext';
import { FileText, Printer, Copy, Download, Clock, CheckCircle } from 'lucide-react';

const MyContract = () => {
    const { employees, generateContract, contractTemplates } = useHR();
    const currentEmployeeId = 'EMP-002'; // Simulating logged-in employee
    const employee = employees.find(e => e.id === currentEmployeeId);
    const contract = employee?.contract || {};

    // Check if employee has a generated contract
    const hasGeneratedContract = !!contract.generatedContract;
    const templateUsed = contractTemplates.find(t => t.id === contract.templateId);

    // Generate a live preview using the default template if none saved
    const [previewContent, setPreviewContent] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState('');

    const handleGeneratePreview = () => {
        const templateId = previewTemplate || contractTemplates.find(t => t.isDefault)?.id;
        if (templateId) {
            const content = generateContract(templateId, currentEmployeeId);
            setPreviewContent(content);
        }
    };

    const handlePrint = (content) => {
        const pw = window.open('', '_blank');
        pw.document.write(`
            <html><head><title>My Employment Contract</title>
            <style>body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; font-size: 14px; white-space: pre-wrap; }</style>
            </head><body>${content}</body></html>
        `);
        pw.document.close();
        pw.print();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Contract</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>View your employment contract details.</p>
            </div>

            {/* Contract Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Contract Type</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{contract.type || 'N/A'}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Start Date</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{contract.startDate || 'N/A'}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>End Date</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{contract.endDate || 'Open-ended'}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {contract.endDate && new Date(contract.endDate) < new Date() ? (
                            <><Clock size={16} style={{ color: 'var(--color-error)' }} /><span style={{ fontWeight: 700, color: 'var(--color-error)' }}>Expired</span></>
                        ) : (
                            <><CheckCircle size={16} style={{ color: 'var(--color-success)' }} /><span style={{ fontWeight: 700, color: 'var(--color-success)' }}>Active</span></>
                        )}
                    </div>
                </Card>
            </div>

            {/* Compensation Summary */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Compensation Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-primary-50)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>Basic Salary</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{contract.basicSalary?.toLocaleString() || 0} {contract.currency || 'JOD'}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-slate-50)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Housing</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(contract.housingAllowance || 0).toLocaleString()} {contract.currency || 'JOD'}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-slate-50)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Transportation</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(contract.transportationAllowance || 0).toLocaleString()} {contract.currency || 'JOD'}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-success-dim)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>Total</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                            {((contract.basicSalary || 0) + (contract.housingAllowance || 0) + (contract.transportationAllowance || 0) + (contract.otherAllowance || 0)).toLocaleString()} {contract.currency || 'JOD'}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Contract Document */}
            <Card className="padding-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Employment Contract</h3>
                            {templateUsed && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Template: {templateUsed.name}</p>}
                        </div>
                    </div>
                </div>

                {hasGeneratedContract ? (
                    <div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Button variant="outline" size="sm" icon={<Copy size={14} />} onClick={() => navigator.clipboard.writeText(contract.generatedContract)}>Copy</Button>
                            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => handlePrint(contract.generatedContract)}>Print</Button>
                        </div>
                        <div style={{
                            padding: '2rem', borderRadius: '8px', border: '1px solid var(--color-border)',
                            background: 'white', fontFamily: "'Times New Roman', serif",
                            fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap',
                            maxHeight: '600px', overflow: 'auto'
                        }}>
                            {contract.generatedContract}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '2rem', borderRadius: '8px', border: '2px dashed var(--color-border)',
                        textAlign: 'center', background: 'var(--color-slate-50)'
                    }}>
                        <FileText size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>No contract document generated yet</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Please contact HR to generate your contract document.
                        </p>
                    </div>
                )}
            </Card>

            {/* Leave Entitlements */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Leave Entitlements</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-primary-50)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>Annual Leave</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{contract.annualLeaveEntitlement || 14}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Days per year</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-slate-50)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sick Leave</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>14</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Days (full pay)</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MyContract;
