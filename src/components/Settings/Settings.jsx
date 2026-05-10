import React, { useState } from 'react';
import { Globe, Lock, Shield, Percent, CalendarDays } from 'lucide-react';
import TaxSettings from '@/components/Settings/TaxSettings';
import GeneralSettingsTab from '@/components/Settings/settings/GeneralSettingsTab';
import SecuritySettingsTab from '@/components/Settings/settings/SecuritySettingsTab';
import NotificationsSettingsTab from '@/components/Settings/settings/NotificationsSettingsTab';
import PermissionsSettingsTab from '@/components/Settings/settings/PermissionsSettingsTab';
import HolidaysTab from '@/components/Settings/settings/HolidaysTab';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={18} /> },
        { id: 'security', label: 'Security', icon: <Lock size={18} /> },
        { id: 'tax', label: 'Tax Management', icon: <Percent size={18} /> },
        { id: 'permissions', label: 'Permissions & Roles', icon: <Shield size={18} /> },
        { id: 'holidays', label: 'Holidays', icon: <CalendarDays size={18} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Settings</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage your workspace preferences.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <div
                        role="tablist"
                        aria-label="Settings sections"
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-end',
                            gap: '0.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            minWidth: 'min-content',
                        }}
                    >
                        {tabs.map((tab) => {
                            const selected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem 0.625rem',
                                        marginBottom: '-1px',
                                        border: 'none',
                                        borderBottom: selected
                                            ? '3px solid var(--color-primary-500)'
                                            : '3px solid transparent',
                                        background: 'transparent',
                                        color: selected ? 'var(--color-primary-500)' : 'var(--color-text-secondary)',
                                        fontWeight: selected ? 600 : 500,
                                        fontSize: '0.9375rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ width: '100%', minWidth: 0 }}>
                    {activeTab === 'general' && <GeneralSettingsTab />}
                    {activeTab === 'security' && <SecuritySettingsTab />}
                    {activeTab === 'tax' && <TaxSettings />}
                    {activeTab === 'permissions' && <PermissionsSettingsTab />}
                    {activeTab === 'holidays' && <HolidaysTab />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
