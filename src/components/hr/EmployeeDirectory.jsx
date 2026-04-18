import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Mail, MoreHorizontal, Search, Settings, UserPlus, Users } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
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
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const humanizeContractType = (value) =>
    !value ? '—' : String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const PAYROLL_BREAKDOWN = {
    totalBasic: 17000,
    totalNet: 16797.5,
    currency: 'JOD',
    byDepartment: [
        { name: 'Executive Management', amount: 8700 },
        { name: 'Sales & Marketing', amount: 4300 },
        { name: 'Engineering', amount: 4000 },
    ],
};

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

const EmployeeDirectory = () => {
    const navigate = useNavigate();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterPos, setFilterPos] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(id);
    }, [searchTerm]);

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
    const maxDeptPayroll = useMemo(
        () => Math.max(...PAYROLL_BREAKDOWN.byDepartment.map((d) => d.amount), 1),
        []
    );

    const isLoading = employeesQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading;
    const hasError = employeesQuery.isError || departmentsQuery.isError || positionsQuery.isError;

    const handleRefresh = async () => {
        await Promise.all([employeesQuery.refetch(), departmentsQuery.refetch(), positionsQuery.refetch()]);
    };

    const handleExpiringRefresh = async () => {
        await expiringContractsQuery.refetch();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
                <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Contracts Expiring Soon</h3>
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Action required within 30 days.
                            </p>
                        </div>
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '1rem',
                                background: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                color: 'var(--color-warning)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {expiringContractsQuery.isLoading ? '…' : `${expiringContracts.length} Pending`}
                        </span>
                    </div>

                    {expiringContractsQuery.isLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                            <Spinner />
                        </div>
                    )}

                    {expiringContractsQuery.isError && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, color: 'var(--color-error)', fontSize: '0.875rem' }}>Could not load expiring contracts.</p>
                            <Button variant="outline" type="button" onClick={handleExpiringRefresh}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {!expiringContractsQuery.isLoading && !expiringContractsQuery.isError && expiringContracts.length === 0 && (
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No contracts expiring soon.</p>
                    )}

                    {!expiringContractsQuery.isLoading && !expiringContractsQuery.isError && expiringContracts.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(80px, 0.8fr) minmax(100px, 1fr) auto',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-secondary)',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <span>Employee</span>
                                <span>Type</span>
                                <span>Expires In</span>
                                <span aria-hidden style={{ width: '4.5rem' }} />
                            </div>
                            {expiringContracts.map((row) => (
                                <div
                                    key={row.id || `${row.employeeId}-${row.endDate}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(80px, 0.8fr) minmax(100px, 1fr) auto',
                                        gap: '0.75rem',
                                        alignItems: 'center',
                                        padding: '0.85rem 0',
                                        borderBottom: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{row.employeeName}</p>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            {departmentsMap.get(row.department) || row.department || '—'}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '0.875rem' }}>{humanizeContractType(row.contractType)}</span>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>
                                            {row.daysRemaining != null ? `${row.daysRemaining} days` : '—'}
                                        </p>
                                        {row.endDate && (
                                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
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
                                        onClick={() => row.employeeId && navigate(`/admin/hr/employees/${row.employeeId}`)}
                                    >
                                        Renew
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Monthly Payroll Breakdown</h3>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Estimated recurring cost (Active Employees).
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Total Basic Salaries</p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
                                {PAYROLL_BREAKDOWN.totalBasic.toLocaleString()} {PAYROLL_BREAKDOWN.currency}
                            </p>
                        </div>
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border))',
                                background: 'var(--color-success-dim)',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Total Net Payable</p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                {PAYROLL_BREAKDOWN.totalNet.toLocaleString()} {PAYROLL_BREAKDOWN.currency}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>Cost by Department</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {PAYROLL_BREAKDOWN.byDepartment.map((dept) => (
                                <div key={dept.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(80px, 2fr) auto', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{dept.name}</span>
                                    <div style={{ height: '8px', borderRadius: '999px', background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(dept.amount / maxDeptPayroll) * 100}%`,
                                                borderRadius: '999px',
                                                background: 'var(--color-primary-600)',
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right', minWidth: '3.5rem' }}>
                                        {dept.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Employee Directory</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                        {employees.length} {employees.length === 1 ? 'member' : 'members'} found
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '280px' }}>
                        <Input
                            placeholder="Search by name or email..."
                            startIcon={<Search size={16} />}
                            style={{ fontSize: '0.875rem' }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button variant="outline" icon={<Settings size={16} />} onClick={() => setIsSettingsModalOpen(true)} title="Evaluation Settings" />
                    <Button icon={<UserPlus size={16} />} onClick={() => navigate('/admin/hr/employees/new')}>
                        Add Employee
                    </Button>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    background: 'var(--color-bg-surface)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--color-text-muted)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Filters:</span>
                </div>

                <select
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '160px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
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
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '160px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
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
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', minWidth: '140px', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
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
                        style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load employees data.</p>
                        <Button variant="outline" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {employees.length === 0 ? (
                        <Card className="padding-lg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                <Users size={18} />
                                <span>No employees match the current filters.</span>
                            </div>
                        </Card>
                    ) : (
                        employees.map((employee) => (
                            <Card
                                key={employee.id}
                                className="padding-md hoverable"
                                onClick={() => navigate(`/admin/hr/employees/${employee.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                        {employee.firstName?.[0] || '?'}
                                        {employee.lastName?.[0] || '?'}
                                    </div>
                                    {/* <Button variant="ghost" size="sm" icon={<MoreHorizontal size={16} />} className="iconOnly" onClick={(event) => event.stopPropagation()} /> */}
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {employee.firstName} {employee.lastName}
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {employee.positionName || positionsMap.get(employee.position) || 'Unknown Position'}
                                </p>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', borderRadius: '1rem' }}>
                                        {employee.departmentName || departmentsMap.get(employee.department) || 'Unknown Department'}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            background: employee.status === 'active' ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                            color: employee.status === 'active' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                            borderRadius: '1rem',
                                        }}
                                    >
                                        {humanizeStatus(employee.status)}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={14} /> {employee.email || 'No email'}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <EvaluationSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
        </div>
    );
};

export default EmployeeDirectory;
