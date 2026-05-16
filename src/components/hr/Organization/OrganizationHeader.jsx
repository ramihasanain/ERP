import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Shared/Button';

const OrganizationHeader = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation(['hr', 'common']);
    return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('organization.title')}</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('organization.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant={activeTab === 'departments' ? 'primary' : 'outline'} onClick={() => onTabChange('departments')}>
                {t('organization.departments')}
            </Button>
            <Button variant={activeTab === 'positions' ? 'primary' : 'outline'} onClick={() => onTabChange('positions')}>
                {t('organization.jobPositions')}
            </Button>
        </div>
    </div>
    );
};

export default OrganizationHeader;
