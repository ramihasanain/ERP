import React from 'react';
import Card from '@/components/Shared/Card';

const SecuritySettingsTab = () => (
    <Card className="padding-lg">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Security Settings</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
            Two-Factor Authentication is currently <strong>Enabled</strong>.
        </p>
    </Card>
);

export default SecuritySettingsTab;
