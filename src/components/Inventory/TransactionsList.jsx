import React, { useEffect, useMemo, useState } from 'react';
import useCustomQuery from '@/hooks/useQuery';
import Spinner from '@/core/Spinner';
import Pagination from '@/core/Pagination';
import { useInventory } from '@/context/InventoryContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRANSACTION_TYPE_OPTIONS = [
    { value: '', label: 'All types' },
    { value: 'goods_issue', label: 'Goods Issue' },
    { value: 'goods_receipt', label: 'Goods Receipt' },
    { value: 'transfer', label: 'Transfer' },
];

const TRANSACTION_STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'posted', label: 'Posted' },
    { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const normalizeTransactionsResponse = (response) => ({
    count: Number(response?.count ?? 0),
    next: response?.next ?? null,
    previous: response?.previous ?? null,
    data: Array.isArray(response?.data) ? response.data : [],
});

const buildTransactionsUrl = ({
    typeFilter,
    statusFilter,
    warehouseFilter,
    referenceFilter,
    dateFrom,
    dateTo,
    page,
    pageSize,
}) => {
    const queryParams = new URLSearchParams();
    if (typeFilter) queryParams.set('type', typeFilter);
    if (statusFilter) queryParams.set('status', statusFilter);
    if (warehouseFilter) queryParams.set('warehouse', warehouseFilter);
    if (referenceFilter.trim()) queryParams.set('reference', referenceFilter.trim());
    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);
    queryParams.set('page', String(page));
    queryParams.set('page_size', String(pageSize));
    return `/api/inventory/transactions/?${queryParams.toString()}`;
};

const TransactionsList = () => {
    const { warehouses } = useInventory();
    const navigate = useNavigate();
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth < 1100);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [referenceFilter, setReferenceFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const transactionsUrl = useMemo(
        () =>
            buildTransactionsUrl({
                typeFilter,
                statusFilter,
                warehouseFilter,
                referenceFilter,
                dateFrom,
                dateTo,
                page,
                pageSize,
            }),
        [typeFilter, statusFilter, warehouseFilter, referenceFilter, dateFrom, dateTo, page, pageSize]
    );

    const transactionsQuery = useCustomQuery(
        transactionsUrl,
        ['inventory-transactions', typeFilter, statusFilter, warehouseFilter, referenceFilter, dateFrom, dateTo, page, pageSize],
        {
            select: normalizeTransactionsResponse,
        }
    );

    const transactions = transactionsQuery.data?.data ?? [];
    const totalCount = transactionsQuery.data?.count ?? 0;

    const resetPagination = () => setPage(1);

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: isNarrowScreen ? 'column' : 'row', justifyContent: 'space-between', alignItems: isNarrowScreen ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Inventory Transactions</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Track all stock movements.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignSelf: isNarrowScreen ? 'flex-end' : 'auto' }}>
                    <Button variant="outline" icon={<ArrowRight size={16} />} size={isNarrowScreen ? 'sm' : undefined} onClick={() => navigate('/admin/inventory/transactions/issue')}>
                        Goods Issue
                    </Button>
                    <Button variant="outline" icon={<ArrowLeft size={16} />} size={isNarrowScreen ? 'sm' : undefined} onClick={() => navigate('/admin/inventory/transactions/receipt')}>
                        Goods Receipt
                    </Button>
                    <Button variant="outline" icon={<ArrowRight size={16} />} size={isNarrowScreen ? 'sm' : undefined} onClick={() => navigate('/admin/inventory/transactions/transfer')}>
                        Transfer
                    </Button>
                </div>
            </div>

            <Card className="padding-md">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            resetPagination();
                        }}
                        className="font-normal cursor-pointer"
                        style={inputStyle}
                    >
                        {TRANSACTION_TYPE_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            resetPagination();
                        }}
                        className="font-normal cursor-pointer"
                        style={inputStyle}
                    >
                        {TRANSACTION_STATUS_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={warehouseFilter}
                        onChange={(e) => {
                            setWarehouseFilter(e.target.value);
                            resetPagination();
                        }}
                        className="font-normal cursor-pointer"
                        style={inputStyle}
                    >
                        <option value="">All warehouses</option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                            </option>
                        ))}
                    </select>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Reference..."
                            value={referenceFilter}
                            onChange={(e) => {
                                setReferenceFilter(e.target.value);
                                resetPagination();
                            }}
                            className="font-normal"
                            style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                        />
                    </div>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            resetPagination();
                        }}
                        className="font-normal"
                        style={inputStyle}
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            resetPagination();
                        }}
                        className="font-normal"
                        style={inputStyle}
                    />

                    <select
                        value={String(pageSize)}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="font-normal cursor-pointer"
                        style={inputStyle}
                    >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                                {size} per page
                            </option>
                        ))}
                    </select>
                </div>
            </Card>

            <Card className="padding-md">
                {transactionsQuery.isPending ? (
                    <Spinner />
                ) : transactionsQuery.isError ? (
                    <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load transactions.</p>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Reference</th>
                                        <th style={thStyle}>Type</th>
                                        <th style={thStyle}>Warehouse</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                No transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((trans) => (
                                            <tr key={trans.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                                <td style={tdStyle}>{trans.date || '--'}</td>
                                                <td style={{ ...tdStyle, fontWeight: 600 }}>{trans.reference || '--'}</td>
                                                <td style={tdStyle}>
                                                    <span style={{ ...getTypeBadgeStyle(trans.type), whiteSpace: 'nowrap' }}>
                                                        {trans.type_display || trans.type || '--'}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    {trans.destination_warehouse_name
                                                        ? `${trans.warehouse_name || '--'} -> ${trans.destination_warehouse_name}`
                                                        : trans.warehouse_name || '--'}
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={getStatusBadgeStyle(trans.status)}>
                                                        {trans.status_display || trans.status || '--'}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>{trans.items_count ?? 0}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                {totalCount} transaction{totalCount === 1 ? '' : 's'} found
                            </p>
                            <Pagination
                                currentPage={page}
                                count={totalCount}
                                pageSize={pageSize}
                                onPageChange={setPage}
                            />
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '0.6rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};

const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle', fontSize: '0.9rem' };

const getTypeBadgeStyle = (type) => {
    if (type === 'goods_receipt') {
        return {
            ...badgeStyleBase,
            background: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))',
            color: 'var(--color-success)',
        };
    }
    if (type === 'goods_issue') {
        return {
            ...badgeStyleBase,
            background: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
            color: 'var(--color-warning)',
        };
    }
    return {
        ...badgeStyleBase,
        background: 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))',
        color: 'var(--color-primary-600)',
    };
};

const getStatusBadgeStyle = (status) => {
    if (status === 'posted') {
        return {
            ...badgeStyleBase,
            background: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))',
            color: 'var(--color-success)',
        };
    }
    if (status === 'cancelled') {
        return {
            ...badgeStyleBase,
            background: 'color-mix(in srgb, var(--color-danger) 18%, var(--color-bg-card))',
            color: 'var(--color-danger)',
        };
    }
    return {
        ...badgeStyleBase,
        background: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
        color: 'var(--color-warning)',
    };
};

const badgeStyleBase = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 600,
};

export default TransactionsList;
