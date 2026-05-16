import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Download, Lock, Unlock, ShieldAlert, ArrowLeft } from 'lucide-react';
import JournalEntryList from '@/components/Accounting/JournalEntryList';
import JournalEntryDetailModal from '@/components/Accounting/JournalEntryDetailModal';
import { useAccounting } from '@/context/AccountingContext';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { exportToCSV } from '@/utils/exportUtils';
import useCustomQuery from '@/hooks/useQuery';
import ResourceLoadError from '@/core/ResourceLoadError';

const PeriodStatusCard = () => {
    const { t } = useTranslation('accounting');
    const { accountingPeriods, togglePeriodStatus } = useAccounting();

    const getPeriodStatusLabel = (status) => {
        const map = {
            Open: t('journalEntries.periodOpen'),
            'Soft Lock': t('journalEntries.periodSoftLock'),
            'Hard Lock': t('journalEntries.periodHardLock'),
        };
        return map[status] || status;
    };

    const sortedPeriods = [...accountingPeriods].sort((a, b) => b.month.localeCompare(a.month));

    return (
        <Card className="padding-md" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={18} /> {t('journalEntries.accountingPeriods')}
                </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {sortedPeriods.map(p => (
                    <div key={p.month} style={{
                        background: 'var(--color-bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)', flex: '1', minWidth: '200px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{p.month}</div>
                            <div style={{
                                fontSize: '0.75rem', marginTop: '0.25rem',
                                color: p.status === 'Open' ? 'var(--color-success-600)' :
                                    p.status === 'Soft Lock' ? 'var(--color-warning-600)' : 'var(--color-danger-600)'
                            }}>
                                {getPeriodStatusLabel(p.status)}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePeriodStatus(p.month)}
                            title={t('journalEntries.toggleStatus')}
                        >
                            {p.status === 'Open' ? <Unlock size={16} /> : <Lock size={16} />}
                        </Button>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const JournalEntries = () => {
    const { t } = useTranslation('accounting');
    const { accounts } = useAccounting();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const journalEntriesUrl = useMemo(() => {
        const trimmedSearch = searchTerm.trim();
        if (!trimmedSearch) return '/accounting/journal-entries/';

        const params = new URLSearchParams({ search: trimmedSearch });
        return `/accounting/journal-entries/?${params.toString()}`;
    }, [searchTerm]);

    const journalEntriesQuery = useCustomQuery(journalEntriesUrl, ['journal-entries', searchTerm.trim()]);
    const entries = useMemo(() => {
        const source = journalEntriesQuery.data;
        if (Array.isArray(source)) return source;
        if (Array.isArray(source?.data)) return source.data;
        if (Array.isArray(source?.results)) return source.results;
        return [];
    }, [journalEntriesQuery.data]);

    const handleDetailedExport = () => {
        const fullLedger = [];

        entries.forEach(entry => {
            const lines = entry.lines;
            if (!Array.isArray(lines) || lines.length === 0) return;
            lines.forEach(line => {
                const account = accounts.find(a => a.id === line.account);
                const isDebit = Number(line.debit) > 0;

                fullLedger.push({
                    [t('journalEntries.exportDate')]: entry.date,
                    [t('journalEntries.exportReference')]: entry.reference || entry.id,
                    [t('journalEntries.exportEntryDescription')]: entry.description,
                    [t('journalEntries.exportAccountCode')]: line.account,
                    [t('journalEntries.exportAccountName')]: account?.name || t('journalEntries.unknownAccount'),
                    [t('journalEntries.exportLineDescription')]: line.description || '',
                    [t('journalEntries.exportDebit')]: isDebit ? line.debit : 0,
                    [t('journalEntries.exportCredit')]: !isDebit ? line.credit : 0,
                    [t('journalEntries.exportSign')]: isDebit ? '+' : '-',
                    [t('journalEntries.exportDirection')]: isDebit ? t('journalEntries.debit') : t('journalEntries.credit'),
                    [t('journalEntries.exportSource')]: entry.sourceType || t('journalEntries.manual'),
                });
            });
        });

        exportToCSV(fullLedger, 'All_Journal_Entries_Detailed');
    };

    const openDetailModal = (entryId) => {
        setSelectedEntryId(entryId);
        setIsDetailOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(`${basePath}/accounting`)}
                        className="cursor-pointer shrink-0"
                    />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('journalEntries.title')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{t('journalEntries.subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }} className="shrink-0">
                    <Button variant="outline" icon={<Download size={16} />} onClick={handleDetailedExport} className="cursor-pointer">
                        {t('journalEntries.detailedExport')}
                    </Button>
                    <Button icon={<Plus size={16} />} onClick={() => navigate('new')} className="cursor-pointer">
                        {t('journalEntries.newEntry')}
                    </Button>
                </div>
            </div>

            {journalEntriesQuery.isError ? (
                <ResourceLoadError
                    error={journalEntriesQuery.error}
                    title={t('journalEntries.loadFailed')}
                    onGoBack={() => navigate(`${basePath}/accounting`)}
                />
            ) : (
                <>
                    <PeriodStatusCard />

                    <Card className="padding-none" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('journalEntries.allEntries')}</h2>
                            <div style={{ width: '240px' }}>
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('journalEntries.searchPlaceholder')}
                                    startIcon={<Search size={16} />}
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>

                        {journalEntriesQuery.isLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                {t('journalEntries.loading')}
                            </div>
                        ) : (
                            <JournalEntryList entries={entries} onViewEntry={openDetailModal} />
                        )}
                    </Card>
                </>
            )}

            <JournalEntryDetailModal
                isOpen={isDetailOpen}
                entryId={selectedEntryId}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedEntryId(null);
                }}
            />
        </div>
    );
};

export default JournalEntries;
