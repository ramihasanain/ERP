import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch } from '@/hooks/useMutation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save, Globe, Lock, Bell, Shield, Percent } from 'lucide-react';
import TaxSettings from '@/components/Settings/TaxSettings';

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const updateCompanySettings = useCustomPatch('/api/tenants/clients/settings/', ['company-settings']);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            company_name: '',
            industry: '',
            tax_id: '',
            default_currency: '',
            date_format: 'DD/MM/YYYY',
            timezone: 'Africa/Egypt',
        },
    });

    const listFromResponse = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.results)) return response.results;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        return [];
    };

    const settingsQuery = useCustomQuery('/api/tenants/clients/settings/', ['company-settings']);
    const industriesQuery = useCustomQuery('/api/tenants/industries/', ['settings-industries']);
    const currenciesQuery = useCustomQuery('/api/shared/currencies/', ['settings-currencies']);

    const industries = useMemo(() => {
        return listFromResponse(industriesQuery.data)
            .map((item) => ({
                id: item?.id || item?.uuid || item?.value || '',
                name: item?.name || item?.title || item?.label || '',
            }))
            .filter((item) => item.id && item.name);
    }, [industriesQuery.data]);

    const currencies = useMemo(() => {
        return listFromResponse(currenciesQuery.data)
            .map((item) => ({
                id: item?.id || item?.uuid || item?.value || '',
                name: item?.name || item?.code || item?.title || item?.label || '',
            }))
            .filter((item) => item.id && item.name);
    }, [currenciesQuery.data]);

    useEffect(() => {
        if (!settingsQuery.data) return;

        const data = settingsQuery.data?.data && typeof settingsQuery.data.data === 'object'
            ? settingsQuery.data.data
            : settingsQuery.data;

        reset({
            company_name: data?.company_name || '',
            industry: data?.industry || '',
            tax_id: data?.tax_id || '',
            default_currency: data?.default_currency || '',
            date_format: data?.date_format || 'DD/MM/YYYY',
            timezone: data?.timezone || 'Africa/Egypt',
        });
    }, [settingsQuery.data, reset]);

    const onSubmitGeneral = async (values) => {
        const payload = {
            company_name: values.company_name?.trim() || '',
            industry: values.industry || null,
            tax_id: values.tax_id?.trim() || '',
            default_currency: values.default_currency || null,
            date_format: values.date_format || 'DD/MM/YYYY',
            timezone: values.timezone || 'Africa/Egypt',
        };

        try {
            await updateCompanySettings.mutateAsync(payload);
            toast.success('Company settings updated successfully.');
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to update company settings.';
            toast.error(message);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={18} /> },
        { id: 'security', label: 'Security', icon: <Lock size={18} /> },
        { id: 'tax', label: 'Tax Management', icon: <Percent size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'permissions', label: 'Permissions & Roles', icon: <Shield size={18} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Settings</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage your workspace preferences.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                {/* Underline tabs — left-aligned, full-width rule below */}
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

                {/* Content */}
                <div style={{ width: '100%', minWidth: 0 }}>
                    {activeTab === 'general' && (
                        <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Company Profile</h3>

                            {(settingsQuery.isLoading || industriesQuery.isLoading || currenciesQuery.isLoading) && <Spinner />}

                            {(settingsQuery.isError || industriesQuery.isError || currenciesQuery.isError) && (
                                <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                                    Could not load company settings data.
                                </div>
                            )}

                            {!settingsQuery.isLoading && !industriesQuery.isLoading && !currenciesQuery.isLoading && (
                                <form onSubmit={handleSubmit(onSubmitGeneral)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <Controller
                                            name="company_name"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    label="Company Name"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="industry"
                                            control={control}
                                            render={({ field }) => (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Industry</label>
                                                    <select
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                                    >
                                                        <option value="">Select industry</option>
                                                        {industries.map((industry) => (
                                                            <option key={industry.id} value={industry.id}>
                                                                {industry.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        />

                                        <Controller
                                            name="tax_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    label="Tax ID"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="default_currency"
                                            control={control}
                                            render={({ field }) => (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Default Currency</label>
                                                    <select
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        disabled
                                                        style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                                    >
                                                        <option value="">Select currency</option>
                                                        {currencies.map((currency) => (
                                                            <option key={currency.id} value={currency.id}>
                                                                {currency.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        />
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Localization</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <Controller
                                                name="date_format"
                                                control={control}
                                                render={({ field }) => (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Date Format</label>
                                                        <select
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                                        >
                                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                        </select>
                                                    </div>
                                                )}
                                            />
                                            <Controller
                                                name="timezone"
                                                control={control}
                                                render={({ field }) => (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Timezone</label>
                                                        <select
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                                        >
                                                            <option value="Africa/Amman">Africa/Amman</option>
                                                            <option value="Asia/Riyadh">Asia/Riyadh</option>
                                                            <option value="Europe/Berlin">Europe/Berlin</option>
                                                            <option value="America/New_York">America/New_York</option>
                                                            <option value="Africa/Egypt">Africa/Egypt</option>
                                                        </select>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <Button icon={<Save size={18} />} type="submit" disabled={updateCompanySettings.isPending}>
                                            {updateCompanySettings.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            )}
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
