import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { X, Calendar, ArrowRight, ArrowLeft, Filter, Search, Tag, Info, List, Link as LinkIcon, Monitor, User, DollarSign, Target, Activity, FileText, Landmark, Download, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccounting } from '../../../context/AccountingContext';
import { useLanguage } from '../../../context/LanguageContext';
import { exportToCSV } from '../../../utils/exportUtils';

const FinancialDrawer = () => {
    const {
        drawerState, closeDrawer, accounts, entries, customers,
        costCenters, bankAccounts, getAccountBalance, getAllChildAccountIds
    } = useAccounting();
    const { language } = useLanguage();
    const { isOpen, entityType, entityId } = drawerState;
    const [activeTab, setActiveTab] = useState('overview');

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
            goToEntry: 'انتقال للقيد'
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
            goToEntry: 'Go to Entry'
        };
    }, [language]);

    // Derived Data
    const entityData = useMemo(() => {
        if (!entityType || !entityId) return null;
        switch (entityType) {
            case 'Account': return accounts.find(a => a.id === entityId);
            case 'Journal': return entries.find(e => e.id === entityId);
            case 'Customer': return customers.find(c => c.id === entityId);
            case 'Asset': return accounts.find(a => a.id === entityId);
            case 'Bank': return bankAccounts.find(b => b.id === entityId);
            case 'Cost Center': return costCenters.find(cc => cc.id === entityId);
            default: return null;
        }
    }, [entityType, entityId, accounts, entries, customers, costCenters, bankAccounts]);

    // Transaction History for Entity (Supports Aggregation)
    const transactionHistory = useMemo(() => {
        if (!entityType || !entityId || !entityData) return [];

        let relatedEntries = [];

        if (entityType === 'Account' || entityType === 'Asset') {
            const targetIds = entityData.isGroup ? [entityId, ...getAllChildAccountIds(entityId)] : [entityId];
            relatedEntries = entries.filter(e => e.lines.some(l => targetIds.includes(l.account)));
        } else if (entityType === 'Journal') {
            relatedEntries = [entityData];
        } else if (entityType === 'Bank') {
            relatedEntries = entries.filter(e => e.lines.some(l => l.account === entityData.glAccountId));
        } else if (entityType === 'Cost Center') {
            relatedEntries = entries.filter(e => e.lines.some(l => l.costCenter === entityId));
        } else if (entityType === 'Customer') {
            relatedEntries = entries.filter(e => e.description.includes(entityData.name) || e.reference.includes(entityId));
        }

        return relatedEntries.sort((a, b) => b.date.localeCompare(a.date));
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
                    width: '100%', maxWidth: '520px', background: 'white',
                    height: '100%', display: 'flex', flexDirection: 'column',
                    boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
                    animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-slate-100)', position: 'relative' }}>
                    <button
                        onClick={closeDrawer}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'var(--color-slate-50)', border: 'none',
                            borderRadius: '50%', width: '32px', height: '32px',
                            cursor: 'pointer', color: 'var(--color-slate-500)',
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
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-slate-900)' }}>{entityData?.name || 'Unknown Entity'}</h3>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>{t.overview}</TabButton>
                        <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>{t.transactions}</TabButton>
                        <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')}>{t.related}</TabButton>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--color-slate-50)' }}>
                    {activeTab === 'overview' && <OverviewTab t={t} entityType={entityType} data={entityData} history={transactionHistory} getAccountBalance={getAccountBalance} />}
                    {activeTab === 'transactions' && <TransactionsTab language={language} t={t} history={transactionHistory} entityName={entityData?.name} entityType={entityType} entityId={entityId} entityData={entityData} accounts={accounts} getAllChildAccountIds={getAllChildAccountIds} />}
                    {activeTab === 'related' && <RelatedTab t={t} entityType={entityType} data={entityData} />}
                </div>

                {/* Footer / Actions */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-slate-100)', display: 'flex', gap: '1rem', background: 'white' }}>
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

const TabButton = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        style={{
            background: 'none', border: 'none', padding: '0.5rem 0',
            fontSize: '0.875rem', fontWeight: 800,
            color: active ? 'var(--color-primary-600)' : 'var(--color-slate-400)',
            borderBottom: active ? '3px solid var(--color-primary-600)' : '3px solid transparent',
            cursor: 'pointer', transition: 'all 0.3s',
            letterSpacing: '0.01em'
        }}
    >
        {children}
    </button>
);

const AestheticBadge = ({ status, type }) => {
    const emerald = { bg: '#ecfdf5', text: '#059669', border: '#10b981' };
    const coral = { bg: '#fff1f2', text: '#e11d48', border: '#f43f5e' };
    const slate = { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };

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

const OverviewTab = ({ t, entityType, data, history, getAccountBalance }) => {
    const balance = entityType === 'Account' || entityType === 'Bank' || entityType === 'Asset'
        ? getAccountBalance(entityType === 'Bank' ? data.glAccountId : data.id)
        : (data?.balance || 0);

    const lastTransaction = history.length > 0 ? history[0].date : 'N/A';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
                background: 'white', padding: '1.5rem', borderRadius: '20px',
                border: '1px solid var(--color-slate-100)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-400)', fontWeight: 600, marginBottom: '0.5rem' }}>{t.currentBalance}</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-slate-900)', letterSpacing: '-0.04em' }}>
                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{ fontSize: '1rem', color: 'var(--color-slate-400)' }}>JOD</span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success-500)' }}></div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                        Real-time Ledger Sync Complete
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '16px', background: 'white', border: 'none' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t.activityCount}</p>
                    <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>{history.length}</p>
                </Card>
                <Card style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '16px', background: 'white', border: 'none' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t.lastTransaction}</p>
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-slate-900)' }}>{lastTransaction}</p>
                </Card>
            </div>

            {data?.description && (
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-slate-700)' }}>{t.description}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-500)', lineHeight: 1.6 }}>
                        {data.description}
                    </p>
                </div>
            )}
        </div>
    );
};

const TransactionsTab = ({ language, t, history, entityName, entityType, entityId, entityData, accounts, getAllChildAccountIds }) => {
    const [expandedEntry, setExpandedEntry] = useState(null);

    const handleDetailedExport = () => {
        const fullLedger = [];
        history.forEach(entry => {
            entry.lines.forEach(line => {
                const account = accounts.find(a => a.id === line.account);
                const isDebit = Number(line.debit) > 0;
                fullLedger.push({
                    'Date': entry.date,
                    'JournalID': entry.id,
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

    if (history.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-slate-400)' }}>
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
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-slate-800)' }}>{t.historyLogs}</span>
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
                    if (entityType === 'Account' || entityType === 'Asset') return targetIds.includes(l.account);
                    if (entityType === 'Bank') return l.account === entityData.glAccountId;
                    if (entityType === 'Cost Center') return l.costCenter === entityId;
                    if (entityType === 'Customer') return l.account === '1140' && (entry.description.includes(entityData.name) || entry.reference.includes(entityId));
                    return false;
                });

                const isExpanded = expandedEntry === entry.id;
                const primaryLine = matchingLines[0];
                const isDebit = primaryLine ? Number(primaryLine.debit) > 0 : false;
                const isCredit = primaryLine ? Number(primaryLine.credit) > 0 : false;
                const amount = primaryLine ? (isDebit ? primaryLine.debit : primaryLine.credit) : (entry.lines?.reduce((sum, l) => sum + Number(l.debit), 0) || 0);

                // Aesthetic Emerald/Coral hex codes
                const emerald = '#059669';
                const coral = '#e11d48';

                return (
                    <div key={entry.id} style={{
                        padding: '1.25rem', background: 'white',
                        border: '1px solid var(--color-slate-100)',
                        borderLeft: `5px solid ${isDebit ? emerald : (isCredit ? coral : 'var(--color-slate-300)')}`,
                        borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.05)' : 'none'
                    }} onClick={() => setExpandedEntry(isExpanded ? null : entry.id)} className="hover:shadow-md hover:-translate-y-0.5">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary-600)', background: 'var(--color-primary-50)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {entry.id}
                                </span>
                                <AestheticBadge
                                    status={isDebit ? `${t.debit} (+)` : (isCredit ? `${t.credit} (-)` : t.manual)}
                                    type={isDebit ? 'debit' : (isCredit ? 'credit' : 'manual')}
                                />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-400)' }}>{entry.date}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-900)', flex: 1, letterSpacing: '-0.01em' }}>{entry.description}</p>
                            <span style={{
                                fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em',
                                color: isDebit ? emerald : (isCredit ? coral : 'var(--color-slate-900)')
                            }}>
                                {isDebit ? '+' : (isCredit ? '-' : '')}{amount.toLocaleString()} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>JOD</span>
                            </span>
                        </div>

                        {/* Detailed Entry List (Journal Style) */}
                        {isExpanded && (
                            <div style={{
                                marginTop: '0.5rem', padding: '1rem', background: 'var(--color-slate-50)',
                                borderRadius: '12px', border: '1px solid var(--color-slate-100)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.details}</p>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>{entry.sourceType || 'Ledger Entry'}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {entry.lines.map((l, idx) => {
                                        const accountName = accounts.find(a => a.id === l.account)?.name || l.account;
                                        const isHighlight = matchingLines.some(ml => ml.id === l.id);
                                        const lDebit = Number(l.debit);
                                        const lCredit = Number(l.credit);

                                        return (
                                            <div key={idx} style={{
                                                display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                                                fontSize: '0.75rem', padding: '0.4rem 0.5rem',
                                                borderRadius: '6px',
                                                background: isHighlight ? 'white' : 'transparent',
                                                border: isHighlight ? '1px solid var(--color-primary-100)' : 'none',
                                                fontWeight: isHighlight ? 800 : 500,
                                                color: isHighlight ? 'var(--color-primary-700)' : 'var(--color-slate-600)',
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
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {entry.isAutomatic ? <Monitor size={12} /> : <User size={12} />}
                                    {entry.isAutomatic ? t.automatic : t.manual}
                                </span>
                                {isGroup && matchingLines.length > 0 && !isExpanded && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {Array.from(new Set(matchingLines.map(l => l.account))).map(accId => (
                                            <span key={accId} style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-slate-400)', background: 'var(--color-slate-100)', padding: '1px 5px', borderRadius: '3px' }}>
                                                #{accId}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isExpanded ? <ChevronUp size={16} color="var(--color-slate-400)" /> : <ChevronDown size={16} color="var(--color-slate-400)" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const RelatedTab = ({ t, entityType, data }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-slate-800)', letterSpacing: '-0.01em' }}>{t.connectedModules}</h4>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', lineHeight: 1.5 }}>
                This entity is structurally linked to the following accounting dimensions:
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
            </div>
        </div>
    );
};

const RelatedItem = ({ label, value }) => (
    <div style={{
        padding: '1rem', background: 'white', border: '1px solid var(--color-slate-100)',
        borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
    }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-400)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-slate-800)' }}>{value}</span>
    </div>
);

export default FinancialDrawer;
