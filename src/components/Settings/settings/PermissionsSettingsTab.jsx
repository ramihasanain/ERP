import React from 'react';
import Card from '@/components/Shared/Card';
import PermissionsManagerContent from '@/components/permissions/PermissionsManagerContent';

const PermissionsSettingsTab = () => (
    <Card className="padding-lg" style={{ textAlign: 'left' }}>
        <PermissionsManagerContent embedded />
    </Card>
);

export default PermissionsSettingsTab;
