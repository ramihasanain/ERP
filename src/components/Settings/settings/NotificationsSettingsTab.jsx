import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import translateApiError from '@/utils/translateApiError';
import { getFcmRegistrationToken, storeFcmToken } from '@/services/firebase';
import { registerFcmToken } from '@/services/notificationsApi';

const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
};

const NotificationsSettingsTab = () => {
    const { t } = useTranslation(['settings', 'common']);
    const [isEnabling, setIsEnabling] = useState(false);
    const permission = useMemo(() => {
        if (typeof window === 'undefined') return 'unsupported';
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }, []);

    const permissionLabel = useMemo(() => {
        if (permission === 'unsupported') return t('notifications.statusUnsupported');
        const key = `notifications.permission.${permission}`;
        return t(key, { defaultValue: permission });
    }, [permission, t]);

    const enablePush = async () => {
        setIsEnabling(true);
        try {
            const token = await getFcmRegistrationToken();
            if (!token) {
                const msg =
                    permission === 'denied'
                        ? t('notifications.blockedInBrowser')
                        : t('notifications.enableFailed');
                toast.error(msg, errorToastOptions);
                return;
            }

            await registerFcmToken(token);
            storeFcmToken(token);
            toast.success(t('notifications.enableSuccess'), successToastOptions);
        } catch (error) {
            toast.error(translateApiError(error, 'settings:notifications.enableError'), errorToastOptions);
        } finally {
            setIsEnabling(false);
        }
    };

    return (
        <Card className="padding-lg">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{t('notifications.title')}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={rowStyle}>
                    <div style={{ minWidth: 240 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-main)' }}>{t('notifications.pushTitle')}</p>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            {t('notifications.pushDescription')}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={enablePush}
                            disabled={isEnabling || permission === 'denied' || permission === 'unsupported'}
                        >
                            {isEnabling ? t('notifications.enabling') : t('notifications.enableButton')}
                        </Button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {t('notifications.statusLabel')} {permissionLabel}
                        </span>
                    </div>
                </div>

                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {t('notifications.permissionHint')}
                </div>
            </div>
        </Card>
    );
};

export default NotificationsSettingsTab;
