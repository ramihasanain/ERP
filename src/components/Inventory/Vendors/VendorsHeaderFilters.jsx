import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Search, Plus, Filter } from 'lucide-react';

const VendorsHeaderFilters = ({
    filteredCount,
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    onClearFilters,
    onAddVendor,
}) => {
    const { t } = useTranslation(['inventory', 'common']);
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth < 1100);

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div
            style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
            }}
        >
            <div style={{ display: 'flex', flexDirection: isNarrowScreen ? 'column' : 'row', justifyContent: 'space-between', alignItems: isNarrowScreen ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('vendors.title')}</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        {t('vendors.partnersConnected', { count: filteredCount })}
                    </p>
                </div>
                <Button icon={<Plus size={16} />} size={isNarrowScreen ? 'sm' : undefined} onClick={onAddVendor} style={{ alignSelf: isNarrowScreen ? 'flex-end' : 'auto' }}>
                    {t('vendors.addVendor')}
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: '300px' }}>
                    <Input
                        placeholder="Search vendors..."
                        startIcon={<Search size={16} />}
                        style={{ fontSize: '0.875rem' }}
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={14} color="var(--color-text-muted)" />
                    <div
                        style={{
                            display: 'flex',
                            background: 'var(--color-bg-toggle-track)',
                            padding: '4px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {['All', 'Active', 'Inactive'].map((statusItem) => (
                            <button
                                key={statusItem}
                                type="button"
                                onClick={() => onStatusFilterChange(statusItem)}
                                style={{
                                    padding: '6px 14px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background:
                                        statusFilter === statusItem
                                            ? 'var(--color-bg-surface)'
                                            : 'transparent',
                                    boxShadow:
                                        statusFilter === statusItem
                                            ? '0 2px 4px rgba(0,0,0,0.08)'
                                            : 'none',
                                    color:
                                        statusFilter === statusItem
                                            ? 'var(--color-primary-600)'
                                            : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                }}
                            >
                                {statusItem}
                            </button>
                        ))}
                    </div>
                </div>

                {(searchTerm || statusFilter !== 'All') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
};

export default VendorsHeaderFilters;
