import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { FileText, List, Plus, Landmark, Monitor, Percent, Users, ArrowUpRight, DollarSign, ShoppingCart, Package, Target, CheckCircle, Upload, Shield, ArrowLeft, Hammer, Map, Box, Building2, Banknote, X, Wallet } from 'lucide-react';

const normalizeRecentTransactionsResponse = (response) => ({
    title: response?.title || 'Recent Transactions',
    items: Array.isArray(response?.items) ? response.items : [],
});

const getTransactionIcon = (iconName) => {
    const normalizedIcon = String(iconName || '').toLowerCase();
    const icons = {
        bank: <Banknote size={18} />,
        building: <Building2 size={18} />,
        cart: <ShoppingCart size={18} />,
        cube: <Box size={18} />,
        hammer: <Hammer size={18} />,
        map: <Map size={18} />,
    };

    return icons[normalizedIcon] || <DollarSign size={18} />;
};

const getTransactionColors = (transaction) => {
    const amount = Number(transaction?.amount ?? 0);
    const icon = String(transaction?.icon || '').toLowerCase();

    if (amount > 0) {
        return {
            amountColor: 'var(--color-success)',
            bg: 'var(--color-success-dim)',
            iconColor: 'var(--color-success)',
        };
    }

    if (amount < 0) {
        return {
            amountColor: 'var(--color-error)',
            bg: 'var(--color-error-dim)',
            iconColor: 'var(--color-error)',
        };
    }

    if (icon === 'bank') {
        return {
            amountColor: 'var(--color-text-main)',
            bg: 'var(--color-warning-dim)',
            iconColor: 'var(--color-warning)',
        };
    }

    if (transaction?.kind === 'fixed_asset') {
        return {
            amountColor: 'var(--color-text-main)',
            bg: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
            iconColor: 'var(--color-primary-500)',
        };
    }

    return {
        amountColor: 'var(--color-text-main)',
        bg: 'color-mix(in srgb, var(--color-text-main) 12%, var(--color-bg-card))',
        iconColor: 'var(--color-text-secondary)',
    };
};

const formatTransactionAmount = (amount, currency) => {
    const numericAmount = Number(amount ?? 0);
    const absoluteAmount = Math.abs(numericAmount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const sign = numericAmount > 0 ? '+' : numericAmount < 0 ? '-' : '';
    const currencySuffix = currency ? ` ${currency}` : '';

    return `${sign}${absoluteAmount}${currencySuffix}`;
};

const AccountingDashboard = () => {
    const navigate = useNavigate();
    const [isRecentTransactionsOpen, setIsRecentTransactionsOpen] = useState(false);
    const recentTransactionsQuery = useCustomQuery(
        '/api/shared/dashboard/recent-transactions/',
        ['shared-dashboard-recent-transactions'],
        { select: normalizeRecentTransactionsResponse }
    );

    const recentTransactionsTitle = recentTransactionsQuery.data?.title || 'Recent Transactions';
    const recentTransactions = recentTransactionsQuery.data?.items ?? [];
    const previewTransactions = recentTransactions.slice(0, 4);

    useEffect(() => {
        if (!isRecentTransactionsOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isRecentTransactionsOpen]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate('/admin/dashboard')}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Accounting</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your general ledger, accounts, and transactions.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }} className="shrink-0">
                    <Button icon={<Plus size={18} />} onClick={() => navigate('journal/new')} className="cursor-pointer">New Journal Entry</Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('coa')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <List size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Chart of Accounts</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage account structure.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('gl')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>General Ledger</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>View account history.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('journal')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Journal Entries</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>View & edit entries.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('invoices')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Sales Invoices</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage billing & revenue.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('products-services')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Package size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Products & Services</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage your catalog.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('customers')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Customers</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage client profiles.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('bank')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Landmark size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Bank & Cash</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Treasury management.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('assets')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Monitor size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Fixed Assets</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Track depreciation.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('trial-balance')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Percent size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Trial Balance</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Debit/Credit totals.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('accountant-payments')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Wallet size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Accountant Payment</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Payroll payables and bank disbursements.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/reports')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Reports Center</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>P&L, Balance Sheet.</p>
                </Card>
                <Card
                    className="padding-md hoverable"
                    style={{
                        width: '240px',
                        cursor: 'pointer',
                        border: '1px solid color-mix(in srgb, var(--color-primary-600) 40%, var(--color-border))',
                        background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))'
                    }}
                    onClick={() => navigate('vendor-payments')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Vendor Payments</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Approval workflow.</p>
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.7rem',
                        background: 'var(--color-primary-600)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        display: 'inline-block'
                    }}>
                        Approvals Needed
                    </div>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('bank-import')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Upload size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Bank Import</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Import bank statements.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{
                        width: '240px', cursor: 'pointer',
                        border: '1px solid color-mix(in srgb, var(--color-secondary-600) 40%, var(--color-border))',
                        background: 'color-mix(in srgb, var(--color-secondary-600) 18%, var(--color-bg-card))'
                    }}
                    onClick={() => navigate('audit')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-secondary-600)' }}>
                        <Shield size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Audit Management</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>External audit & seal.</p>
                </Card>
            </div>

            {/* Recent Transactions Section */}
            <Card className="padding-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{recentTransactionsTitle}</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<ArrowUpRight size={16} />}
                        onClick={() => setIsRecentTransactionsOpen(true)}
                        disabled={recentTransactions.length === 0}
                        className="cursor-pointer"
                    >
                        View All
                    </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {recentTransactionsQuery.isPending && <Spinner />}

                    {recentTransactionsQuery.isError && (
                        <div style={{ padding: '1rem 0', color: 'var(--color-error)' }}>
                            Could not load recent transactions.
                        </div>
                    )}

                    {!recentTransactionsQuery.isPending && !recentTransactionsQuery.isError && recentTransactions.length === 0 && (
                        <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            No recent transactions.
                        </div>
                    )}

                    {!recentTransactionsQuery.isPending && !recentTransactionsQuery.isError && previewTransactions.map((transaction) => {
                        const colors = getTransactionColors(transaction);

                        return (
                            <TransactionItem
                                key={transaction.id}
                                icon={getTransactionIcon(transaction.icon)}
                                title={transaction.title}
                                subtitle={transaction.subtitle}
                                amount={formatTransactionAmount(transaction.amount, transaction.currency)}
                                status={transaction.status}
                                {...colors}
                            />
                        );
                    })}
                </div>
            </Card>

            {isRecentTransactionsOpen && (
                <RecentTransactionsModal
                    title={recentTransactionsTitle}
                    transactions={recentTransactions}
                    onClose={() => setIsRecentTransactionsOpen(false)}
                />
            )}
        </div>
    );
};

const RecentTransactionsModal = ({ title, transactions, onClose }) => (
    <div
        role="presentation"
        onClick={onClose}
        style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-transactions-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{
                width: 'min(720px, 100%)',
                maxHeight: '85vh',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div>
                    <h3 id="recent-transactions-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {title}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Showing {transactions.length} transactions
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={18} />}
                    onClick={onClose}
                    className="cursor-pointer"
                />
            </div>

            <div style={{
                padding: '0 1.5rem',
                overflowY: 'auto',
                maxHeight: 'calc(85vh - 100px)',
            }}>
                {transactions.map((transaction) => {
                    const colors = getTransactionColors(transaction);

                    return (
                        <TransactionItem
                            key={transaction.id}
                            icon={getTransactionIcon(transaction.icon)}
                            title={transaction.title}
                            subtitle={transaction.subtitle}
                            amount={formatTransactionAmount(transaction.amount, transaction.currency)}
                            status={transaction.status}
                            {...colors}
                        />
                    );
                })}
            </div>
        </div>
    </div>
);

const TransactionItem = ({ icon, title, subtitle, amount, amountColor, bg, iconColor, status }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 0', borderBottom: '1px solid var(--color-border)'
    }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
                minWidth: '2.75rem', height: '2.75rem', borderRadius: '1rem',
                background: bg, color: iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{subtitle}</span>
                </div>
            </div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: amountColor }}>{amount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'var(--color-success-dim)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>
                {status || 'Posted'}
            </span>
        </div>
    </div>
);

export default AccountingDashboard;
