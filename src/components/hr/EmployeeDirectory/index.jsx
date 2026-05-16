import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { Check, Copy, Filter, Link2, Mail, MoreHorizontal, Search, Settings, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Modal from '@/components/Shared/Modal';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import EvaluationSettingsModal from '@/components/hr/EvaluationSettingsModal';

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const normalizeEmployee = (item) => {
    const userData = item?.user_data || {};
    const profileData = item?.profile_data || {};
    return {
        id: item?.id || item?.uuid || '',
        firstName: userData?.first_name || item?.first_name || '',
        lastName: userData?.last_name || item?.last_name || '',
        email: userData?.email || item?.email || '',
        department: profileData?.department || item?.department || '',
        departmentName: profileData?.department_name || item?.department_name || '',
        position: profileData?.position || item?.position || '',
        positionName: profileData?.position_name || item?.position_name || '',
        status: (profileData?.status || item?.status || '').toLowerCase(),
    };
};

const normalizeEmployees = (response) => normalizeArrayResponse(response).map(normalizeEmployee);

const normalizeDepartments = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

const normalizePositions = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

const humanizeStatus = (status) => {
    const { t } = useTranslation(['hr', 'common']);

    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const humanizeContractType = (value) =>
    !value ? '—' : String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateLabel = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10);
};

const normalizeExpiringContracts = (response) =>
    normalizeArrayResponse(response).map((item) => {
        const contractData = item?.contract_data || {};
        const employee = item?.employee_data || item?.employee || {};
        const user = employee?.user_data || employee?.user || {};
        const profile = employee?.profile_data || employee?.profile || {};
        const endDate = contractData.end_date || item?.end_date || item?.expiry_date || '';
        const daysFromEnd =
            endDate && !Number.isNaN(new Date(endDate).getTime())
                ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
        return {
            id: item?.id || item?.uuid || '',
            employeeId: employee?.id || item?.employee_id || (typeof item?.employee === 'string' ? item.employee : '') || '',
            employeeName:
                `${user?.first_name || employee?.first_name || ''} ${user?.last_name || employee?.last_name || ''}`.trim() ||
                employee?.full_name ||
                item?.employee_name ||
                'Unknown Employee',
            department:
                profile?.department_name ||
                employee?.department_name ||
                item?.department_name ||
                item?.department ||
                contractData?.department ||
                '',
            contractType: contractData.contract_type || item?.contract_type || item?.type || '',
            endDate,
            daysRemaining: typeof item?.days_remaining === 'number' ? item.days_remaining : daysFromEnd,
        };
    });

const normalizePayrollBreakdown = (response) => {
    const payload = response?.data ?? response ?? {};
    const departmentsRaw =
        payload?.by_department ??
        payload?.department_breakdown ??
        payload?.departments ??
        payload?.cost_by_department ??
        [];

    const byDepartment = Array.isArray(departmentsRaw)
        ? departmentsRaw.map((item) => ({
            name: item?.name ?? item?.department_name ?? item?.department ?? 'Unknown',
            amount: Number(item?.amount ?? item?.total ?? item?.value ?? item?.total_net ?? item?.cost ?? 0) || 0,
            percentage: Number(item?.percentage_of_total ?? item?.percentage ?? 0) || 0,
        }))
        : [];

    return {
        totalBasic: Number(payload?.total_basic ?? payload?.total_basic_salaries ?? payload?.basic_total ?? 0) || 0,
        totalNet: Number(payload?.total_net ?? payload?.total_net_payable ?? payload?.net_total ?? 0) || 0,
        currency: payload?.currency ?? 'USD',
        subtitle: payload?.subtitle ?? 'Estimated recurring cost (Active Employees).',
        byDepartment,
    };
};

const EmployeeDirectory = () => {

    const navigate = useNavigate();
    const basePath = useBasePath();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterPos, setFilterPos] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isCompactDirectoryHeader, setIsCompactDirectoryHeader] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < 1200
    );
    const [isPayrollBreakdownSingleColumn, setIsPayrollBreakdownSingleColumn] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < 600
    );
    const [isNarrowEmployeeCards, setIsNarrowEmployeeCards] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < 500
    );

    const companyName = useMemo(() => {
        try {
            const raw = localStorage.getItem('auth_user');
            if (!raw) return '';
            const parsed = JSON.parse(raw);
            return String(parsed?.user?.company_name || '').trim();
        } catch {
            return '';
        }
    }, []);

    const employeeLoginUrl = useMemo(() => {
        if (!companyName) return '';
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        return `${base}/auth/signin/${encodeURIComponent(companyName)}`;
    }, [companyName]);

    const handleCopyEmployeeLoginUrl = async () => {
        if (!employeeLoginUrl) return;
        try {
            await navigator.clipboard.writeText(employeeLoginUrl);
            setIsCopied(true);
            toast.success(t('employeeDirectory.loginLinkCopied'));
            setTimeout(() => setIsCopied(false), 1600);
        } catch {
            toast.error(t('employeeDirectory.loginLinkCopyFailed'));
        }
    };

    useEffect(() => {
        if (!isLinkModalOpen) setIsCopied(false);
    }, [isLinkModalOpen]);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(id);
    }, [searchTerm]);

    useEffect(() => {
        const handleResize = () => {
            setIsCompactDirectoryHeader(window.innerWidth < 1200);
            setIsPayrollBreakdownSingleColumn(window.innerWidth < 600);
            setIsNarrowEmployeeCards(window.innerWidth < 500);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const departmentParam = filterDept === 'All' ? '' : filterDept;
    const positionParam = filterPos === 'All' ? '' : filterPos;
    const statusParam = filterStatus === 'All' ? '' : filterStatus.toLowerCase();
    const searchParam = debouncedSearch;

    const queryParams = new URLSearchParams();
    if (departmentParam) queryParams.append('department', departmentParam);
    if (positionParam) queryParams.append('position', positionParam);
    if (statusParam) queryParams.append('status', statusParam);
    if (searchParam) queryParams.append('search', searchParam);
    const employeesUrl = `/api/hr/employees/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const employeesQuery = useCustomQuery(employeesUrl, ['hr-employees', departmentParam, positionParam, statusParam, searchParam], {
        select: normalizeEmployees,
    });

    const departmentsQuery = useCustomQuery('/api/hr/departments/', ['hr-departments'], {
        select: normalizeDepartments,
    });

    const positionsQuery = useCustomQuery('/api/hr/positions/', ['hr-positions'], {
        select: normalizePositions,
    });

    const expiringContractsQuery = useCustomQuery('/api/hr/contracts/expiring-soon/', ['hr-contracts-expiring-soon'], {
        select: normalizeExpiringContracts,
    });
    const payrollBreakdownQuery = useCustomQuery('/api/hr/payroll/monthly-breakdown/', ['hr-payroll-monthly-breakdown'], {
        select: normalizePayrollBreakdown,
    });

    const employees = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);
    const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
    const positions = useMemo(() => positionsQuery.data ?? [], [positionsQuery.data]);

    const departmentsMap = useMemo(
        () => new Map(departments.map((department) => [department.id, department.name])),
        [departments]
    );
    const positionsMap = useMemo(
        () => new Map(positions.map((position) => [position.id, position.name])),
        [positions]
    );

    const expiringContracts = useMemo(() => expiringContractsQuery.data ?? [], [expiringContractsQuery.data]);
    const payrollBreakdown = useMemo(
        () =>
            payrollBreakdownQuery.data ?? {
                totalBasic: 0,
                totalNet: 0,
                currency: 'USD',
                subtitle: 'Estimated recurring cost (Active Employees).',
                byDepartment: [],
            },
        [payrollBreakdownQuery.data]
    );
    const maxDeptPayroll = useMemo(
        () => Math.max(...payrollBreakdown.byDepartment.map((d) => d.amount), 1),
        [payrollBreakdown.byDepartment]
    );

    const isLoading = employeesQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading;
    const hasError = employeesQuery.isError || departmentsQuery.isError || positionsQuery.isError;

    const handleRefresh = async () => {
        await Promise.all([employeesQuery.refetch(), departmentsQuery.refetch(), positionsQuery.refetch()]);
    };

    const handleExpiringRefresh = async () => {
        await expiringContractsQuery.refetch();
    };

    const expiringGridCols = isNarrowEmployeeCards
        ? 'minmax(72px, 1.35fr) minmax(52px, 0.65fr) minmax(68px, 1fr) auto'
        : 'minmax(140px, 1.4fr) minmax(80px, 0.8fr) minmax(100px, 1fr) auto';

    const deptPayrollGridCols = isNarrowEmployeeCards
        ? 'minmax(72px, 1fr) minmax(56px, 1.6fr) auto'
        : 'minmax(100px, 1fr) minmax(80px, 2fr) auto';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isNarrowEmployeeCards ? '1.25rem' : '2rem' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isNarrowEmployeeCards ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(420px, 1fr))',
                    gap: isNarrowEmployeeCards ? '0.65rem' : '1rem',
                }}
            >
                <Card
                    padding={isNarrowEmployeeCards ? 'sm' : 'lg'}
                    style={{ display: 'flex', flexDirection: 'column', gap: isNarrowEmployeeCards ? '0.65rem' : '1rem' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: isNarrowEmployeeCards ? '0.5rem' : '1rem',
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: isNarrowEmployeeCards ? '0.95rem' : '1.2rem',
                                    fontWeight: 600,
                                    lineHeight: isNarrowEmployeeCards ? 1.25 : undefined,
                                }}
                            >
                                Contracts Expiring Soon
                            </h3>
                            <p
                                style={{
                                    margin: isNarrowEmployeeCards ? '0.2rem 0 0' : '0.35rem 0 0',
                                    fontSize: isNarrowEmployeeCards ? '0.75rem' : '0.95rem',
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: isNarrowEmployeeCards ? 1.35 : undefined,
                                }}
                            >
                                Action required within 30 days.
                            </p>
                        </div>
                        <span
                            style={{
                                fontSize: isNarrowEmployeeCards ? '0.65rem' : '0.8125rem',
                                fontWeight: 600,
                                padding: isNarrowEmployeeCards ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
                                borderRadius: '1rem',
                                background: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                color: 'var(--color-warning)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            {expiringContractsQuery.isLoading ? '…' : `${expiringContracts.length} Pending`}
                        </span>
                    </div>

                    {expiringContractsQuery.isLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: isNarrowEmployeeCards ? '1rem 0' : '1.5rem 0' }}>
                            <Spinner />
                        </div>
                    )}

                    {expiringContractsQuery.isError && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isNarrowEmployeeCards ? '0.5rem' : '0.75rem',
                                alignItems: 'flex-start',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    color: 'var(--color-error)',
                                    fontSize: isNarrowEmployeeCards ? '0.78rem' : '0.95rem',
                                }}
                            >
                                Could not load expiring contracts.
                            </p>
                            <Button variant="outline" type="button" onClick={handleExpiringRefresh}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {!expiringContractsQuery.isLoading && !expiringContractsQuery.isError && expiringContracts.length === 0 && (
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--color-text-secondary)',
                                fontSize: isNarrowEmployeeCards ? '0.78rem' : '0.95rem',
                            }}
                        >
                            No contracts expiring soon.
                        </p>
                    )}

                    {!expiringContractsQuery.isLoading && !expiringContractsQuery.isError && expiringContracts.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: expiringGridCols,
                                    gap: isNarrowEmployeeCards ? '0.4rem' : '0.75rem',
                                    alignItems: 'center',
                                    fontSize: isNarrowEmployeeCards ? '0.65rem' : '0.8125rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-secondary)',
                                    paddingBottom: isNarrowEmployeeCards ? '0.35rem' : '0.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <span>Employee</span>
                                <span>Type</span>
                                <span>Expires In</span>
                                <span>Action</span>
                            </div>
                            {expiringContracts.map((row) => (
                                <div
                                    key={row.id || `${row.employeeId}-${row.endDate}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: expiringGridCols,
                                        gap: isNarrowEmployeeCards ? '0.4rem' : '0.75rem',
                                        alignItems: 'center',
                                        padding: isNarrowEmployeeCards ? '0.5rem 0' : '0.85rem 0',
                                        borderBottom: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontWeight: 600,
                                                fontSize: isNarrowEmployeeCards ? '0.72rem' : '0.9375rem',
                                                lineHeight: 1.25,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {row.employeeName}
                                        </p>
                                        <p
                                            style={{
                                                margin: '0.15rem 0 0',
                                                fontSize: isNarrowEmployeeCards ? '0.65rem' : '0.9375rem',
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            {departmentsMap.get(row.department) || row.department || '—'}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: isNarrowEmployeeCards ? '0.7rem' : '0.9375rem', lineHeight: 1.2 }}>
                                        {humanizeContractType(row.contractType)}
                                    </span>
                                    <div>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontWeight: 700,
                                                fontSize: isNarrowEmployeeCards ? '0.72rem' : '0.9375rem',
                                            }}
                                        >
                                            {row.daysRemaining != null ? `${row.daysRemaining} days` : '—'}
                                        </p>
                                        {row.endDate && (
                                            <p
                                                style={{
                                                    margin: '0.12rem 0 0',
                                                    fontSize: isNarrowEmployeeCards ? '0.62rem' : '0.9375rem',
                                                    color: 'var(--color-text-secondary)',
                                                }}
                                            >
                                                {formatDateLabel(row.endDate)}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        className="cursor-pointer"
                                        disabled={!row.employeeId}
                                        style={
                                            isNarrowEmployeeCards
                                                ? { fontSize: '0.7rem', padding: '0.25rem 0.45rem', minHeight: 'auto' }
                                                : undefined
                                        }
                                        onClick={() => row.employeeId && navigate(`${basePath}/hr/employees/${row.employeeId}`)}
                                    >
                                        Renew
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card
                    padding={isNarrowEmployeeCards ? 'sm' : 'lg'}
                    style={{ display: 'flex', flexDirection: 'column', gap: isNarrowEmployeeCards ? '0.75rem' : '1.25rem' }}
                >
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: isNarrowEmployeeCards ? '0.95rem' : '1.2rem',
                                fontWeight: 600,
                                lineHeight: isNarrowEmployeeCards ? 1.25 : undefined,
                            }}
                        >
                            Monthly Payroll Breakdown
                        </h3>
                        <p
                            style={{
                                margin: isNarrowEmployeeCards ? '0.2rem 0 0' : '0.35rem 0 0',
                                fontSize: isNarrowEmployeeCards ? '0.75rem' : '0.95rem',
                                color: 'var(--color-text-secondary)',
                                lineHeight: isNarrowEmployeeCards ? 1.35 : undefined,
                            }}
                        >
                            {payrollBreakdown.subtitle}
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                isNarrowEmployeeCards || isPayrollBreakdownSingleColumn ? '1fr' : '1fr 1fr',
                            gap: isNarrowEmployeeCards ? '0.5rem' : '0.75rem',
                        }}
                    >
                        <div
                            style={{
                                padding: isNarrowEmployeeCards ? '0.65rem' : '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: isNarrowEmployeeCards ? '0.68rem' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                Total Basic Salaries
                            </p>
                            <p
                                style={{
                                    margin: isNarrowEmployeeCards ? '0.35rem 0 0' : '0.5rem 0 0',
                                    fontSize: isNarrowEmployeeCards ? '1.05rem' : '1.375rem',
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                }}
                            >
                                {payrollBreakdown.totalBasic.toLocaleString()} {payrollBreakdown.currency}
                            </p>
                        </div>
                        <div
                            style={{
                                padding: isNarrowEmployeeCards ? '0.65rem' : '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border))',
                                background: 'var(--color-success-dim)',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: isNarrowEmployeeCards ? '0.68rem' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                Total Net Payable
                            </p>
                            <p
                                style={{
                                    margin: isNarrowEmployeeCards ? '0.35rem 0 0' : '0.5rem 0 0',
                                    fontSize: isNarrowEmployeeCards ? '1.05rem' : '1.375rem',
                                    fontWeight: 700,
                                    color: 'var(--color-success)',
                                    lineHeight: 1.2,
                                }}
                            >
                                {payrollBreakdown.totalNet.toLocaleString()} {payrollBreakdown.currency}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p
                            style={{
                                margin: isNarrowEmployeeCards ? '0 0 0.5rem' : '0 0 0.75rem',
                                fontSize: isNarrowEmployeeCards ? '0.78rem' : '0.9375rem',
                                fontWeight: 600,
                            }}
                        >
                            Cost by Department
                        </p>
                        {payrollBreakdownQuery.isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: isNarrowEmployeeCards ? '0.65rem 0' : '1rem 0' }}>
                                <Spinner />
                            </div>
                        )}
                        {payrollBreakdownQuery.isError && (
                            <p
                                style={{
                                    margin: 0,
                                    color: 'var(--color-error)',
                                    fontSize: isNarrowEmployeeCards ? '0.78rem' : '0.95rem',
                                }}
                            >
                                Could not load payroll breakdown.
                            </p>
                        )}
                        {!payrollBreakdownQuery.isLoading && !payrollBreakdownQuery.isError && payrollBreakdown.byDepartment.length === 0 && (
                            <p
                                style={{
                                    margin: 0,
                                    color: 'var(--color-text-secondary)',
                                    fontSize: isNarrowEmployeeCards ? '0.78rem' : '0.95rem',
                                }}
                            >
                                No department payroll data available.
                            </p>
                        )}
                        {!payrollBreakdownQuery.isLoading && !payrollBreakdownQuery.isError && payrollBreakdown.byDepartment.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: isNarrowEmployeeCards ? '0.5rem' : '0.85rem' }}>
                                {payrollBreakdown.byDepartment.map((dept) => (
                                    <div
                                        key={dept.name}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: deptPayrollGridCols,
                                            gap: isNarrowEmployeeCards ? '0.45rem' : '0.75rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: isNarrowEmployeeCards ? '0.72rem' : '0.9375rem',
                                                color: 'var(--color-text-secondary)',
                                                minWidth: 0,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {dept.name}
                                        </span>
                                        <div
                                            style={{
                                                height: isNarrowEmployeeCards ? '6px' : '8px',
                                                borderRadius: '999px',
                                                background: 'var(--color-bg-subtle)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${dept.percentage > 0 ? dept.percentage : (dept.amount / maxDeptPayroll) * 100}%`,
                                                    borderRadius: '999px',
                                                    background: 'var(--color-primary-600)',
                                                }}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: isNarrowEmployeeCards ? '0.72rem' : '0.9375rem',
                                                fontWeight: 600,
                                                textAlign: 'right',
                                                minWidth: isNarrowEmployeeCards ? '2.75rem' : '3.5rem',
                                            }}
                                        >
                                            {dept.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: isCompactDirectoryHeader ? 'column' : 'row',
                    justifyContent: isCompactDirectoryHeader ? 'flex-start' : 'space-between',
                    alignItems: isCompactDirectoryHeader ? 'stretch' : 'center',
                    gap: '1rem',
                }}
            >
                <div style={{ alignSelf: isCompactDirectoryHeader ? 'flex-start' : undefined, minWidth: 0 }}>
                    <h2
                        style={{
                            fontSize: isNarrowEmployeeCards ? '1.25rem' : '1.375rem',
                            fontWeight: 600,
                            margin: 0,
                        }}
                    >
                        Employee Directory
                    </h2>
                    <p
                        style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                            marginTop: '0.35rem',
                        }}
                    >
                        {employees.length} {employees.length === 1 ? 'member' : 'members'} found
                    </p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: isCompactDirectoryHeader ? 'wrap' : 'nowrap',
                        justifyContent: isCompactDirectoryHeader ? 'flex-end' : 'flex-start',
                        alignSelf: isCompactDirectoryHeader ? 'flex-end' : undefined,
                        width: isCompactDirectoryHeader ? '100%' : undefined,
                    }}
                >
                    <div style={{ width: isCompactDirectoryHeader ? 'min(100%, 280px)' : '280px', flexShrink: 0 }}>
                        <Input
                            placeholder="Search by name or email..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem' }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button variant="outline" icon={<Settings size={16} />} onClick={() => setIsSettingsModalOpen(true)} title={t('evaluationSettings.title')} />
                    <Button
                        variant="outline"
                        icon={<Link2 size={16} />}
                        onClick={() => setIsLinkModalOpen(true)}
                        className="cursor-pointer"
                        title="Employee login link"
                    >
                        Login Link
                    </Button>
                    <Button icon={<UserPlus size={16} />} onClick={() => navigate(`${basePath}/hr/employees/new`)}>
                        Add Employee
                    </Button>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    background: 'var(--color-bg-surface)',
                    padding: isNarrowEmployeeCards ? '0.85rem' : '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--color-text-muted)" />
                    <span
                        style={{
                            fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        Filters:
                    </span>
                </div>

                <select
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                        minWidth: '160px',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                    }}
                    value={filterDept}
                    onChange={(event) => setFilterDept(event.target.value)}
                >
                    <option value="All">All Departments</option>
                    {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                            {department.name}
                        </option>
                    ))}
                </select>

                <select
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                        minWidth: '160px',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                    }}
                    value={filterPos}
                    onChange={(event) => setFilterPos(event.target.value)}
                >
                    <option value="All">All Positions</option>
                    {positions.map((position) => (
                        <option key={position.id} value={position.id}>
                            {position.name}
                        </option>
                    ))}
                </select>

                <select
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                        minWidth: '140px',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                    }}
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                </select>

                {(searchTerm || filterDept !== 'All' || filterPos !== 'All' || filterStatus !== 'All') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterDept('All');
                            setFilterPos('All');
                            setFilterStatus('All');
                        }}
                        style={{
                            color: 'var(--color-text-muted)',
                            fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                        }}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--color-error)',
                                fontSize: isNarrowEmployeeCards ? '0.875rem' : '1rem',
                            }}
                        >
                            Could not load employees data.
                        </p>
                        <Button variant="outline" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            employees.length === 0 || isNarrowEmployeeCards
                                ? 'minmax(0, 1fr)'
                                : 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: isNarrowEmployeeCards ? '0.65rem' : '1.5rem',
                    }}
                >
                    {employees.length === 0 ? (
                        <Card className="padding-lg">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: isNarrowEmployeeCards ? '0.875rem' : '0.9375rem',
                                }}
                            >
                                <Users size={18} />
                                <span>No employees match the current filters.</span>
                            </div>
                        </Card>
                    ) : (
                        employees.map((employee) => (
                            <Card
                                key={employee.id}
                                padding={isNarrowEmployeeCards ? 'sm' : 'md'}
                                hoverable
                                onClick={() => navigate(`${basePath}/hr/employees/${employee.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'start',
                                        marginBottom: isNarrowEmployeeCards ? '0.5rem' : '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: isNarrowEmployeeCards ? '2.25rem' : '3rem',
                                            height: isNarrowEmployeeCards ? '2.25rem' : '3rem',
                                            borderRadius: '50%',
                                            background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))',
                                            color: 'var(--color-primary-600)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            fontSize: isNarrowEmployeeCards ? '0.7rem' : '1rem',
                                        }}
                                    >
                                        {employee.firstName?.[0] || '?'}
                                        {employee.lastName?.[0] || '?'}
                                    </div>
                                    {/* <Button variant="ghost" size="sm" icon={<MoreHorizontal size={16} />} className="iconOnly" onClick={(event) => event.stopPropagation()} /> */}
                                </div>

                                <h3
                                    style={{
                                        fontSize: isNarrowEmployeeCards ? '0.95rem' : '1.2rem',
                                        fontWeight: 600,
                                        marginBottom: isNarrowEmployeeCards ? '0.15rem' : '0.25rem',
                                        lineHeight: isNarrowEmployeeCards ? 1.25 : undefined,
                                    }}
                                >
                                    {employee.firstName} {employee.lastName}
                                </h3>
                                <p
                                    style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: isNarrowEmployeeCards ? '0.78rem' : '1rem',
                                        marginBottom: isNarrowEmployeeCards ? '0.35rem' : '0.5rem',
                                        lineHeight: isNarrowEmployeeCards ? 1.3 : undefined,
                                    }}
                                >
                                    {employee.positionName || positionsMap.get(employee.position) || 'Unknown Position'}
                                </p>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: isNarrowEmployeeCards ? '0.35rem' : '0.5rem',
                                        marginBottom: isNarrowEmployeeCards ? '0.5rem' : '1rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isNarrowEmployeeCards ? '0.65rem' : '0.875rem',
                                            padding: isNarrowEmployeeCards ? '0.15rem 0.4rem' : '0.25rem 0.5rem',
                                            background: 'var(--color-bg-subtle)',
                                            color: 'var(--color-text-secondary)',
                                            borderRadius: '1rem',
                                        }}
                                    >
                                        {employee.departmentName || departmentsMap.get(employee.department) || 'Unknown Department'}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isNarrowEmployeeCards ? '0.65rem' : '0.875rem',
                                            padding: isNarrowEmployeeCards ? '0.15rem 0.4rem' : '0.25rem 0.5rem',
                                            background: employee.status === 'active' ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                            color: employee.status === 'active' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                            borderRadius: '1rem',
                                        }}
                                    >
                                        {humanizeStatus(employee.status)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: isNarrowEmployeeCards ? '0.35rem' : '0.5rem',
                                        fontSize: isNarrowEmployeeCards ? '0.72rem' : '0.9375rem',
                                        color: 'var(--color-text-muted)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Mail size={isNarrowEmployeeCards ? 12 : 16} /> {employee.email || 'No email'}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <EvaluationSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title="Employee Login Link"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        Share this link with your employees. They can click it to open their company sign-in page.
                    </p>

                    {employeeLoginUrl ? (
                        <div
                            className="loginLinkRow"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.65rem 0.85rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <a
                                href={employeeLoginUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="loginLinkAnchor"
                                style={{
                                    flex: 1,
                                    color: 'var(--color-primary-600)',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    wordBreak: 'break-all',
                                    padding: '0.25rem 0',
                                }}
                            >
                                {employeeLoginUrl}
                            </a>
                            <button
                                type="button"
                                onClick={handleCopyEmployeeLoginUrl}
                                className={`loginLinkCopy${isCopied ? ' is-copied' : ''}`}
                                aria-label={isCopied ? 'Link copied' : 'Copy login link'}
                            >
                                <span className="loginLinkCopyIcon">
                                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                </span>
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '0.85rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px dashed var(--color-border)',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.875rem',
                            }}
                        >
                            Company name not found in localStorage.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                        <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)} className="cursor-pointer">{t('common:actions.close')}</Button>
                    </div>
                </div>

                <style>{`
                    .loginLinkAnchor {
                        position: relative;
                        transition: color 0.2s ease, transform 0.2s ease, letter-spacing 0.2s ease;
                        display: inline-block;
                    }
                    .loginLinkAnchor::after {
                        content: '';
                        position: absolute;
                        left: 0;
                        bottom: 0;
                        height: 1px;
                        width: 0;
                        background: currentColor;
                        transition: width 0.25s ease;
                    }
                    .loginLinkAnchor:hover {
                        color: var(--color-primary-700);
                        transform: translateX(2px);
                    }
                    .loginLinkAnchor:hover::after { width: 100%; }

                    .loginLinkCopy {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.4rem;
                        padding: 0.5rem 0.85rem;
                        border-radius: var(--radius-md);
                        border: 1px solid var(--color-border);
                        background: var(--color-bg-card);
                        color: var(--color-text-main);
                        font-size: 0.85rem;
                        font-weight: 500;
                        cursor: pointer;
                        white-space: nowrap;
                        transition:
                            transform 0.18s ease,
                            background 0.18s ease,
                            color 0.18s ease,
                            border-color 0.18s ease,
                            box-shadow 0.18s ease;
                    }
                    .loginLinkCopy:hover {
                        transform: translateY(-1px);
                        background: var(--color-primary-50);
                        color: var(--color-primary-700);
                        border-color: var(--color-primary-600);
                        box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary-600) 18%, transparent);
                    }
                    [data-theme="dark"] .loginLinkCopy:hover {
                        background: rgba(99, 102, 241, 0.12);
                    }
                    .loginLinkCopy:active { transform: translateY(0); }
                    .loginLinkCopy.is-copied {
                        background: var(--color-success-dim);
                        color: var(--color-success);
                        border-color: color-mix(in srgb, var(--color-success) 50%, var(--color-border));
                        animation: copyPulse 0.55s ease;
                    }
                    .loginLinkCopy.is-copied .loginLinkCopyIcon {
                        animation: copyIconPop 0.45s ease;
                    }
                    .loginLinkCopyIcon {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        line-height: 0;
                    }
                    @keyframes copyPulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 45%, transparent); }
                        40% { transform: scale(1.06); box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-success) 0%, transparent); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
                    }
                    @keyframes copyIconPop {
                        0% { transform: scale(0.6) rotate(-12deg); opacity: 0.4; }
                        60% { transform: scale(1.15) rotate(0deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                `}</style>
            </Modal>
        </div>
    );
};

export default EmployeeDirectory;
