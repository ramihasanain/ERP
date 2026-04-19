import React, { useEffect, useMemo } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch } from '@/hooks/useMutation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { listFromResponse } from './listFromResponse';
import { useCurrenciesInfiniteQuery } from './useCurrenciesInfiniteQuery';

/** Settings API returns FK ids (uuid); list APIs may use the same id on each item. */
const coerceSettingsRef = (raw) => {
    if (raw == null || raw === '') return '';
    if (typeof raw === 'object') {
        const v = raw?.uuid ?? raw?.id;
        return v != null && v !== '' ? String(v).trim() : '';
    }
    return String(raw).trim();
};

const normalizeIndustryValue = (raw, industries) => {
    const s = coerceSettingsRef(raw);
    if (!s) return '';
    if (industries.some((i) => i.value === s)) return s;
    const lower = s.toLowerCase();
    const byLabel = industries.find((i) => (i.label || '').toLowerCase() === lower);
    return byLabel ? byLabel.value : s;
};

const normalizeCurrencyValue = (raw, currencies) => {
    const s = coerceSettingsRef(raw);
    if (!s) return '';
    if (currencies.some((c) => c.id === s)) return s;
    const byCode = currencies.find((c) => (c.code || '').toUpperCase() === s.toUpperCase());
    return byCode ? byCode.id : s;
};

const selectStyle = {
    height: '2.5rem',
    padding: '0 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
};

const GeneralSettingsTab = () => {
    const updateCompanySettings = useCustomPatch('/api/tenants/clients/settings/', ['company-settings']);
    const settingsQuery = useCustomQuery('/api/tenants/clients/settings/', ['company-settings']);
    const industriesQuery = useCustomQuery('/api/shared/industries/', ['settings-industries']);
    const currenciesQuery = useCurrenciesInfiniteQuery();

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

    const defaultCurrencyId = useWatch({ control, name: 'default_currency' });

    const industries = useMemo(() => {
        return listFromResponse(industriesQuery.data)
            .map((item) => {
                if (typeof item === 'string') return null;
                const name = item?.name || item?.title || item?.label || '';
                const rawId = item?.uuid ?? item?.id;
                const value = rawId != null && rawId !== '' ? String(rawId) : '';
                const label = name || value;
                return { value, label };
            })
            .filter((item) => item && item.value && item.label);
    }, [industriesQuery.data]);

    const currencies = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const page of currenciesQuery.data?.pages ?? []) {
            for (const item of listFromResponse(page)) {
                const code = (item?.code || '').trim();
                const id = String(item?.uuid ?? item?.id ?? '');
                if (!code || !id || seen.has(id)) continue;
                seen.add(id);
                out.push({
                    id,
                    name: item?.name || item?.title || '',
                    code,
                });
            }
        }
        return out;
    }, [currenciesQuery.data]);

    const currencySelectOptions = useMemo(() => {
        const base = currencies.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.code})`,
        }));
        if (defaultCurrencyId && !currencies.some((c) => c.id === defaultCurrencyId)) {
            return [{ value: defaultCurrencyId, label: defaultCurrencyId }, ...base];
        }
        return base;
    }, [currencies, defaultCurrencyId]);

    useEffect(() => {
        if (!settingsQuery.data) return;

        const data =
            settingsQuery.data?.data && typeof settingsQuery.data.data === 'object'
                ? settingsQuery.data.data
                : settingsQuery.data;

        reset(
            {
                company_name: data?.company_name || '',
                industry: normalizeIndustryValue(data?.industry, industries),
                tax_id: data?.tax_id || '',
                default_currency: normalizeCurrencyValue(data?.default_currency, currencies),
                date_format: data?.date_format || 'DD/MM/YYYY',
                timezone: data?.timezone || 'Africa/Egypt',
            },
            { keepDirtyValues: true },
        );
    }, [settingsQuery.data, industries, currencies, reset]);

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

    const settingsFailed = settingsQuery.isError;
    const industriesFailed = industriesQuery.isError;
    const currenciesFailed = currenciesQuery.isError;

    const loading = settingsQuery.isLoading || industriesQuery.isLoading;

    const showForm = !settingsQuery.isLoading && !industriesQuery.isLoading;

    const {
        isLoading: currenciesInitialLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isFetchNextPageError,
    } = currenciesQuery;

    return (
        <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Company Profile</h3>

            {loading && <Spinner />}

            {settingsFailed && (
                <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                    Could not load company settings.
                </div>
            )}

            {industriesFailed && (
                <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                    Could not load industries. You can still pick a saved value or retry later.
                </div>
            )}

            {currenciesFailed && (
                <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                    Could not load currencies.
                </div>
            )}

            {showForm && !settingsFailed && (
                <form onSubmit={handleSubmit(onSubmitGeneral)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Controller
                            name="company_name"
                            control={control}
                            render={({ field }) => (
                                <Input label="Company Name" value={field.value} onChange={field.onChange} />
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
                                        disabled={industriesFailed && industries.length === 0 && !field.value}
                                        style={{
                                            ...selectStyle,
                                            opacity: industriesFailed && industries.length === 0 && !field.value ? 0.65 : 1,
                                            cursor:
                                                industriesFailed && industries.length === 0 && !field.value
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    >
                                        <option value="">Select industry</option>
                                        {field.value && !industries.some((i) => i.value === field.value) ? (
                                            <option value={field.value}>{field.value}</option>
                                        ) : null}
                                        {industries.map((industry) => (
                                            <option key={industry.value} value={industry.value}>
                                                {industry.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        />

                        <Controller
                            name="tax_id"
                            control={control}
                            render={({ field }) => <Input label="Tax ID" value={field.value} onChange={field.onChange} />}
                        />

                        <Controller
                            name="default_currency"
                            control={control}
                            render={({ field }) => (
                                <SelectWithLoadMore
                                    label="Default Currency"
                                    id="settings-default-currency"
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    options={currencySelectOptions}
                                    emptyOptionLabel="Select currency"
                                    disabled={currenciesFailed}
                                    isInitialLoading={currenciesInitialLoading && !currenciesQuery.data}
                                    hasMore={Boolean(hasNextPage) && !currenciesFailed}
                                    onLoadMore={() => fetchNextPage()}
                                    isLoadingMore={isFetchingNextPage}
                                    paginationError={
                                        isFetchNextPageError
                                            ? 'Could not load more currencies. Scroll down to retry.'
                                            : null
                                    }
                                />
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
                                        <select value={field.value} onChange={field.onChange} style={selectStyle}>
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
                                        <select value={field.value} onChange={field.onChange} style={selectStyle}>
                                            <option value="Africa/Amman">Africa/Amman</option>
                                            <option value="Asia/Amman">Asia/Amman</option>
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
    );
};

export default GeneralSettingsTab;
