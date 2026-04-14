import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, Globe, Lock, Bell, Shield } from 'lucide-react';
import TaxSettings from '@/components/Settings/TaxSettings';

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={18} /> },
        { id: 'security', label: 'Security', icon: <Lock size={18} /> },
        { id: 'tax', label: 'Tax Management', icon: <Globe size={18} /> }, // New
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'permissions', label: 'Permissions & Roles', icon: <Shield size={18} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Settings</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage your workspace preferences.</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Settings Navigation */}
                <Card className="padding-md" style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                border: 'none',
                                background: activeTab === tab.id
                                    ? 'color-mix(in srgb, var(--color-primary-600) 20%, var(--color-bg-card))'
                                    : 'transparent',
                                color: activeTab === tab.id ? 'var(--color-primary-500)' : 'var(--color-text-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </Card>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    {activeTab === 'general' && (
                        <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Company Profile</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Company Name" defaultValue="Acme Corp" />
                                <Input label="Industry" defaultValue="Technology" />
                                <Input label="Tax ID" defaultValue="TRN-123456789" />
                                <Input label="Default Currency" defaultValue="USD" disabled />
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Localization</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Date Format</label>
                                        <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Timezone</label>
                                        <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <option>(GMT+03:00) Amman</option>
                                            <option>(GMT+03:00) Riyadh</option>
                                            <option>(GMT+01:00) Berlin</option>
                                            <option>(GMT-05:00) Eastern Time</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button icon={<Save size={18} />}>Save Changes</Button>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="padding-lg">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Security Settings</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>Two-Factor Authentication is currently <strong>Enabled</strong>.</p>
                        </Card>
                    )}

                    {activeTab === 'tax' && <TaxSettings />}

                    {activeTab === 'notifications' && (
                        <Card className="padding-lg">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Notification Preferences</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>Manage your email alerts.</p>
                        </Card>
                    )}

                    {activeTab === 'permissions' && (
                        <Card className="padding-lg" style={{ textAlign: 'center' }}>
                            <Shield size={48} style={{ color: 'var(--color-primary-600)', marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Permissions & Roles Management</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Create roles, define granular permissions (View/Edit/Delete), and assign them to employees.</p>
                            <Button icon={<Shield size={16} />} onClick={() => navigate('/admin/permissions')}>Open Permissions Manager</Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
