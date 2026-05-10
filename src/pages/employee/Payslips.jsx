import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { FileText, Download, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCustomQuery from '@/hooks/useQuery';
import NoData from '@/core/NoData';
import ResourceLoadError from '@/core/ResourceLoadError';
import Pagination from '@/core/Pagination';
import { PayslipsSkeleton } from '@/pages/employee/skeleton';

const PAGE_SIZE = 12;

const EMPTY_ROWS = [];

const selectPayslipsPayload = (payload) => {
    if (Array.isArray(payload)) {
        return { rows: payload, count: payload.length };
    }
    const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.results)
          ? payload.results
          : EMPTY_ROWS;
    const count = typeof payload?.count === 'number' ? payload.count : rows.length;
    return { rows, count };
};

const Payslips = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const payslipsUrl = useMemo(() => {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(currentPage));
        queryParams.set('page_size', String(PAGE_SIZE));
        return `/api/hr/employees/payslips/?${queryParams.toString()}`;
    }, [currentPage]);

    const payslipsQuery = useCustomQuery(
        payslipsUrl,
        ['employee-payslips', currentPage],
        { select: selectPayslipsPayload }
    );

    const payslips = payslipsQuery.data?.rows ?? EMPTY_ROWS;
    const totalCount = payslipsQuery.data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    if (payslipsQuery.isLoading && !payslipsQuery.data) {
        return <PayslipsSkeleton />;
    }

    if (payslipsQuery.isError) {
        return (
            <ResourceLoadError
                error={payslipsQuery.error}
                title="Payslips could not be loaded"
                onRefresh={() => payslipsQuery.refetch()}
                refreshLabel="Try again"
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Payslips</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>View and download your monthly salary slips.</p>
            </div>

            {payslipsQuery.isFetching && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Updating…</div>
            )}

            {payslips.length === 0 ? (
                <NoData label="payslips" />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {payslips.map((slip) => {
                        const month = slip.month || slip.period_name || slip.name || 'Payslip';
                        const date = slip.date || slip.pay_date || slip.processed_at || '-';
                        const amount = slip.amount || slip.net_pay || slip.net || slip.total_net || '-';
                        const slipId = slip.id || slip.payslip_id || slip.line_id;
                        return (
                            <Card key={slipId || `${month}-${date}`} className="padding-lg">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', borderRadius: 'var(--radius-md)' }}>
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{month}</h3>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Processed on {date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Net Pay</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{amount}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Eye size={16} />}
                                        onClick={() => (slipId ? navigate(`/employee/payslips/${slipId}`) : null)}
                                        disabled={!slipId}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        style={{ flex: 1 }}
                                        icon={<Download size={16} />}
                                        onClick={() => alert(`Downloading payslip for ${month}...`)}
                                    >
                                        PDF
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Pagination
                currentPage={safePage}
                count={totalCount}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
            />
        </div>
    );
};

export default Payslips;
