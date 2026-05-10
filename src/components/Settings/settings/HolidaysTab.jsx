import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import formatDate from '@/utils/formatDate';
import { Plus } from 'lucide-react';

const HOLIDAYS_API = '/api/hr/employees/holidays/';
const HOLIDAYS_QUERY_KEY = ['settings-holidays'];

const pad2 = (v) => String(v).padStart(2, '0');

const toIntOrNull = (v) => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
};

const isValidDateParts = (year, month, day) => {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return false;
    if (!Number.isInteger(month) || month < 1 || month > 12) return false;
    if (!Number.isInteger(day) || day < 1 || day > 31) return false;

    const d = new Date(Date.UTC(year, month - 1, day));
    return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month - 1 &&
        d.getUTCDate() === day
    );
};

const HolidaysTab = () => {
    const holidaysQuery = useCustomQuery(HOLIDAYS_API, HOLIDAYS_QUERY_KEY);
    const createHoliday = useCustomPost(HOLIDAYS_API, HOLIDAYS_QUERY_KEY);
    const currentYear = String(new Date().getFullYear());
    const [isTwoRowLayout, setIsTwoRowLayout] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1300px)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 1300px)');
        const onMediaChange = (event) => setIsTwoRowLayout(event.matches);

        setIsTwoRowLayout(mediaQuery.matches);
        mediaQuery.addEventListener('change', onMediaChange);
        return () => mediaQuery.removeEventListener('change', onMediaChange);
    }, []);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm({
        defaultValues: {
            name: '',
            day: '',
            month: '',
            year: currentYear,
        },
    });

    const watched = useWatch({ control });
    const canSubmit =
        Boolean(watched?.name?.trim()) &&
        watched?.day !== '' &&
        watched?.month !== '' &&
        watched?.year !== '' &&
        !createHoliday.isPending;

    const holidays = useMemo(() => {
        const data = holidaysQuery.data;
        if (!Array.isArray(data)) return [];
        return [...data].sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')));
    }, [holidaysQuery.data]);

    const onSubmit = async (values) => {
        clearErrors();

        const name = values?.name?.trim() || '';
        const day = toIntOrNull(values?.day);
        const month = toIntOrNull(values?.month);
        const year = toIntOrNull(values?.year);

        if (!name) {
            setError('name', { type: 'validate', message: 'Holiday name is required.' });
            return;
        }

        if (!isValidDateParts(year, month, day)) {
            setError('day', { type: 'validate', message: 'Please enter a valid date.' });
            setError('month', { type: 'validate', message: ' ' });
            setError('year', { type: 'validate', message: ' ' });
            return;
        }

        const date = `${year}-${pad2(month)}-${pad2(day)}`;

        try {
            await createHoliday.mutateAsync({ name, date });
            toast.success('Holiday added.');
            reset({ name: '', day: '', month: '', year: currentYear });
        } catch (error) {
            const message = error?.response?.data?.detail || 'Failed to add holiday.';
            toast.error(message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Holidays</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)' }}>
                        Add public holidays to use across HR workflows.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isTwoRowLayout ? '1fr 1fr 1fr' : '2fr 1fr 1fr 1fr',
                            gap: '1rem',
                            alignItems: 'end',
                        }}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <div style={{ gridColumn: isTwoRowLayout ? '1 / -1' : 'auto' }}>
                                    <Input
                                        label="Holiday name"
                                        placeholder="e.g., Eid Al-Fitr"
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors?.name?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="day"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    label="Day"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={31}
                                    placeholder="DD"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.day?.message}
                                />
                            )}
                        />

                        <Controller
                            name="month"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    label="Month"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={12}
                                    placeholder="MM"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.month?.message}
                                />
                            )}
                        />

                        <Controller
                            name="year"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    label="Year"
                                    type="number"
                                    inputMode="numeric"
                                    min={1900}
                                    max={2100}
                                    placeholder="YYYY"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.year?.message}
                                />
                            )}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            icon={<Plus size={18} />}
                            disabled={!canSubmit}
                            isLoading={createHoliday.isPending}
                        >
                            Add Holiday
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="padding-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} title="Holiday list">
                {holidaysQuery.isLoading && <Spinner />}

                {holidaysQuery.isError && (
                    <div style={{ color: 'var(--color-error)' }}>
                        Could not load holidays.
                    </div>
                )}

                {!holidaysQuery.isLoading && !holidaysQuery.isError && holidays.length === 0 && (
                    <div style={{ color: 'var(--color-text-secondary)' }}>No holidays added yet.</div>
                )}

                {!holidaysQuery.isLoading && !holidaysQuery.isError && holidays.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {holidays.map((h) => (
                            <div
                                key={h?.id || `${h?.name}-${h?.date}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-bg-surface)',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                        {h?.name || '-'}
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>
                                        {formatDate(h?.date)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        Created: {formatDate(h?.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default HolidaysTab;

