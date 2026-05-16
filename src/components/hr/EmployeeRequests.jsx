import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { CheckCircle, XCircle, FileText, Calendar, User, Search, Filter } from 'lucide-react';
import Input from '@/components/Shared/Input';
import useCustomQuery from '@/hooks/useQuery';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import Pagination from '@/core/Pagination';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

const EMPTY_ROWS = [];

const selectRequestsPayload = (payload) => {
    if (payload == null) return undefined;
    if (typeof payload !== 'object') {
        return {
            summary: { pending: 0, approved_this_month: 0, rejected: 0 },
            rows: EMPTY_ROWS,
            count: 0,
            next: null,
            previous: null,
        };
    }
    const rows = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.results)
          ? payload.results
          : EMPTY_ROWS;
    const count = typeof payload.count === 'number' ? payload.count : rows.length;
    return {
        summary: {
            pending: payload.summary?.pending ?? 0,
            approved_this_month: payload.summary?.approved_this_month ?? 0,
            rejected: payload.summary?.rejected ?? 0,
        },
        rows,
        count,
        next: payload.next ?? null,
        previous: payload.previous ?? null,
    };
};

const formatRequestedDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const requestTypeLabel = (type, tr) => {
    if (!type) return '—';
    const key = String(type).toLowerCase();
    if (key === 'leave') return tr('employeeRequests.leave');
    if (key === 'document') return tr('employeeRequests.document');
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const EmployeeRequests = () => {
    const { t } = useTranslation(['hr', 'common']);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(id);
    }, [searchTerm]);

    const statusParam = filterStatus === 'All' ? '' : filterStatus.toLowerCase();
    const typeParam = filterType === 'all' ? '' : filterType;

    const requestsUrl = useMemo(() => {
        const queryParams = new URLSearchParams();
        if (statusParam) queryParams.set('status', statusParam);
        if (typeParam) queryParams.set('type', typeParam);
        if (debouncedSearch) queryParams.set('search', debouncedSearch);
        if (dateFrom) queryParams.set('date_from', dateFrom);
        if (dateTo) queryParams.set('date_to', dateTo);
        queryParams.set('page', String(currentPage));
        queryParams.set('page_size', String(PAGE_SIZE));
        return `/api/hr/employees/requests/?${queryParams.toString()}`;
    }, [statusParam, typeParam, debouncedSearch, dateFrom, dateTo, currentPage]);

    const requestsQuery = useCustomQuery(
        requestsUrl,
        ['hr-employee-requests', statusParam, typeParam, debouncedSearch, dateFrom, dateTo, currentPage],
        { select: selectRequestsPayload }
    );

    const summary = requestsQuery.data?.summary ?? {
        pending: 0,
        approved_this_month: 0,
        rejected: 0,
    };

    const rows = requestsQuery.data?.rows ?? EMPTY_ROWS;
    const totalCount = requestsQuery.data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    const hasActiveFilters =
        Boolean(searchTerm) ||
        filterType !== 'all' ||
        filterStatus !== 'All' ||
        Boolean(dateFrom) ||
        Boolean(dateTo);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setFilterStatus('All');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const statusBadgeStyle = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'approved') {
            return {
                background: 'var(--color-success-dim)',
                color: 'var(--color-success)',
            };
        }
        if (s === 'rejected') {
            return {
                background: 'var(--color-error-dim)',
                color: 'var(--color-error)',
            };
        }
        return {
            background: 'var(--color-warning-dim)',
            color: 'var(--color-warning)',
        };
    };

    if (requestsQuery.isLoading && !requestsQuery.data) {
        return <Spinner />;
    }

    if (requestsQuery.isError) {
        return (
            <ResourceLoadError
                error={requestsQuery.error}
                title="Employee requests could not be loaded"
                onRefresh={() => requestsQuery.refetch()}
                refreshLabel="Try again"
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('employeeRequests.title')}</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>{t('employeeRequests.subtitle')}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('employeeRequests.pending')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>{summary.pending}</div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('employeeRequests.approvedThisMonth')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {summary.approved_this_month}
                    </div>
                </Card>
                <Card className="padding-md">
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('employeeRequests.rejected')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>{summary.rejected}</div>
                </Card>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    background: 'var(--color-bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '320px' }}>
                        <Input
                            placeholder="Search employee, request details..."
                            startIcon={<Search size={16} />}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ fontSize: '0.875rem' }}
                        />
                    </div>

                    <select
                        style={{
                            padding: '0.625rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.875rem',
                            minWidth: '160px',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                        }}
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">All Request Types</option>
                        <option value="leave">Leave Applications</option>
                        <option value="document">Document Requests</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>From:</span>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>To:</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ padding: '0.4rem', fontSize: '0.875rem', width: 'auto' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Filter size={14} color="var(--color-text-muted)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
                        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => {
                                    setFilterStatus(status);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-border)'}`,
                                    background: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-bg-surface)',
                                    color: filterStatus === status ? 'white' : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                        >
                            Clear All Filters
                        </Button>
                    )}
                </div>
            </div>

            <Card className="padding-none" style={{ overflowX: 'auto' }}>
                {requestsQuery.isFetching && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Updating…</div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                            <th style={{ padding: '1rem 1.5rem' }}>Employee</th>
                            <th style={{ padding: '1rem 1rem' }}>Request Type</th>
                            <th style={{ padding: '1rem 1rem' }}>Details</th>
                            <th style={{ padding: '1rem 1rem' }}>Date Requested</th>
                            <th style={{ padding: '1rem 1rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((req) => {
                            const typeKey = String(req.request_type || '').toLowerCase();
                            const isLeave = typeKey === 'leave';
                            const isPending = String(req.status || '').toLowerCase() === 'pending';
                            const displayName = req.employee?.full_name || '—';

                            return (
                                <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {req.employee?.photo ? (
                                                <img
                                                    src={req.employee.photo}
                                                    alt=""
                                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ padding: '0.5rem', background: 'var(--color-bg-subtle)', borderRadius: '50%' }}>
                                                    <User size={16} />
                                                </div>
                                            )}
                                            <span style={{ fontWeight: 500 }}>{displayName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {isLeave ? (
                                                <Calendar size={16} color="var(--color-primary-600)" />
                                            ) : (
                                                <FileText size={16} color="var(--color-secondary-600)" />
                                            )}
                                            {requestTypeLabel(req.request_type, t)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1rem' }}>{req.details || '—'}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{formatRequestedDate(req.requested_at)}</td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                ...statusBadgeStyle(req.status),
                                            }}
                                        >
                                            {req.status_display || req.status || '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        {isPending && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    style={{ padding: '0.25rem', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                                    onClick={() =>
                                                        toast.info('Approve this request from the employee profile or the dedicated leave/document workflow.')
                                                    }
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    style={{ padding: '0.25rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                    onClick={() =>
                                                        toast.info('Reject this request from the employee profile or the dedicated leave/document workflow.')
                                                    }
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No requests match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <Pagination
                        currentPage={safePage}
                        count={totalCount}
                        onPageChange={setCurrentPage}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            </Card>
        </div>
    );
};

export default EmployeeRequests;
