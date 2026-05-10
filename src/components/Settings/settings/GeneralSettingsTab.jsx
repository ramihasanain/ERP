import React, { useEffect, useMemo, useState } from 'react';
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

const PAY_DAY_LAST_DAY = 31;
const PAY_DAY_FIXED_DAY = 'fixed_day';

const parsePayDayFromSettings = (rawPayDay) => {
    if (rawPayDay == null || rawPayDay === '') {
        return { pay_day_mode: PAY_DAY_LAST_DAY, pay_day: '' };
    }

    const normalized = String(rawPayDay).trim().toLowerCase();
    if (normalized === PAY_DAY_LAST_DAY) {
        return { pay_day_mode: PAY_DAY_LAST_DAY, pay_day: '' };
    }

    const dayNumber = Number(normalized);
    if (Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
        return { pay_day_mode: PAY_DAY_FIXED_DAY, pay_day: String(dayNumber) };
    }

    return { pay_day_mode: PAY_DAY_LAST_DAY, pay_day: '' };
};

const GeneralSettingsTab = () => {
    const updateCompanySettings = useCustomPatch('/api/tenants/clients/settings/', ['company-settings']);
    const settingsQuery = useCustomQuery('/api/tenants/clients/settings/', ['company-settings']);
    const industriesQuery = useCustomQuery('/api/shared/industries/', ['settings-industries']);
    const currenciesQuery = useCurrenciesInfiniteQuery();
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 600px)').matches;
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty },
    } = useForm({
        defaultValues: {
            company_name: '',
            industry: '',
            tax_id: '',
            default_currency: '',
            pay_day_mode: PAY_DAY_LAST_DAY,
            pay_day: '',
            date_format: 'DD/MM/YYYY',
            timezone: 'Africa/Egypt',
        },
    });

    const defaultCurrencyId = useWatch({ control, name: 'default_currency' });
    const watchedValues = useWatch({ control });
    const settingsData = useMemo(() => {
        if (!settingsQuery.data) return null;
        return settingsQuery.data?.data && typeof settingsQuery.data.data === 'object'
            ? settingsQuery.data.data
            : settingsQuery.data;
    }, [settingsQuery.data]);

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
            const settingsCurrencyId = coerceSettingsRef(settingsData?.default_currency);
            const settingsCurrencyName = (settingsData?.currency_name || '').trim();
            const fallbackLabel =
                settingsCurrencyName && settingsCurrencyId === defaultCurrencyId
                    ? settingsCurrencyName
                    : defaultCurrencyId;
            return [{ value: defaultCurrencyId, label: fallbackLabel }, ...base];
        }
        return base;
    }, [currencies, defaultCurrencyId, settingsData]);

    useEffect(() => {
        if (!settingsQuery.data) return;

        const data = settingsData;

        reset(
            {
                company_name: data?.company_name || '',
                industry: normalizeIndustryValue(data?.industry, industries),
                tax_id: data?.tax_id || '',
                default_currency: normalizeCurrencyValue(data?.default_currency, currencies),
                ...parsePayDayFromSettings(data?.pay_day),
                date_format: data?.date_format || 'DD/MM/YYYY',
                timezone: data?.timezone || 'Africa/Egypt',
            },
            { keepDirtyValues: true },
        );
    }, [settingsData, industries, currencies, reset]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 600px)');
        const onMediaChange = (event) => setIsNarrowScreen(event.matches);

        setIsNarrowScreen(mediaQuery.matches);
        mediaQuery.addEventListener('change', onMediaChange);
        return () => mediaQuery.removeEventListener('change', onMediaChange);
    }, []);

    const onSubmitGeneral = async (values) => {
        const payDayValue =
            values.pay_day_mode === PAY_DAY_FIXED_DAY && values.pay_day
                ? Number(values.pay_day)
                : PAY_DAY_LAST_DAY;

        const payload = {
            company_name: values.company_name?.trim() || '',
            industry: values.industry || null,
            tax_id: values.tax_id?.trim() || '',
            default_currency: values.default_currency || null,
            pay_day: payDayValue,
            date_format: values.date_format || 'DD/MM/YYYY',
            timezone: values.timezone || 'Africa/Egypt',
        };

        try {
            await updateCompanySettings.mutateAsync(payload);
            toast.success('Company settings updated successfully.');
            try {
                if (typeof window !== 'undefined') {
                    const currencyId = values.default_currency ? String(values.default_currency).trim() : '';
                    if (!currencyId) {
                        localStorage.removeItem('erp_currency');
                    } else {
                        const currencyCode = currencies.find((c) => c.id === currencyId)?.code;
                        localStorage.setItem('erp_currency', String(currencyCode || currencyId));
                    }
                }
            } catch {
                // ignore storage errors
            }
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

    const hasMissingRequiredValues =
        !watchedValues?.company_name?.trim() ||
        !watchedValues?.industry ||
        !watchedValues?.tax_id?.trim() ||
        !watchedValues?.default_currency ||
        !watchedValues?.pay_day_mode ||
        (watchedValues?.pay_day_mode === PAY_DAY_FIXED_DAY && !watchedValues?.pay_day) ||
        !watchedValues?.date_format ||
        !watchedValues?.timezone;

    const isSaveDisabled = updateCompanySettings.isPending || !isDirty || hasMissingRequiredValues;

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
                    <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
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

                        <Controller
                            name="pay_day_mode"
                            control={control}
                            render={({ field }) => (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        gridColumn: isNarrowScreen ? 'span 1' : 'span 2',
                                    }}
                                >
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pay Day</label>
                                    <div
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--color-bg-surface)',
                                            padding: '0.75rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                        }}
                                    >
                                        {field.value === PAY_DAY_FIXED_DAY ? (
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr',
                                                    gap: '0.75rem',
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                                                    <select value={field.value} onChange={field.onChange} style={selectStyle}>
                                                        <option value={PAY_DAY_LAST_DAY}>Last day of the month</option>
                                                        <option value={PAY_DAY_FIXED_DAY}>Fixed day of the month</option>
                                                    </select>
                                                </div>
                                                <Controller
                                                    name="pay_day"
                                                    control={control}
                                                    render={({ field: payDayField }) => (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                                Day
                                                            </label>
                                                            <select
                                                                value={payDayField.value || ''}
                                                                onChange={payDayField.onChange}
                                                                style={selectStyle}
                                                            >
                                                                <option value="">Choose day</option>
                                                                {Array.from({ length: 31 }, (_, index) => {
                                                                    const day = String(index + 1);
                                                                    return (
                                                                        <option key={day} value={day}>
                                                                            Day {day}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <select value={field.value} onChange={field.onChange} style={selectStyle}>
                                                    <option value={PAY_DAY_LAST_DAY}>Last day of the month</option>
                                                    <option value={PAY_DAY_FIXED_DAY}>Fixed day of the month</option>
                                                </select>
                                                <div
                                                    style={{
                                                        fontSize: '0.875rem',
                                                        color: 'var(--color-text-secondary)',
                                                        padding: '0.25rem 0',
                                                    }}
                                                >
                                                    Salary will be processed on the last available day of each month.
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Localization</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
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
                        <Button icon={<Save size={18} />} type="submit" disabled={isSaveDisabled}>
                            {updateCompanySettings.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            )}
        </Card>
    );
};

export default GeneralSettingsTab;
