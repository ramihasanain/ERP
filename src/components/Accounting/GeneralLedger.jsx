import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import Pagination from '@/core/Pagination';
import ResourceLoadError from '@/core/ResourceLoadError';
import useCustomQuery from '@/hooks/useQuery';
import { Search, ArrowLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;
const LINES_VISIBLE_LIMIT = 5;
const LINE_ROW_HEIGHT = 52;

const formatCurrency = (value, currencyCode = 'USD') => {
    const number = Number(value) || 0;
    const normalizedCurrency = typeof currencyCode === 'string' ? currencyCode.trim().toUpperCase() : 'USD';
    const formatted = Math.abs(number).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const code = normalizedCurrency || 'USD';
    return number < 0 ? `-${code} ${formatted}` : `${code} ${formatted}`;
};

const isNil = (value) => value === null || value === undefined || value === '';

const normalizeLedgerResponse = (response) => {
    const payload = response && typeof response === 'object' ? response : {};
    const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(response)
                ? response
                : [];

    return {
        count: Number(payload?.count) || 0,
        accounts: rows.map((account) => ({
            id: account?.id || '',
            code: String(account?.code ?? ''),
            name: account?.name || '—',
            accountType: account?.account_type || '—',
            isActive: Boolean(account?.is_active),
            currentBalance: Number(account?.current_balance) || 0,
            currentBalanceCurrency: account?.current_balance_currency || 'USD',
            lines: Array.isArray(account?.lines)
                ? account.lines.map((line) => ({
                    id: line?.id || '',
                    journalEntryId: line?.journal_entry_id || '',
                    date: line?.date || '',
                    reference: line?.reference || '',
                    description: line?.description || '',
                    costCenterCode: line?.cost_center_code || '',
                    costCenterName: line?.cost_center_name || '',
                    debit: Number(line?.debit) || 0,
                    credit: Number(line?.credit) || 0,
                    balance: Number(line?.balance) || 0,
                    currency: line?.currency || 'USD',
                    balanceCurrency: line?.balance_currency || line?.currency || 'USD',
                    baseDebit: Number(line?.base_debit) || 0,
                    baseCredit: Number(line?.base_credit) || 0,
                    convertedDebit: Number(line?.converted_debit) || 0,
                    convertedCredit: Number(line?.converted_credit) || 0,
                    exchangeRateUsed: line?.exchange_rate_used,
                    exchangeRateDate: line?.exchange_rate_date || '',
                }))
                : [],
        })),
    };
};

const normalizeAccountTypesResponse = (response) => {
    const payload = response && typeof response === 'object' ? response : {};
    const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(response)
                ? response
                : [];

    return rows
        .map((type) => ({
            id: type?.id || '',
            label: type?.name || type?.title || '',
            code: type?.code || '',
        }))
        .filter((type) => type.id && type.label);
};

const AccountLedgerTable = ({ account }) => {
    const [lineSearch, setLineSearch] = useState('');
    const [expandedLineKeys, setExpandedLineKeys] = useState(() => new Set());

    const filteredLines = useMemo(() => {
        const term = lineSearch.trim().toLowerCase();
        if (!term) return account.lines;
        return account.lines.filter((line) => {
            const reference = (line.reference || '').toLowerCase();
            const description = (line.description || '').toLowerCase();
            return reference.includes(term) || description.includes(term);
        });
    }, [account.lines, lineSearch]);

    const balanceColor =
        account.currentBalance > 0
            ? 'var(--color-success)'
            : account.currentBalance < 0
                ? 'var(--color-danger-500)'
                : 'var(--color-text-main)';

    const scrollMaxHeight = LINES_VISIBLE_LIMIT * LINE_ROW_HEIGHT + 8;

    const toggleLineExpansion = (lineKey) => {
        setExpandedLineKeys((previous) => {
            const next = new Set(previous);
            if (next.has(lineKey)) {
                next.delete(lineKey);
            } else {
                next.add(lineKey);
            }
            return next;
        });
    };

    return (
        <Card className="padding-lg">
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                        {account.code} - {account.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background: 'var(--color-bg-subtle)',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 600,
                            }}
                        >
                            {account.accountType}
                        </span>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background: account.isActive ? 'var(--color-success-dim)' : 'var(--color-bg-subtle)',
                                color: account.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                fontWeight: 600,
                            }}
                        >
                            {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        flex: '1 1 260px',
                        minWidth: 0,
                    }}
                >
                    <div style={{ flex: '1 1 160px', maxWidth: '280px', minWidth: '120px' }}>
                        <Input
                            placeholder="Search…"
                            aria-label="Search lines by reference or description"
                            startIcon={<Search size={14} />}
                            value={lineSearch}
                            onChange={(event) => setLineSearch(event.target.value)}
                            style={{ fontSize: '0.85rem' }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Current Balance
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: balanceColor, whiteSpace: 'nowrap' }}>
                            {formatCurrency(account.currentBalance, account.currentBalanceCurrency)}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <div style={{ maxHeight: `${scrollMaxHeight}px`, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    textAlign: 'left',
                                    background: 'var(--color-bg-table-header)',
                                    color: 'var(--color-text-secondary)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                <th style={{ width: '36px', padding: '0.75rem 0.5rem' }} />
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Reference</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Description</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Debit</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Credit</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLines.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            padding: '1.25rem 1rem',
                                            textAlign: 'center',
                                            color: 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {account.lines.length === 0
                                            ? 'No transactions for this account.'
                                            : 'No lines match your search.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLines.map((line, index) => {
                                    const lineKey = line.id || `${line.date}-${line.reference}-${index}`;
                                    const isExpanded = expandedLineKeys.has(lineKey);

                                    const metadataItems = [
                                        { label: 'Currency', value: line.currency || '—' },
                                        { label: 'Balance Currency', value: line.balanceCurrency || '—' },
                                        { label: 'Base Debit', value: formatCurrency(line.baseDebit, line.balanceCurrency) },
                                        { label: 'Base Credit', value: formatCurrency(line.baseCredit, line.balanceCurrency) },
                                        { label: 'Converted Debit', value: formatCurrency(line.convertedDebit, line.balanceCurrency) },
                                        { label: 'Converted Credit', value: formatCurrency(line.convertedCredit, line.balanceCurrency) },
                                        {
                                            label: 'Exchange Rate Used',
                                            value: isNil(line.exchangeRateUsed) ? '—' : Number(line.exchangeRateUsed).toLocaleString(),
                                        },
                                        { label: 'Exchange Rate Date', value: line.exchangeRateDate || '—' },
                                    ];

                                    return (
                                        <React.Fragment key={lineKey}>
                                            <tr
                                                onClick={() => toggleLineExpansion(lineKey)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        toggleLineExpansion(lineKey);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                aria-expanded={isExpanded}
                                                className="ledger-line-row"
                                                style={{
                                                    borderBottom: '1px solid var(--color-border)',
                                                    cursor: 'pointer',
                                                    background: isExpanded ? 'var(--color-bg-subtle)' : 'transparent',
                                                }}
                                            >
                                                <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                                                    <ChevronRight
                                                        size={16}
                                                        style={{
                                                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease',
                                                            color: 'var(--color-text-secondary)',
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>{line.date || '—'}</td>
                                                <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{line.reference || '—'}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                                                    {line.description || '—'}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    {line.debit ? formatCurrency(line.debit, line.currency) : '—'}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    {line.credit ? formatCurrency(line.credit, line.currency) : '—'}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '0.85rem 1rem',
                                                        textAlign: 'right',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {formatCurrency(line.balance, line.balanceCurrency)}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td colSpan={7} style={{ padding: '0.9rem 1rem 1rem 2.2rem' }}>
                                                        <div
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                                                gap: '0.75rem',
                                                            }}
                                                        >
                                                            {metadataItems.map((item) => (
                                                                <div
                                                                    key={item.label}
                                                                    className="ledger-line-metadata-card"
                                                                    style={{
                                                                        background: 'var(--color-bg-surface)',
                                                                        border: '1px solid var(--color-border)',
                                                                        borderRadius: '0.5rem',
                                                                        padding: '0.65rem 0.75rem',
                                                                    }}
                                                                >
                                                                    <p
                                                                        style={{
                                                                            margin: 0,
                                                                            fontSize: '0.72rem',
                                                                            color: 'var(--color-text-secondary)',
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        {item.label}
                                                                    </p>
                                                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', fontWeight: 500 }}>
                                                                        {item.value}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};

const GeneralLedger = () => {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterTypeId, setFilterTypeId] = useState('');
    const [includeEmptyAccounts, setIncludeEmptyAccounts] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(id);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filterTypeId, includeEmptyAccounts]);

    const ledgerUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('page_size', String(PAGE_SIZE));
        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        }
        if (filterTypeId) {
            params.set('type', filterTypeId);
        }
        params.set('include_empty_accounts', includeEmptyAccounts ? 'true' : 'false');
        return `/accounting/general-ledger/?${params.toString()}`;
    }, [currentPage, debouncedSearch, filterTypeId, includeEmptyAccounts]);

    const ledgerQuery = useCustomQuery(
        ledgerUrl,
        ['accounting-general-ledger', currentPage, debouncedSearch, filterTypeId, includeEmptyAccounts],
        {
            select: normalizeLedgerResponse,
            keepPreviousData: true,
        }
    );

    const accountTypesQuery = useCustomQuery(
        '/api/shared/account-types/',
        ['shared-account-types'],
        {
            select: normalizeAccountTypesResponse,
        }
    );

    const ledgerData = ledgerQuery.data ?? { count: 0, accounts: [] };
    const accountTypes = accountTypesQuery.data ?? [];

    const handleResetSearch = () => setSearchTerm('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate('/admin/accounting')}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>General Ledger</h1>
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                            Detailed history of all transactions per account.
                        </p>
                    </div>
                </div>
            </div>

            <Card className="padding-md">
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ flex: '1 1 280px', minWidth: '200px' }}>
                        <Input
                            placeholder="Search accounts..."
                            aria-label="Search accounts"
                            startIcon={<Search size={16} />}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <select
                        id="ledger-account-type"
                        value={filterTypeId}
                        onChange={(event) => setFilterTypeId(event.target.value)}
                        disabled={accountTypesQuery.isLoading}
                        aria-label="Filter by account type"
                        className="cursor-pointer ledger-type-filter"
                        style={{
                            minHeight: '2.5rem',
                            padding: '0 0.75rem',
                            borderRadius: 'var(--radius-md, 0.5rem)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem',
                            fontWeight: 'normal',
                            minWidth: '200px',
                            maxWidth: '100%',
                        }}
                    >
                        <option value="">All account types</option>
                        {accountTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    <label
                        htmlFor="include-empty-accounts"
                        className="cursor-pointer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            minHeight: '2.5rem',
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <input
                            id="include-empty-accounts"
                            type="checkbox"
                            checked={includeEmptyAccounts}
                            onChange={(event) => setIncludeEmptyAccounts(event.target.checked)}
                            className="cursor-pointer"
                        />
                        Include empty accounts
                    </label>
                    {(searchTerm || filterTypeId || includeEmptyAccounts) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                handleResetSearch();
                                setFilterTypeId('');
                                setIncludeEmptyAccounts(false);
                            }}
                            className="cursor-pointer shrink-0"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </Card>
            <style>{`
                .ledger-line-row {
                    transition: background-color 0.2s ease;
                }

                .ledger-line-row:hover {
                    background: linear-gradient(
                        90deg,
                        color-mix(in srgb, var(--color-primary-500) 10%, transparent) 0%,
                        color-mix(in srgb, var(--color-primary-500) 4%, transparent) 45%,
                        transparent 100%
                    );
                }

                .ledger-line-row:hover td {
                    background: transparent;
                }

                .ledger-line-row:hover td:first-child {
                    box-shadow: inset 3px 0 0 var(--color-primary-500);
                }

                .ledger-line-metadata-card {
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }

                .ledger-line-metadata-card:hover {
                    border-color: var(--color-primary-300);
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
                    transform: translateY(-1px);
                }

                @media (max-width: 520px) {
                    .ledger-type-filter {
                        width: 100%;
                        min-width: 100% !important;
                    }
                }
            `}</style>

            {ledgerQuery.isLoading ? (
                <Card className="padding-lg">
                    <Spinner />
                </Card>
            ) : ledgerQuery.isError ? (
                <ResourceLoadError
                    error={ledgerQuery.error}
                    title="Could not load general ledger"
                    onRefresh={() => ledgerQuery.refetch()}
                    refreshLabel="Retry"
                />
            ) : ledgerData.accounts.length === 0 ? (
                <Card className="padding-lg">
                    <p
                        style={{
                            margin: 0,
                            textAlign: 'center',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.95rem',
                        }}
                    >
                        No accounts match your filters.
                    </p>
                </Card>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        opacity: ledgerQuery.isFetching ? 0.75 : 1,
                        transition: 'opacity 0.15s ease',
                    }}
                >
                    {ledgerData.accounts.map((account) => (
                        <AccountLedgerTable key={account.id} account={account} />
                    ))}
                </div>
            )}

            {!ledgerQuery.isLoading && !ledgerQuery.isError && (
                <Card className="padding-md">
                    <Pagination
                        currentPage={currentPage}
                        count={ledgerData.count}
                        pageSize={PAGE_SIZE}
                        alwaysVisible
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </Card>
            )}
        </div>
    );
};

export default GeneralLedger;
