import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';

const PurchaseOrderApprovalHistory = ({ approvalLog }) => {
    if (!approvalLog?.length) return null;

    return (
        <Card title="Approval History" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                {approvalLog.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '2px solid var(--color-primary)', paddingLeft: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{log.stage} - {log.status}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>By {log.user}</div>
                            {log.reason && <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '0.2rem' }}>Reason: {log.reason}</div>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {new Date(log.date).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default PurchaseOrderApprovalHistory;
