import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const formatStatusLabel = (apiContract, t) => {
    if (!apiContract) return { label: t('common:notAvailable'), expired: false };
    const raw = (apiContract.status || '').toLowerCase();
    const expiredByStatus = raw === 'expired' || raw === 'terminated';
    const expiredByDate = isEndDateInPast(apiContract.end_date);
    const expired = expiredByStatus || expiredByDate;
    if (expired) return { label: t('employee:contract.statusExpired'), expired: true };
    if (raw === 'active') return { label: t('employee:contract.statusActive'), expired: false };
    if (raw) {
        return {
            label: raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            expired: false,
        };
    }
    return { label: t('common:notAvailable'), expired: false };
};

const MyContract = () => {
    const { t } = useTranslation(['employee', 'common']);
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
        if (apiContract) return formatStatusLabel(apiContract, t);
        if (contract.endDate && isEndDateInPast(contract.endDate)) {
            return { label: t('employee:contract.statusExpired'), expired: true };
        }
        return { label: t('employee:contract.statusActive'), expired: false };
    }, [apiContract, contract.endDate, t]);

    // Check if employee has a generated contract (context) or API document URL
    const hasGeneratedContract = !!contract.generatedContract;
    const apiDocumentUrl = apiContract?.document && String(apiContract.document).trim();

    const handlePrint = (content) => {
        const pw = window.open('', '_blank');
        pw.document.write(`
            <html><head><title>${t('employee:contract.printTitle')}</title>
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
                title={t('employee:contract.loadError')}
                onRefresh={() => myContractQuery.refetch()}
                refreshLabel={t('common:actions.retry')}
            />
        );
    }

    if (myContractQuery.isSuccess && !hasApiContract && !employee) {
        return <NoData label={t('employee:empty.contract')} />;
    }

    const displayType =
        apiContract?.contract_type_display ||
        apiContract?.contract_type ||
        contract.type ||
        t('common:notAvailable');
    const displayStart =
        hasApiContract && apiContract.start_date
            ? formatDate(apiContract.start_date) || t('common:notAvailable')
            : contract.startDate
              ? formatDate(contract.startDate) || contract.startDate
              : t('common:notAvailable');
    const displayEnd =
        hasApiContract && apiContract.end_date
            ? formatDate(apiContract.end_date)
            : contract.endDate
              ? formatDate(contract.endDate) || contract.endDate
              : t('employee:contract.openEnded');
    const annualLeaveDays =
        apiContract?.annual_leave_days ?? contract.annualLeaveEntitlement ?? 14;

    const showCompensationBreakdown =
        typeof contract.basicSalary === 'number' ||
        typeof contract.housingAllowance === 'number' ||
        typeof contract.transportationAllowance === 'number';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('employee:contract.title')}</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>{t('employee:contract.subtitle')}</p>
            </div>

            {/* Contract Summary (API) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{t('employee:contract.contractType')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayType}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{t('employee:contract.startDate')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayStart}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{t('employee:contract.endDate')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{displayEnd}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{t('employee:contract.status')}</div>
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
                                <strong style={{ color: 'var(--color-text-main)' }}>{t('employee:contract.created')}</strong>{' '}
                                {formatDate(apiContract.created_at)}
                            </span>
                        )}
                        {apiContract.updated_at && (
                            <span>
                                <strong style={{ color: 'var(--color-text-main)' }}>{t('employee:contract.lastUpdated')}</strong>{' '}
                                {formatDate(apiContract.updated_at)}
                            </span>
                        )}
                    </div>
                </Card>
            )}

            {/* Compensation Summary (context mock — not returned by contract API) */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{t('employee:contract.compensationSummary')}</h3>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: 500 }}>{t('employee:contract.basicSalary')}</div>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('employee:contract.housing')}</div>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('employee:contract.transportation')}</div>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>{t('employee:contract.total')}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {((contract.basicSalary || 0) + (contract.housingAllowance || 0) + (contract.transportationAllowance || 0) + (contract.otherAllowance || 0)).toLocaleString()}{' '}
                                {contract.currency || 'JOD'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {t('employee:contract.compensationUnavailable')}
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
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('employee:contract.employmentContract')}</h3>
                            {(templateUsed || apiContract?.template) && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {t('employee:contract.template')}{' '}
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
                            {t('employee:contract.downloadDocument')}
                        </Button>
                    </div>
                ) : hasGeneratedContract ? (
                    <div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Button variant="outline" size="sm" icon={<Copy size={14} />} onClick={() => navigator.clipboard.writeText(contract.generatedContract)}>{t('employee:contract.copy')}</Button>
                            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => handlePrint(contract.generatedContract)}>{t('employee:contract.print')}</Button>
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
                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{t('employee:contract.noDocumentTitle')}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {t('employee:contract.noDocumentHint')}
                        </p>
                    </div>
                )}
            </Card>

            {/* Leave Entitlements */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('employee:contract.leaveEntitlements')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
                            border: '1px solid color-mix(in srgb, var(--color-primary-500) 35%, var(--color-border))',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)' }}>{t('employee:contract.annualLeave')}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{annualLeaveDays}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('employee:contract.daysPerYear')}</div>
                    </div>
                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('employee:contract.sickLeave')}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>14</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('employee:contract.sickLeaveFullPay')}</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MyContract;
