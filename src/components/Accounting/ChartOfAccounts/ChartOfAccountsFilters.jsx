import React from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Lock, RotateCcw, Search, Shield, X } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';

const chipWrapperStyle = {
    display: 'flex',
    background: 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-body))',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
};

const FilterChip = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: active ? '1px solid var(--color-border)' : 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            background: active ? 'var(--color-bg-surface)' : 'transparent',
            color: active ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        }}
    >
        {icon}
        {label}
    </button>
);

const ChartOfAccountsFilters = ({
    t,
    language,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterSource,
    setFilterSource,
    accountTypes,
    accountsForExport,
    onExpandAll,
    onCollapseAll,
    onResetFilters,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                    style={{
                        flex: '1 1 360px',
                        minWidth: '280px',
                        display: 'flex',
                        alignItems: 'center',
                        height: '46px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        background: 'var(--color-bg-surface)',
                    }}
                >
                    <div style={{ padding: '0 1.25rem', color: 'var(--color-text-muted)' }}>
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            height: '100%',
                            fontSize: '1rem',
                            outline: 'none',
                            fontWeight: 500,
                            color: 'var(--color-text-main)',
                            direction: language === 'ar' ? 'rtl' : 'ltr',
                        }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{
                                padding: '0 1rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" onClick={() => exportToCSV(accountsForExport, 'CoA')} icon={<Download size={16} />}>
                        {t.export}
                    </Button>
                    <Button variant="ghost" onClick={onExpandAll} size="sm">
                        {t.expandAll}
                    </Button>
                    <Button variant="ghost" onClick={onCollapseAll} size="sm">
                        {t.collapseAll}
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={chipWrapperStyle}>
                    <FilterChip
                        active={filterType === 'All'}
                        onClick={() => setFilterType('All')}
                        label={t.allTypes}
                    />
                    {accountTypes.map((type) => (
                        <FilterChip
                            key={type.id}
                            active={filterType === type.id}
                            onClick={() => setFilterType(type.id)}
                            label={type.label}
                        />
                    ))}
                </div>

                <div style={chipWrapperStyle}>
                    <FilterChip active={filterSource === 'All'} onClick={() => setFilterSource('All')} label={t.allSources} />
                    <FilterChip
                        active={filterSource === 'System'}
                        onClick={() => setFilterSource('System')}
                        label={t.systemOnly}
                        icon={<Lock size={12} />}
                    />
                    <FilterChip
                        active={filterSource === 'Custom'}
                        onClick={() => setFilterSource('Custom')}
                        label={t.customOnly}
                        icon={<Shield size={12} />}
                    />
                </div>

                {(searchTerm || filterType !== 'All' || filterSource !== 'All') && (
                    <Button
                        variant="ghost"
                        icon={<RotateCcw size={14} />}
                        onClick={onResetFilters}
                        size="sm"
                        style={{ color: 'var(--color-danger-600)' }}
                    >
                        {t.reset}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ChartOfAccountsFilters;
