import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';

const SecuritySettingsTab = () => {
    const { t } = useTranslation(['settings', 'common']);

    return (
        <Card className="padding-lg">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{t('security.title')}</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
                {t('security.twoFactorPrefix')}{' '}
                <strong>{t('security.enabled')}</strong>.
            </p>
        </Card>
    );
};

export default SecuritySettingsTab;
