import React from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Button from '@/components/Shared/Button';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/api';
import useCustomQuery from '@/hooks/useQuery';
import FinalizePayrollStep from '@/components/hr/payroll/FinalizePayrollStep';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

const FinalizePayrollPage = () => {
    const { id: periodId } = useParams();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const RUN_PAYROLL_PATH = `${basePath}/hr/payroll/run`;
    const WORKFLOW_PATH = `${basePath}/hr/payroll/run/workflow`;
    const location = useLocation();
    const queryClient = useQueryClient();

    const periodNameFromState = location.state?.periodName;

    const summaryQuery = useCustomQuery(
        periodId ? `/api/hr/payroll/periods/${periodId}/finalize-summary/` : null,
        ['hr-payroll-finalize-summary', periodId],
        { enabled: Boolean(periodId) }
    );

    const summaryData = summaryQuery.data;

    const finalizeMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post(`/api/hr/payroll/periods/${periodId}/finalize/`);
            return data;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-dashboard'] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-period', periodId] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-finalize-summary', periodId] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-drafts'] }),
                queryClient.invalidateQueries({ queryKey: ['hr-payroll-period-workflow', periodId] }),
            ]);
            toast.success('Payroll finalized and journal entries posted.');
            navigate(`${basePath}/accounting/journal`);
        },
        onError: (err) => {
            const msg = getApiErrorMessage(err, 'Could not finalize payroll.');
            toast.error(msg);
        },
    });

    const handleFinalize = () => {
        if (!periodId || !summaryData || finalizeMutation.isPending) return;
        finalizeMutation.mutate();
    };

    const goBackToReview = () => {
        navigate(WORKFLOW_PATH, {
            state: {
                periodId,
                periodName: periodNameFromState ?? summaryData?.period_name,
            },
        });
    };

    if (!periodId) {
        return <Navigate to={RUN_PAYROLL_PATH} replace />;
    }

    const canFinalize = Boolean(summaryData) && !summaryQuery.isError && !summaryQuery.isLoading && !finalizeMutation.isPending;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={goBackToReview} type="button" className="cursor-pointer" />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Run Payroll</h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            Process salaries, review calculations, and finalize payments.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>1. Select Period</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>2. Review & Adjust</div>
                <div style={{ color: 'var(--color-text-muted)' }}>&gt;</div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>3. Finalize</div>
            </div>

            <FinalizePayrollStep
                finalizeSummary={summaryData}
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                loadError={summaryQuery.error}
                onFinalize={handleFinalize}
                onBack={goBackToReview}
                isFinalizing={finalizeMutation.isPending}
                canFinalize={canFinalize}
            />
        </div>
    );
};

export default FinalizePayrollPage;
