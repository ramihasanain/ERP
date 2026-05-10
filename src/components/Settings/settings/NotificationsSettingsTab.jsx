import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
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
    const [isEnabling, setIsEnabling] = useState(false);
    const permission = useMemo(() => {
        if (typeof window === 'undefined') return 'unsupported';
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }, []);

    const enablePush = async () => {
        setIsEnabling(true);
        try {
            const token = await getFcmRegistrationToken();
            if (!token) {
                const msg =
                    permission === 'denied'
                        ? 'Notifications are blocked in your browser settings.'
                        : 'Could not enable push notifications on this device.';
                toast.error(msg, errorToastOptions);
                return;
            }

            await registerFcmToken(token);
            storeFcmToken(token);
            toast.success('Push notifications enabled for this browser.', successToastOptions);
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not enable push notifications.'), errorToastOptions);
        } finally {
            setIsEnabling(false);
        }
    };

    return (
        <Card className="padding-lg">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Notification Preferences</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={rowStyle}>
                    <div style={{ minWidth: 240 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-main)' }}>Push notifications</p>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            Enable browser notifications for important updates.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={enablePush}
                            disabled={isEnabling || permission === 'denied' || permission === 'unsupported'}
                        >
                            {isEnabling ? 'Enabling…' : 'Enable push notifications'}
                        </Button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Status: {permission === 'unsupported' ? 'Unsupported' : permission}
                        </span>
                    </div>
                </div>

                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    If you don’t see the permission prompt, check your browser’s site settings and make sure notifications are allowed.
                </div>
            </div>
        </Card>
    );
};

export default NotificationsSettingsTab;
