import React, { useMemo } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { useHR } from '@/context/HRContext';
import { FileText, Printer, Copy, Download, Clock, CheckCircle } from 'lucide-react';
import useCustomQuery from '@/hooks/useQuery';
import NoData from '@/core/NoData';
import ResourceLoadError from '@/core/ResourceLoadError';
import { MyContractSkeleton } from '@/pages/employee/skeleton';
import formatDate from '@/utils/formatDate';

const isEndDateInPast = (dateStr) => {
    if (!dateStr) return false;
    const end = new Date(dateStr);
    if (Number.isNaN(end.getTime())) return false;
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return end < today;
};

const formatStatusLabel = (apiContract) => {
    if (!apiContract) return { label: 'N/A', expired: false };
    const raw = (apiContract.status || '').toLowerCase();
    const expiredByStatus = raw === 'expired' || raw === 'terminated';
    const expiredByDate = isEndDateInPast(apiContract.end_date);
    const expired = expiredByStatus || expiredByDate;
    if (expired) return { label: 'Expired', expired: true };
    if (raw === 'active') return { label: 'Active', expired: false };
    if (raw) {
        return {
            label: raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            expired: false,
        };
    }
    return { label: 'N/A', expired: false };
};

const MyContract = () => {
    const { employees, contractTemplates } = useHR();
    const currentEmployeeId = 'EMP-002'; // Simulating logged-in employee
    const employee = employees.find(e => e.id === currentEmployeeId);
    const contract = employee?.contract || {};

    const myContractQuery = useCustomQuery('/api/hr/employees/contracts/current/', ['employee-my-contract'], {
        enabled: true,
    });

    const apiContract = myContractQuery.data;
    const hasApiContract = Boolean(apiContract && (apiContract.id || apiContract.start_date));

    const templateUsed = useMemo(() => {
        if (apiContract?.template) {
            return contractTemplates.find((t) => t.id === apiContract.template);
        }
        return contractTemplates.find((t) => t.id === contract.templateId);
    }, [apiContract, contract.templateId, contractTemplates]);

    const statusDisplay = useMemo(() => {
        if (apiContract) return formatStatusLabel(apiContract);
        if (contract.endDate && isEndDateInPast(contract.endDate)) {
            return { label: 'Expired', expired: true };
        }
        return { label: 'Active', expired: false };
    }, [apiContract, contract.endDate]);

    // Check if employee has a generated contract (context) or API document URL
    const hasGeneratedContract = !!contract.generatedContract;
    const apiDocumentUrl = apiContract?.document && String(apiContract.document).trim();

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

    if (myContractQuery.isLoading && !myContractQuery.data) {
        return <MyContractSkeleton />;
    }

    if (myContractQuery.isError) {
        return (
            <ResourceLoadError
                error={myContractQuery.error}
                title="My contract could not be loaded"
                onRefresh={() => myContractQuery.refetch()}
                refreshLabel="Try again"
            />
        );
    }

    if (myContractQuery.isSuccess && !hasApiContract && !employee) {
        return <NoData label="contract" />;
    }

    const displayType =
        apiContract?.contract_type_display ||
        apiContract?.contract_type ||
        contract.type ||
        'N/A';
    const displayStart =
        hasApiContract && apiContract.start_date
            ? formatDate(apiContract.start_date) || 'N/A'
            : contract.startDate
              ? formatDate(contract.startDate) || contract.startDate
              : 'N/A';
    const displayEnd =
        hasApiContract && apiContract.end_date
            ? formatDate(apiContract.end_date)
            : contract.endDate
              ? formatDate(contract.endDate) || contract.endDate
              : 'Open-ended';
    const annualLeaveDays =
        apiContract?.annual_leave_days ?? contract.annualLeaveEntitlement ?? 14;

    const showCompensationBreakdown =
        typeof contract.basicSalary === 'number' ||
        typeof contract.housingAllowance === 'number' ||
        typeof contract.transportationAllowance === 'number';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Contract</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>View your employment contract details.</p>
            </div>

            {/* Contract Summary (API) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Contract Type</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayType}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Start Date</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayStart}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>End Date</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayEnd}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {statusDisplay.expired ? (
                            <>
                                <Clock size={16} style={{ color: 'var(--color-error)' }} />
                                <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>{statusDisplay.label}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{statusDisplay.label}</span>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {hasApiContract && (apiContract.created_at || apiContract.updated_at) && (
                <Card className="padding-md">
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {apiContract.created_at && (
                            <span style={{ marginRight: '1.5rem' }}>
                                <strong style={{ color: 'var(--color-text-main)' }}>Created:</strong>{' '}
                                {formatDate(apiContract.created_at)}
                            </span>
                        )}
                        {apiContract.updated_at && (
                            <span>
                                <strong style={{ color: 'var(--color-text-main)' }}>Last updated:</strong>{' '}
                                {formatDate(apiContract.updated_at)}
                            </span>
                        )}
                    </div>
                </Card>
            )}

            {/* Compensation Summary (context mock — not returned by contract API) */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Compensation Summary</h3>
                {showCompensationBreakdown ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
                                border: '1px solid color-mix(in srgb, var(--color-primary-500) 35%, var(--color-border))',
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: 500 }}>Basic Salary</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {contract.basicSalary?.toLocaleString() || 0} {contract.currency || 'JOD'}
                            </div>
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Housing</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {(contract.housingAllowance || 0).toLocaleString()} {contract.currency || 'JOD'}
                            </div>
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Transportation</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {(contract.transportationAllowance || 0).toLocaleString()} {contract.currency || 'JOD'}
                            </div>
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'color-mix(in srgb, var(--color-success) 20%, var(--color-bg-card))',
                                border: '1px solid color-mix(in srgb, var(--color-success) 40%, var(--color-border))',
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>Total</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {((contract.basicSalary || 0) + (contract.housingAllowance || 0) + (contract.transportationAllowance || 0) + (contract.otherAllowance || 0)).toLocaleString()}{' '}
                                {contract.currency || 'JOD'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        Compensation breakdown is not included in your contract record. Contact HR if you need salary details.
                    </p>
                )}
            </Card>

            {/* Contract Document */}
            <Card className="padding-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '10px',
                                background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
                                border: '1px solid color-mix(in srgb, var(--color-primary-500) 35%, var(--color-border))',
                                color: 'var(--color-primary-500)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Employment Contract</h3>
                            {(templateUsed || apiContract?.template) && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Template:{' '}
                                    {templateUsed?.name ||
                                        (apiContract?.template ? `ID ${apiContract.template.slice(0, 8)}…` : '')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {apiDocumentUrl ? (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            icon={<Download size={14} />}
                            type="button"
                            onClick={() => window.open(apiDocumentUrl, '_blank', 'noopener,noreferrer')}
                        >
                            Download contract document
                        </Button>
                    </div>
                ) : hasGeneratedContract ? (
                    <div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Button variant="outline" size="sm" icon={<Copy size={14} />} onClick={() => navigator.clipboard.writeText(contract.generatedContract)}>Copy</Button>
                            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => handlePrint(contract.generatedContract)}>Print</Button>
                        </div>
                        <div style={{
                            padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', fontFamily: "'Times New Roman', serif",
                            fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap',
                            maxHeight: '600px', overflow: 'auto'
                        }}>
                            {contract.generatedContract}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '2rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-border)',
                        textAlign: 'center', background: 'var(--color-bg-secondary)'
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
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
                            border: '1px solid color-mix(in srgb, var(--color-primary-500) 35%, var(--color-border))',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)' }}>Annual Leave</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{annualLeaveDays}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Days per year</div>
                    </div>
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sick Leave</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>14</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Days (full pay)</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MyContract;
