import React, { useEffect, useMemo, useState } from 'react';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomRemove } from '@/hooks/useMutation';
import { put } from '@/api';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import { toast } from 'sonner';
import TaxSlabsHeader from './TaxSlabsHeader';
import TaxSlabsTable from './TaxSlabsTable';
import { TaxSlabsComplianceCard, TaxSlabsSummaryCard } from './TaxSlabsInfoCards';

const TaxSlabs = () => {
    const taxBracketsQuery = useCustomQuery('/api/hr/income-tax-brackets/', ['hr-income-tax-brackets']);
    const createTaxBracket = useCustomPost('/api/hr/income-tax-brackets/', []);
    const deleteTaxBracket = useCustomRemove((id) => `/api/hr/income-tax-brackets/${id}/`, []);

    const [localSlabs, setLocalSlabs] = useState([]);
    const [initialSlabs, setInitialSlabs] = useState([]);
    const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

    const isCompactLayout = viewportWidth < 1200;
    const isNarrowMobile = viewportWidth < 550;

    useEffect(() => {
        if (!Array.isArray(taxBracketsQuery.data)) return;
        const mappedSlabs = taxBracketsQuery.data.map((slab) => ({
            id: slab.id,
            min: Number(slab.min_income) || 0,
            max: Number(slab.max_income) || 0,
            rate: Number(slab.tax_rate) || 0,
        }));
        setLocalSlabs(mappedSlabs);
        setInitialSlabs(mappedSlabs);
        setPendingDeleteIds([]);
    }, [taxBracketsQuery.data]);

    useEffect(() => {
        const handleResize = () => {
            setViewportWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const effectiveCeiling = useMemo(
        () => (localSlabs.length ? Math.max(...localSlabs.map((slab) => slab.max)) : 0),
        [localSlabs]
    );
    const maxRate = useMemo(
        () => (localSlabs.length ? Math.max(...localSlabs.map((slab) => slab.rate)) : 0),
        [localSlabs]
    );

    const handleAddSlab = () => {
        const lastSlab = localSlabs[localSlabs.length - 1];
        const newMin = lastSlab ? lastSlab.max + 1 : 0;
        setLocalSlabs([...localSlabs, { id: `temp-${Date.now()}`, min: newMin, max: newMin + 5000, rate: 0 }]);
    };

    const handleBack = () => {
        window.history.back();
    };

    const handleDeleteSlab = (id) => {
        if (!id) return;
        setLocalSlabs((prev) => prev.filter((slab) => slab.id !== id));
        if (String(id).startsWith('temp-')) return;
        setPendingDeleteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const handleChange = (id, field, value) => {
        setLocalSlabs(localSlabs.map((slab) => (slab.id === id ? { ...slab, [field]: Number(value) } : slab)));
    };

    const hasSlabChanged = (current, initial) => {
        if (!initial) return false;
        return (
            Number(current.min) !== Number(initial.min) ||
            Number(current.max) !== Number(initial.max) ||
            Number(current.rate) !== Number(initial.rate)
        );
    };

    const pendingChanges = useMemo(() => {
        const initialById = new Map(initialSlabs.map((slab) => [slab.id, slab]));
        const createRows = localSlabs.filter((slab) => String(slab.id).startsWith('temp-'));
        const updateRows = localSlabs.filter(
            (slab) => !String(slab.id).startsWith('temp-') && hasSlabChanged(slab, initialById.get(slab.id))
        );
        return {
            createRows,
            updateRows,
            deleteIds: pendingDeleteIds,
            hasChanges: createRows.length > 0 || updateRows.length > 0 || pendingDeleteIds.length > 0,
        };
    }, [localSlabs, initialSlabs, pendingDeleteIds]);

    const handleSave = async () => {
        if (!pendingChanges.hasChanges || isSaving) return;
        setIsSaving(true);
        try {
            for (const slab of pendingChanges.updateRows) {
                await put(`/api/hr/income-tax-brackets/${slab.id}/`, {
                    min_income: Number(slab.min).toFixed(2),
                    max_income: Number(slab.max).toFixed(2),
                    tax_rate: Number(slab.rate).toFixed(2),
                    is_active: true,
                });
            }

            for (const slab of pendingChanges.createRows) {
                await createTaxBracket.mutateAsync({
                    min_income: Number(slab.min).toFixed(2),
                    max_income: Number(slab.max).toFixed(2),
                    tax_rate: Number(slab.rate).toFixed(2),
                    is_active: true,
                });
            }

            for (const id of pendingChanges.deleteIds) {
                await deleteTaxBracket.mutateAsync(id);
            }

            await taxBracketsQuery.refetch();
            toast.success('Tax brackets saved successfully.');
        } catch (error) {
            const extractErrorMessages = (payload) => {
                if (!payload) return [];
                if (typeof payload === 'string') return [payload];
                if (Array.isArray(payload)) {
                    return payload.flatMap((item) => extractErrorMessages(item));
                }
                if (typeof payload === 'object') {
                    return Object.entries(payload).flatMap(([key, value]) => {
                        const nested = extractErrorMessages(value);
                        if (!nested.length) return [];
                        return nested.map((message) => `${key}: ${message}`);
                    });
                }
                return [];
            };

            const responseData = error?.response?.data;
            const parsedMessages = extractErrorMessages(responseData).filter(Boolean);
            const fallbackMessage = error?.response?.data?.detail || error?.message || 'Failed to save tax brackets.';
            const message = parsedMessages.length ? parsedMessages.join('\n') : fallbackMessage;
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (taxBracketsQuery.isLoading) {
        return <Spinner />;
    }

    if (taxBracketsQuery.isError) {
        return <ResourceLoadError error={taxBracketsQuery.error} title="Could not load income tax brackets" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <TaxSlabsHeader
                isCompactLayout={isCompactLayout}
                isSaving={isSaving}
                hasChanges={pendingChanges.hasChanges}
                onBack={handleBack}
                onAddBracket={handleAddSlab}
                onSave={handleSave}
            />

            <div
                style={{
                    display: isCompactLayout ? 'flex' : 'grid',
                    flexDirection: isCompactLayout ? 'column' : undefined,
                    gridTemplateColumns: isCompactLayout ? undefined : 'minmax(0, 2fr) minmax(0, 1fr)',
                    gap: '1.5rem',
                    alignItems: 'start',
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        minWidth: 0,
                        width: '100%',
                        gridColumn: isCompactLayout ? 'auto' : '1 / 2',
                        gridRow: isCompactLayout ? 'auto' : '1 / 3',
                    }}
                >
                    <TaxSlabsTable slabs={localSlabs} isSaving={isSaving} onChangeSlab={handleChange} onDeleteSlab={handleDeleteSlab} />
                </div>

                {isCompactLayout ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isNarrowMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
                            gap: '1.5rem',
                            minWidth: 0,
                        }}
                    >
                        <TaxSlabsComplianceCard
                            style={{
                                border: '1px solid var(--color-primary-100)',
                                background: 'var(--color-primary-50)',
                                minWidth: 0,
                            }}
                        />
                        <TaxSlabsSummaryCard
                            slabCount={localSlabs.length}
                            effectiveCeiling={effectiveCeiling}
                            maxRate={maxRate}
                            style={{ minWidth: 0 }}
                        />
                    </div>
                ) : (
                    <>
                        <TaxSlabsComplianceCard
                            style={{
                                border: '1px solid var(--color-primary-100)',
                                background: 'var(--color-primary-50)',
                                gridColumn: '2 / 3',
                                gridRow: '1 / 2',
                            }}
                        />
                        <TaxSlabsSummaryCard
                            slabCount={localSlabs.length}
                            effectiveCeiling={effectiveCeiling}
                            maxRate={maxRate}
                            style={{ gridColumn: '2 / 3', gridRow: '2 / 3' }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default TaxSlabs;
