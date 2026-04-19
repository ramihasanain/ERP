import React from 'react';
import Card from '@/components/Shared/Card';

const NotificationsSettingsTab = () => (
    <Card className="padding-lg">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Notification Preferences</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your email alerts.</p>
    </Card>
);

export default NotificationsSettingsTab;
