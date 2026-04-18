import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Download, Lock, Unlock, ShieldAlert } from 'lucide-react';
import JournalEntryList from '@/components/Accounting/JournalEntryList';
import JournalEntryDetailModal from '@/components/Accounting/JournalEntryDetailModal';
import { useAccounting } from '@/context/AccountingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '@/utils/exportUtils';
import useCustomQuery from '@/hooks/useQuery';
import { toast } from 'sonner';

const PeriodStatusCard = () => {
    const { accountingPeriods, togglePeriodStatus } = useAccounting();

    // Sort periods desc
    const sortedPeriods = [...accountingPeriods].sort((a, b) => b.month.localeCompare(a.month));

    return (
        <Card className="padding-md" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={18} /> Accounting Periods
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
                                {p.status}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePeriodStatus(p.month)}
                            title="Toggle Status (Admin)"
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
    const { accounts } = useAccounting();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const journalEntriesQuery = useCustomQuery('/accounting/journal-entries/', ['journal-entries']);
    const entries = useMemo(() => {
        const source = journalEntriesQuery.data;
        if (Array.isArray(source)) return source;
        if (Array.isArray(source?.data)) return source.data;
        if (Array.isArray(source?.results)) return source.results;
        return [];
    }, [journalEntriesQuery.data]);

    useEffect(() => {
        if (journalEntriesQuery.error) {
            toast.error(language === 'ar' ? 'فشل تحميل قيود اليومية' : 'Failed to load journal entries.');
        }
    }, [journalEntriesQuery.error, language]);

    const handleDetailedExport = () => {
        const fullLedger = [];

        entries.forEach(entry => {
            const lines = entry.lines;
            if (!Array.isArray(lines) || lines.length === 0) return;
            lines.forEach(line => {
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

        exportToCSV(fullLedger, 'All_Journal_Entries_Detailed');
    };

    const openDetailModal = (entryId) => {
        setSelectedEntryId(entryId);
        setIsDetailOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{language === 'ar' ? 'القيود اليومية' : 'Journal Entries'}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{language === 'ar' ? 'مراجعة وإدارة قيود اليومية اليدوية والآلية.' : 'Review and manage manual and system journal entries.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Download size={16} />} onClick={handleDetailedExport}>
                        {language === 'ar' ? 'تصدير تفصيلي' : 'Detailed Export'}
                    </Button>
                    <Button icon={<Plus size={16} />} onClick={() => navigate('new')}>
                        {language === 'ar' ? 'قيد جديد' : 'New Entry'}
                    </Button>
                </div>
            </div>

            <PeriodStatusCard />

            <Card className="padding-none" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{language === 'ar' ? 'كل القيود' : 'All Entries'}</h2>
                    <div style={{ width: '240px' }}><Input placeholder={language === 'ar' ? 'بحث برقم القيد...' : "Search journal no..."} startIcon={<Search size={16} />} style={{ fontSize: '0.875rem' }} /></div>
                </div>

                {journalEntriesQuery.isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Loading journal entries...
                    </div>
                ) : (
                    <JournalEntryList entries={entries} onViewEntry={openDetailModal} />
                )}
            </Card>

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
