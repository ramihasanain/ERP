import React from 'react';
import Button from '@/components/Shared/Button';

const OrganizationHeader = ({ activeTab, onTabChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Organization</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Manage departments, hierarchy, and job positions.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant={activeTab === 'departments' ? 'primary' : 'outline'} onClick={() => onTabChange('departments')}>
                Departments
            </Button>
            <Button variant={activeTab === 'positions' ? 'primary' : 'outline'} onClick={() => onTabChange('positions')}>
                Job Positions
            </Button>
        </div>
    </div>
);

export default OrganizationHeader;
