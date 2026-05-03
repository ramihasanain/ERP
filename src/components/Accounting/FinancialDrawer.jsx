import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { X, Calendar, ArrowRight, ArrowLeft, Filter, Search, Tag, Info, List, Link as LinkIcon, Monitor, User, DollarSign, Target, Activity, FileText, Landmark, Download, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import { useLanguage } from '@/context/LanguageContext';
import useCustomQuery from '@/hooks/useQuery';
import { exportToCSV } from '@/utils/exportUtils';

const FinancialDrawer = () => {
    const {
        drawerState, closeDrawer, accounts, entries, customers,
        costCenters, bankAccounts, getAccountBalance, getAllChildAccountIds
    } = useAccounting();
    const { language } = useLanguage();
    const { isOpen, entityType, entityId } = drawerState;
    const [activeTab, setActiveTab] = useState('overview');
    const isCustomerDrawer = entityType === 'Customer' && Boolean(entityId);
    const isJournalDrawer = entityType === 'Journal' && Boolean(entityId);
    const isCostCenterDrawer = entityType === 'Cost Center' && Boolean(entityId);

    // Keep Overview as default when the drawer closes, opens, or the entity changes (avoids stale tab e.g. Transactions on reopen).
    /* eslint-disable react-hooks/set-state-in-effect -- deliberate drawer tab reset */
    useLayoutEffect(() => {
        setActiveTab('overview');
    }, [isOpen, entityType, entityId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const mapHistoryLogRow = (log, fallbackCurrency = 'JOD', fallbackEntryId = '') => ({
        id: log?.journal_entry_id || log?.id || fallbackEntryId,
        journal_entry_id: log?.journal_entry_id || log?.id || fallbackEntryId,
        reference: log?.reference || '',
        date: log?.date || '',
        status: log?.status || '',
        source: log?.source || '',
        sourceType: log?.source || '',
        description: log?.description || '',
        total: Number(log?.total || 0),
        currency: log?.currency || fallbackCurrency,
        isAutomatic: (log?.source || '').toLowerCase() !== 'manual',
        lines: Array.isArray(log?.entry_details)
            ? log.entry_details.map((line) => ({
                id: line?.id || '',
                account: line?.account || '',
                account_name: line?.account_name || '',
                description: line?.description || '',
                costCenter: line?.cost_center || null,
                debit: Number(line?.debit || 0),
                credit: Number(line?.credit || 0),
                order: line?.order ?? 0,
            }))
            : [],
    });

    const customerDetailsQuery = useCustomQuery(
        isCustomerDrawer ? `/api/sales/customers/${entityId}/` : '/api/sales/customers/',
        ['sales-customer-details', entityId],
        {
            enabled: isOpen && isCustomerDrawer,
            select: (payload) => ({
                id: payload?.id || '',
                name: payload?.name || '—',
                tax_id: payload?.tax_id || '—',
                currency_code: payload?.currency_code || '—',
                contact_person: payload?.contact_person || '—',
                phone: payload?.phone || '—',
                email: payload?.email || '—',
                billing_address: payload?.billing_address || '—',
                is_active: Boolean(payload?.is_active),
            }),
        }
    );

    const journalDetailsQuery = useCustomQuery(
        isJournalDrawer ? `/accounting/journal-entries/${entityId}/logs/` : '/accounting/journal-entries/',
        ['journal-entry-details', entityId],
        {
            enabled: isOpen && isJournalDrawer,
            select: (payload) => ({
                id: payload?.id || '',
                title: payload?.title || '',
                name: payload?.title || payload?.reference || payload?.id || '—',
                date: payload?.overview?.last_transaction || '',
                reference: payload?.reference || payload?.transactions?.history_logs?.[0]?.reference || '',
                description: payload?.overview?.description || '',
                status: payload?.related?.journal_entry?.status || '',
                source: payload?.related?.journal_entry?.source || '',
                sourceType: payload?.related?.journal_entry?.source || '',
                currency: payload?.overview?.currency || 'JOD',
                createdBy: payload?.related?.journal_entry?.created_by || '',
                isAutomatic: payload?.related?.journal_entry?.source
                    && payload.related.journal_entry.source.toLowerCase() !== 'manual',
                overview: {
                    current_balance: Number(payload?.overview?.current_balance || 0),
                    currency: payload?.overview?.currency || 'JOD',
                    activity_count: Number(payload?.overview?.activity_count || 0),
                    last_transaction: payload?.overview?.last_transaction || '',
                    description: payload?.overview?.description || '',
                    ledger_sync_note: payload?.overview?.ledger_sync_note || '',
                },
                related: {
                    journal_entry: {
                        id: payload?.related?.journal_entry?.id || '',
                        title: payload?.related?.journal_entry?.title || '',
                        source: payload?.related?.journal_entry?.source || '',
                        status: payload?.related?.journal_entry?.status || '',
                        created_by: payload?.related?.journal_entry?.created_by || '',
                        attachment: payload?.related?.journal_entry?.attachment || null,
                    },
                },
                history_logs: Array.isArray(payload?.transactions?.history_logs)
                    ? payload.transactions.history_logs.map((log) =>
                        mapHistoryLogRow(log, payload?.overview?.currency || 'JOD', payload?.id || ''))
                    : [],
            }),
        }
    );

    const costCenterDetailQuery = useCustomQuery(
        isCostCenterDrawer ? `/accounting/cost-centers/${entityId}/` : '/accounting/cost-centers/',
        ['cost-center-drawer-detail', entityId],
        {
            enabled: isOpen && isCostCenterDrawer,
            select: (p) => ({
                id: p?.id || '',
                name: p?.name || '',
                code: p?.code || '',
                budget: Number(p?.annual_budget) || 0,
                annual_budget: p?.annual_budget ?? '',
                actual_spent: Number(p?.actual_spent) || 0,
                remaining_budget: p?.remaining_budget != null ? Number(p.remaining_budget) : null,
                budget_utilization_pct: Number(p?.budget_utilization_pct) || 0,
                created_at: p?.created_at || '',
                updated_at: p?.updated_at || '',
            }),
        }
    );

    const costCenterOverviewQuery = useCustomQuery(
        isCostCenterDrawer ? `/accounting/cost-centers/${entityId}/overview/` : '/accounting/cost-centers/',
        ['cost-center-drawer-overview', entityId],
        { enabled: isOpen && isCostCenterDrawer && activeTab === 'overview' }
    );

    const costCenterTransactionsQuery = useCustomQuery(
        isCostCenterDrawer ? `/accounting/cost-centers/${entityId}/transactions/` : '/accounting/cost-centers/',
        ['cost-center-drawer-transactions', entityId],
        {
            enabled: isOpen && isCostCenterDrawer && activeTab === 'transactions',
            select: (res) => (Array.isArray(res?.data) ? res.data : []),
        }
    );

    const costCenterRelatedQuery = useCustomQuery(
        isCostCenterDrawer ? `/accounting/cost-centers/${entityId}/related/` : '/accounting/cost-centers/',
        ['cost-center-drawer-related', entityId],
        { enabled: isOpen && isCostCenterDrawer && activeTab === 'related' }
    );

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') closeDrawer();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeDrawer]);

    // Localization Strings
    const t = useMemo(() => {
        return language === 'ar' ? {
            overview: 'نظرة عامة',
            transactions: 'العمليات',
            related: 'مرتبط',
            currentBalance: 'الرصيد الحالي',
            activityCount: 'عدد العمليات',
            lastTransaction: 'آخر عملية',
            description: 'الوصف',
            historyLogs: 'سجل العمليات',
            export: 'تصدير',
            filter: 'تصفية',
            noTransactions: 'لا يوجد عمليات لهذه الفترة',
            debit: 'مدين',
            credit: 'دائن',
            details: 'تفاصيل القيد',
            account: 'الحساب',
            automatic: 'آلي',
            manual: 'يدوي',
            connectedModules: 'الوحدات المرتبطة',
            aggregationMode: 'عرض مجمع (يشمل الحسابات الفرعية)',
            done: 'تم',
            goToEntry: 'انتقال للقيد',
            costCenterBudget: 'ميزانية مركز التكلفة',
        } : {
            overview: 'Overview',
            transactions: 'Transactions',
            related: 'Related',
            currentBalance: 'Current Balance',
            activityCount: 'Activity Count',
            lastTransaction: 'Last Transaction',
            description: 'Description',
            historyLogs: 'History Logs',
            export: 'Export',
            filter: 'Filter',
            noTransactions: 'No transactions found for this period.',
            debit: 'Debit',
            credit: 'Credit',
            details: 'Entry Details',
            account: 'Account',
            automatic: 'Automatic',
            manual: 'Manual',
            connectedModules: 'Connected Modules',
            aggregationMode: 'Aggregated View (Includes sub-accounts)',
            done: 'Done',
            goToEntry: 'Go to Entry',
            costCenterBudget: 'Cost center budget',
        };
    }, [language]);

    // Derived Data
    const entityData = useMemo(() => {
        if (!entityType || !entityId) return null;
        switch (entityType) {
            case 'Account': return accounts.find(a => a.id === entityId);
            case 'Journal': return journalDetailsQuery.data || entries.find(e => e.id === entityId);
            case 'Customer': return customerDetailsQuery.data || customers.find(c => c.id === entityId);
            case 'Asset': return accounts.find(a => a.id === entityId);
            case 'Bank': return bankAccounts.find(b => b.id === entityId);
            case 'Cost Center': {
                const fromContext = costCenters.find(cc => cc.id === entityId);
                const detail = costCenterDetailQuery.data;
                const base = {
                    id: entityId,
                    ...(fromContext || {}),
                    ...(detail?.id
                        ? {
                            ...detail,
                            name: detail.name || fromContext?.name || '—',
                            code: detail.code || fromContext?.code || '',
                            budget: Number.isFinite(detail.budget) ? detail.budget : (fromContext?.budget ?? 0),
                        }
                        : {}),
                };
                const overview = costCenterOverviewQuery.data;
                const txRows = costCenterTransactionsQuery.data;
                const related = costCenterRelatedQuery.data;
                const currency = overview?.currency || 'JOD';
                const history_logs = Array.isArray(txRows)
                    ? txRows.map((log) => mapHistoryLogRow(log, currency))
                    : [];
                return {
                    ...base,
                    overview: overview
                        ? {
                            current_balance: Number(overview?.current_balance ?? 0),
                            currency,
                            activity_count: Number(overview?.activity_count ?? 0),
                            last_transaction: overview?.last_transaction ?? null,
                            ledger_sync_note: overview?.ledger_sync_note || 'Real-time Ledger Sync Complete',
                        }
                        : undefined,
                    history_logs,
                    costCenterRelated: related || null,
                };
            }
            default: return null;
        }
    }, [entityType, entityId, accounts, entries, customers, costCenters, bankAccounts, customerDetailsQuery.data, journalDetailsQuery.data, costCenterDetailQuery.data, costCenterOverviewQuery.data, costCenterTransactionsQuery.data, costCenterRelatedQuery.data]);

    // Transaction History for Entity (Supports Aggregation)
    const transactionHistory = useMemo(() => {
        if (!entityType || !entityId || !entityData) return [];

        let relatedEntries = [];

        if (entityType === 'Account' || entityType === 'Asset') {
            const targetIds = entityData.isGroup ? [entityId, ...getAllChildAccountIds(entityId)] : [entityId];
            relatedEntries = entries.filter(e => e.lines.some(l => targetIds.includes(l.account)));
        } else if (entityType === 'Journal') {
            relatedEntries = Array.isArray(entityData?.history_logs)
                ? entityData.history_logs
                : [];
        } else if (entityType === 'Bank') {
            relatedEntries = entries.filter(e => e.lines.some(l => l.account === entityData.glAccountId));
        } else if (entityType === 'Cost Center') {
            relatedEntries = Array.isArray(entityData?.history_logs)
                ? entityData.history_logs
                : [];
        } else if (entityType === 'Customer') {
            relatedEntries = entries.filter(e => e.description.includes(entityData.name) || e.reference.includes(entityId));
        }

        return relatedEntries.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    }, [entityType, entityId, entityData, entries, getAllChildAccountIds]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 2000,
            display: 'flex', justifyContent: 'flex-end',
            transition: 'opacity 0.3s ease'
        }} onClick={closeDrawer}>
            <div
                style={{
                    width: '100%', maxWidth: '520px', background: 'var(--color-bg-surface)',
                    height: '100%', display: 'flex', flexDirection: 'column',
                    boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
                    animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                    <button
                        onClick={closeDrawer}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'var(--color-bg-subtle)', border: 'none',
                            borderRadius: '50%', width: '32px', height: '32px',
                            cursor: 'pointer', color: 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            background: 'var(--color-primary-600)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px -4px rgba(var(--color-primary-rgb), 0.3)'
                        }}>
                            {entityType === 'Account' && <List size={22} />}
                            {entityType === 'Journal' && <FileText size={22} />}
                            {entityType === 'Customer' && <User size={22} />}
                            {entityType === 'Asset' && <Monitor size={22} />}
                            {entityType === 'Bank' && <Landmark size={22} />}
                            {entityType === 'Cost Center' && <Target size={22} />}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {entityType} {t.historyLogs}
                            </p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                                {isCostCenterDrawer && costCenterDetailQuery.isPending && !costCenterDetailQuery.data
                                    ? (language === 'ar' ? 'جاري التحميل…' : 'Loading…')
                                    : (entityData?.name || 'Unknown Entity')}
                            </h3>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="cursor-pointer">{t.overview}</TabButton>
                        <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} className="cursor-pointer">{t.transactions}</TabButton>
                        <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')} className="cursor-pointer">{t.related}</TabButton>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--color-bg-secondary)' }}>
                    {activeTab === 'overview' && (
                        <OverviewTab
                            t={t}
                            entityType={entityType}
                            data={entityData}
                            history={transactionHistory}
                            getAccountBalance={getAccountBalance}
                            isCustomerDetailsLoading={customerDetailsQuery.isLoading}
                            isCustomerDetailsError={customerDetailsQuery.isError}
                            isCostCenterOverviewLoading={isCostCenterDrawer && costCenterOverviewQuery.isPending}
                            isCostCenterOverviewError={isCostCenterDrawer && costCenterOverviewQuery.isError}
                            isCostCenterDetailLoading={isCostCenterDrawer && costCenterDetailQuery.isPending}
                            isCostCenterDetailError={isCostCenterDrawer && costCenterDetailQuery.isError}
                        />
                    )}
                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            language={language}
                            t={t}
                            history={transactionHistory}
                            entityName={entityData?.name}
                            entityType={entityType}
                            entityId={entityId}
                            entityData={entityData}
                            accounts={accounts}
                            getAllChildAccountIds={getAllChildAccountIds}
                            isCostCenterTransactionsLoading={isCostCenterDrawer && costCenterTransactionsQuery.isPending}
                        />
                    )}
                    {activeTab === 'related' && (
                        <RelatedTab
                            t={t}
                            entityType={entityType}
                            data={entityData}
                            isCostCenterRelatedLoading={isCostCenterDrawer && costCenterRelatedQuery.isPending}
                            isCostCenterRelatedError={isCostCenterDrawer && costCenterRelatedQuery.isError}
                        />
                    )}
                </div>

                {/* Footer / Actions */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', background: 'var(--color-bg-surface)' }}>
                    <Button variant="outline" fullWidth onClick={closeDrawer} size="lg">{t.done}</Button>
                    {entityType === 'Journal' && (
                        <Button variant="primary" fullWidth onClick={() => window.location.href = `/admin/accounting/journal/${entityId}`} size="lg">
                            {t.goToEntry}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, children, onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={className}
        style={{
            background: 'none', border: 'none', padding: '0.5rem 0',
            fontSize: '0.875rem', fontWeight: 800,
            color: active ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
            borderBottom: active ? '3px solid var(--color-primary-600)' : '3px solid transparent',
            cursor: 'pointer', transition: 'all 0.3s',
            letterSpacing: '0.01em'
        }}
    >
        {children}
    </button>
);

const AestheticBadge = ({ status, type }) => {
    const emerald = { bg: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))', text: 'var(--color-success)', border: 'var(--color-success)' };
    const coral = { bg: 'color-mix(in srgb, var(--color-error) 18%, var(--color-bg-card))', text: 'var(--color-error)', border: 'var(--color-error)' };
    const slate = { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' };

    const c = type === 'debit' ? emerald : (type === 'credit' ? coral : slate);

    return (
        <span style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem',
            borderRadius: '6px', background: c.bg, color: c.text,
            border: `1px solid ${c.bg}`, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            {status}
        </span>
    );
};

const OverviewTab = ({
    t, entityType, data, history, getAccountBalance,
    isCustomerDetailsLoading, isCustomerDetailsError,
    isCostCenterOverviewLoading, isCostCenterOverviewError,
    isCostCenterDetailLoading, isCostCenterDetailError,
}) => {
    const usesApiOverview = entityType === 'Journal' || entityType === 'Cost Center';
    const ccOverview = entityType === 'Cost Center' ? data?.overview : null;
    const balance = entityType === 'Account' || entityType === 'Bank' || entityType === 'Asset'
        ? getAccountBalance(entityType === 'Bank' ? data.glAccountId : data.id)
        : usesApiOverview
            ? Number((entityType === 'Cost Center' ? ccOverview?.current_balance : data?.overview?.current_balance) ?? data?.balance ?? 0)
            : (data?.balance || 0);

    const lastTransaction = usesApiOverview
        ? ((entityType === 'Cost Center' ? ccOverview?.last_transaction : data?.overview?.last_transaction)
            || (history.length > 0 ? history[0].date : null) || 'N/A')
        : (history.length > 0 ? history[0].date : 'N/A');
    const activityCount = usesApiOverview
        ? Number((entityType === 'Cost Center' ? ccOverview?.activity_count : data?.overview?.activity_count) ?? history.length)
        : history.length;
    const currency = usesApiOverview
        ? ((entityType === 'Cost Center' ? ccOverview?.currency : data?.overview?.currency) || data?.currency || 'JOD')
        : 'JOD';
    const overviewDescription = entityType === 'Journal'
        ? (data?.overview?.description || data?.description)
        : data?.description;
    const ledgerSyncNote = entityType === 'Cost Center' && !ccOverview
        ? ''
        : (usesApiOverview
            ? (data?.overview?.ledger_sync_note || ccOverview?.ledger_sync_note || 'Real-time Ledger Sync Complete')
            : 'Real-time Ledger Sync Complete');

    const showCostCenterOverviewLoading = entityType === 'Cost Center' && isCostCenterOverviewLoading;
    const showCostCenterOverviewError = entityType === 'Cost Center' && isCostCenterOverviewError;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
                background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '20px',
                border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>{t.currentBalance}</p>
                {showCostCenterOverviewLoading ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>Loading overview…</p>
                ) : showCostCenterOverviewError ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-error)', margin: 0 }}>Could not load cost center overview.</p>
                ) : (
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-0.04em' }}>
                        {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{currency}</span>
                    </h2>
                )}
                {ledgerSyncNote ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {ledgerSyncNote}
                        </p>
                    </div>
                ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t.activityCount}</p>
                    <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>
                        {showCostCenterOverviewLoading ? '…' : activityCount}
                    </p>
                </Card>
                <Card style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t.lastTransaction}</p>
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                        {showCostCenterOverviewLoading ? '…' : lastTransaction}
                    </p>
                </Card>
            </div>

            {overviewDescription && (
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t.description}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        {overviewDescription}
                    </p>
                </div>
            )}

            {entityType === 'Cost Center' && (
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>{t.costCenterBudget}</h4>
                    {isCostCenterDetailError ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-error)', margin: 0 }}>Could not load cost center details.</p>
                    ) : isCostCenterDetailLoading ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>Loading cost center details…</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <DetailItem label="Code" value={data?.code} />
                            <DetailItem label="Annual budget" value={data?.annual_budget != null && data?.annual_budget !== '' ? String(data.annual_budget) : (Number.isFinite(data?.budget) ? Number(data.budget).toFixed(2) : '—')} />
                            <DetailItem label="Actual spent" value={Number.isFinite(data?.actual_spent) ? Number(data.actual_spent).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'} />
                            <DetailItem label="Remaining" value={data?.remaining_budget != null && Number.isFinite(data.remaining_budget) ? Number(data.remaining_budget).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'} />
                            <DetailItem label="Budget utilization" value={`${Number(data?.budget_utilization_pct || 0).toFixed(1)}%`} />
                            <DetailItem label="Updated" value={data?.updated_at ? String(data.updated_at).slice(0, 10) : '—'} />
                        </div>
                    )}
                </div>
            )}

            {entityType === 'Customer' && (
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>Customer Details</h4>

                    {isCustomerDetailsLoading ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>Loading customer details...</p>
                    ) : isCustomerDetailsError ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-error)', margin: 0 }}>Could not load customer details.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <DetailItem label="Contact Person" value={data?.contact_person} />
                            <DetailItem label="Email" value={data?.email} />
                            <DetailItem label="Phone" value={data?.phone} />
                            <DetailItem label="Tax ID" value={data?.tax_id} />
                            <DetailItem label="Currency" value={data?.currency_code} />
                            <DetailItem label="Status" value={data?.is_active ? 'Active' : 'Inactive'} />
                            <DetailItem label="Billing Address" value={data?.billing_address} fullWidth />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ label, value, fullWidth = false }) => (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{value || '—'}</p>
    </div>
);

const TransactionsTab = ({
    language, t, history, entityName, entityType, entityId, entityData, accounts, getAllChildAccountIds,
    isCostCenterTransactionsLoading,
}) => {
    const [expandedEntry, setExpandedEntry] = useState(null);

    const entryRowKey = (entry) => entry.journal_entry_id || entry.id;
    const entryDisplayRef = (entry) => (entry.reference && String(entry.reference).trim()) || entryRowKey(entry) || '—';

    const handleDetailedExport = () => {
        const fullLedger = [];
        history.forEach(entry => {
            entry.lines.forEach(line => {
                const account = accounts.find(a => a.id === line.account);
                const isDebit = Number(line.debit) > 0;
                fullLedger.push({
                    'Date': entry.date,
                    'Reference': entryDisplayRef(entry),
                    'Entry Description': entry.description,
                    'Account Code': line.account,
                    'Account Name': account?.name || 'Unknown',
                    'Line Description': line.description || '',
                    'Debit (+)': isDebit ? line.debit : 0,
                    'Credit (-)': !isDebit ? line.credit : 0,
                    'Sign': isDebit ? '+' : '-',
                    'Direction': isDebit ? (language === 'ar' ? 'مدين' : 'Debit') : (language === 'ar' ? 'دائن' : 'Credit'),
                    'Cost Center': line.costCenter || '',
                    'Source': entry.sourceType || 'Manual'
                });
            });
        });
        exportToCSV(fullLedger, `Detailed_Ledger_${entityName}`);
    };

    if (isCostCenterTransactionsLoading && history.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
                <Activity size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p style={{ fontWeight: 600 }}>Loading transactions…</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
                <Activity size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p style={{ fontWeight: 600 }}>{t.noTransactions}</p>
            </div>
        );
    }

    const isGroup = entityData?.isGroup;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{t.historyLogs}</span>
                    {isGroup && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{t.aggregationMode}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="ghost" size="sm" onClick={handleDetailedExport} icon={<Download size={14} />} style={{ borderRadius: '8px' }}>{t.export}</Button>
                    <Button variant="ghost" size="sm" icon={<Filter size={14} />} style={{ borderRadius: '8px' }}>{t.filter}</Button>
                </div>
            </div>

            {history.map(entry => {
                const targetIds = (entityType === 'Account' && entityData.isGroup) ? [entityId, ...getAllChildAccountIds(entityId)] : [entityId];
                const matchingLines = entry.lines.filter(l => {
                    if (entityType === 'Journal' || entityType === 'Cost Center') return true;
                    if (entityType === 'Account' || entityType === 'Asset') return targetIds.includes(l.account);
                    if (entityType === 'Bank') return l.account === entityData.glAccountId;
                    if (entityType === 'Customer') return l.account === '1140' && (entry.description.includes(entityData.name) || entry.reference.includes(entityId));
                    return false;
                });

                const rowKey = entryRowKey(entry);
                const isExpanded = expandedEntry === rowKey;
                const primaryLine = matchingLines[0];
                const isDebit = primaryLine ? Number(primaryLine.debit) > 0 : false;
                const isCredit = primaryLine ? Number(primaryLine.credit) > 0 : false;
                const amount = entityType === 'Journal' || entityType === 'Cost Center'
                    ? Number(entry.total || 0)
                    : primaryLine
                        ? (isDebit ? primaryLine.debit : primaryLine.credit)
                        : (entry.lines?.reduce((sum, l) => sum + Number(l.debit), 0) || 0);
                const amountCurrency = entry.currency || entityData?.currency || 'JOD';

                // Aesthetic Emerald/Coral hex codes
                const emerald = '#059669';
                const coral = '#e11d48';

                return (
                    <div key={rowKey} style={{
                        padding: '1.25rem', background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `5px solid ${isDebit ? emerald : (isCredit ? coral : 'var(--color-border)')}`,
                        borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.12)' : 'none'
                    }} onClick={() => setExpandedEntry(isExpanded ? null : rowKey)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary-600)', background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))', padding: '2px 6px', borderRadius: '4px' }}>
                                    {entryDisplayRef(entry)}
                                </span>
                                <AestheticBadge
                                    status={isDebit ? `${t.debit} (+)` : (isCredit ? `${t.credit} (-)` : t.manual)}
                                    type={isDebit ? 'debit' : (isCredit ? 'credit' : 'manual')}
                                />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{entry.date}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', flex: 1, letterSpacing: '-0.01em' }}>{entry.description}</p>
                            <span style={{
                                fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em',
                                color: isDebit ? emerald : (isCredit ? coral : 'var(--color-text-main)')
                            }}>
                                {isDebit ? '+' : (isCredit ? '-' : '')}{amount.toLocaleString()} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{amountCurrency}</span>
                            </span>
                        </div>

                        {/* Detailed Entry List (Journal Style) */}
                        {isExpanded && (
                            <div style={{
                                marginTop: '0.5rem', padding: '1rem', background: 'var(--color-bg-secondary)',
                                borderRadius: '12px', border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.details}</p>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{entry.sourceType || 'Ledger Entry'}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {entry.lines.map((l, idx) => {
                                        const accountName = l.account_name || accounts.find(a => a.id === l.account)?.name || l.account;
                                        const isHighlight = matchingLines.some(ml => ml.id === l.id);
                                        const lDebit = Number(l.debit);
                                        const lCredit = Number(l.credit);

                                        return (
                                            <div key={idx} style={{
                                                display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                                                fontSize: '0.75rem', padding: '0.4rem 0.5rem',
                                                borderRadius: '6px',
                                                background: isHighlight ? 'var(--color-bg-surface)' : 'transparent',
                                                border: isHighlight ? '1px solid color-mix(in srgb, var(--color-primary-600) 35%, var(--color-border))' : 'none',
                                                fontWeight: isHighlight ? 800 : 500,
                                                color: isHighlight ? 'var(--color-primary-500)' : 'var(--color-text-secondary)',
                                                boxShadow: isHighlight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                                            }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{accountName}</div>
                                                <div style={{ textAlign: 'right', color: lDebit > 0 ? emerald : 'inherit', fontWeight: lDebit > 0 ? 800 : 500 }}>
                                                    {lDebit > 0 ? `+${lDebit.toLocaleString()}` : '—'}
                                                </div>
                                                <div style={{ textAlign: 'right', color: lCredit > 0 ? coral : 'inherit', fontWeight: lCredit > 0 ? 800 : 500 }}>
                                                    {lCredit > 0 ? `-${lCredit.toLocaleString()}` : '—'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {entry.isAutomatic ? <Monitor size={12} /> : <User size={12} />}
                                    {entry.isAutomatic ? t.automatic : t.manual}
                                </span>
                                {isGroup && matchingLines.length > 0 && !isExpanded && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {Array.from(new Set(matchingLines.map(l => l.account))).map(accId => (
                                            <span key={accId} style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-muted)', background: 'var(--color-bg-subtle)', padding: '1px 5px', borderRadius: '3px' }}>
                                                #{accId}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const RelatedTab = ({ t, entityType, data, isCostCenterRelatedLoading, isCostCenterRelatedError }) => {
    const journalMeta = data?.related?.journal_entry;
    const costRel = data?.costCenterRelated;
    const normalizeLabel = (value) => {
        if (!value || typeof value !== 'string') return '—';
        return value
            .split(/[\s_-]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const defaultRelatedIntro = 'This entity is structurally linked to the following accounting dimensions:';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>{t.connectedModules}</h4>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {entityType === 'Cost Center' && costRel?.connected_modules_description
                    ? costRel.connected_modules_description
                    : defaultRelatedIntro}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {entityType === 'Account' && (
                    <>
                        <RelatedItem label="General Ledger" value="Primary Source" />
                        <RelatedItem label="Balance Sheet" value="Financial Position" />
                    </>
                )}
                {entityType === 'Bank' && (
                    <>
                        <RelatedItem label="GL Mapping" value={data.glAccountId} />
                        <RelatedItem label="Treasury" value="Cash Management" />
                    </>
                )}
                {entityType === 'Customer' && (
                    <>
                        <RelatedItem label="AR Controller" value="Trade Receivables" />
                        <RelatedItem label="Collection" value="Sales Ledger" />
                    </>
                )}
                {entityType === 'Asset' && (
                    <>
                        <RelatedItem label="Asset Register" value="Fixed Assets" />
                        <RelatedItem label="Depreciation" value="Valuation Control" />
                    </>
                )}
                {entityType === 'Journal' && (
                    <>
                        <RelatedItem label="Reference" value={data?.reference || journalMeta?.reference || journalMeta?.id || data?.id || '—'} />
                        <RelatedItem label="Title" value={journalMeta?.title || data?.title || '—'} />
                        <RelatedItem label="Source" value={normalizeLabel(journalMeta?.source || data?.source)} />
                        <RelatedItem label="Status" value={normalizeLabel(journalMeta?.status || data?.status)} />
                        <RelatedItem label="Created By" value={journalMeta?.created_by || data?.createdBy || '—'} />
                    </>
                )}
                {entityType === 'Cost Center' && (
                    <>
                        {isCostCenterRelatedLoading && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>Loading related data…</p>
                        )}
                        {isCostCenterRelatedError && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-error)', margin: 0 }}>Could not load related dimensions.</p>
                        )}
                        {!isCostCenterRelatedLoading && !isCostCenterRelatedError && (
                            <>
                                {(costRel?.accounts || []).length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>No linked accounts.</p>
                                ) : (
                                    (costRel?.accounts || []).map((acc, idx) => (
                                        <RelatedItem
                                            key={acc?.id ?? acc?.account ?? idx}
                                            label={acc?.name || acc?.account_name || acc?.code || 'Account'}
                                            value={acc?.id ?? acc?.account ?? '—'}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const RelatedItem = ({ label, value }) => (
    <div style={{
        padding: '1rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
    }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{value}</span>
    </div>
);

export default FinancialDrawer;
