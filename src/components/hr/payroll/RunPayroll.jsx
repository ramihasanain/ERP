import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import apiClient from '@/api';
import { Play, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import useCustomQuery from '@/hooks/useQuery';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';

const RunPayroll = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const WORKFLOW_PATH = `${basePath}/hr/payroll/run/workflow`;

    const draftsQuery = useCustomQuery('/api/hr/payroll/periods/drafts/', ['hr-payroll-drafts'], {
        select: (data) => (Array.isArray(data) ? data : []),
    });

    const draftPeriods = useMemo(() => {
        const list = draftsQuery.data;
        return Array.isArray(list) ? list : [];
    }, [draftsQuery.data]);

    const calculateMutation = useMutation({
        mutationFn: (periodId) =>
            apiClient.post(`/api/hr/payroll/periods/${periodId}/calculate/`).then((res) => res.data),
        onSuccess: async (_, periodId) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-drafts'] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-dashboard'] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-period-workflow', periodId] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-period', periodId] }),
            ]);
        },
    });

    const [selectedPeriod, setSelectedPeriod] = useState('');

    const handleStartCalculation = async () => {
        if (!selectedPeriod) return;
        try {
            await calculateMutation.mutateAsync(selectedPeriod);
            toast.success('Payroll calculation started.');

            const periodName = draftPeriods.find((p) => p.id === selectedPeriod)?.name;

            navigate(WORKFLOW_PATH, {
                state: {
                    periodId: selectedPeriod,
                    periodName,
                },
            });
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not start payroll calculation.';
            toast.error(typeof message === 'string' ? message : 'Could not start payroll calculation.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(`${basePath}/hr/payroll`)} type="button" className="cursor-pointer" />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Run Payroll</h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            Choose a draft period and start calculation to review results.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>1. Select Period</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>2. Review & Adjust</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>3. Finalize</div>
            </div>

            <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ padding: '1rem', background: 'var(--color-primary-50)', borderRadius: '50%', color: 'var(--color-primary-600)' }}>
                        <Play size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Start New Payroll Run</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Select a payroll period to begin calculations.</p>
                    </div>

                    {draftsQuery.isLoading && <Spinner />}

                    {draftsQuery.isError && (
                        <div style={{ width: '100%' }}>
                            <ResourceLoadError
                                error={draftsQuery.error}
                                title="Could not load draft payroll periods"
                                onGoBack={() => navigate(`${basePath}/hr/payroll`)}
                                style={{ maxWidth: '100%' }}
                            />
                        </div>
                    )}

                    {!draftsQuery.isLoading && !draftsQuery.isError && (
                        <div style={{ width: '100%', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payroll Period</label>
                            <select
                                className="font-normal"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                disabled={draftPeriods.length === 0}
                            >
                                <option value="">-- Select Period --</option>
                                {draftPeriods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.status})
                                    </option>
                                ))}
                            </select>
                            {draftPeriods.length === 0 && (
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    No draft periods available.
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="cursor-pointer"
                        disabled={
                            !selectedPeriod ||
                            calculateMutation.isPending ||
                            draftsQuery.isLoading ||
                            draftsQuery.isError ||
                            draftPeriods.length === 0
                        }
                        onClick={handleStartCalculation}
                        style={{ width: '100%' }}
                    >
                        {calculateMutation.isPending ? 'Starting…' : 'Start Calculation'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default RunPayroll;
