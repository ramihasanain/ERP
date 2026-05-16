import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/Shared/Button';

const PurchaseOrderFormHeader = ({ isEdit, totalValue, onBack }) => (
    <>
        <Button
            variant="ghost"
            icon={<ArrowLeft size={16} />}
            onClick={onBack}
            style={{ marginBottom: '1rem' }}
            className="font-medium cursor-pointer"
        >
            Back to List
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
                </h1>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    {isEdit ? 'Purchase Order' : 'Create Purchase Order'}
                </p>
            </div>
            <div
                style={{
                    padding: '0.45rem 0.9rem',
                    background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                    borderRadius: '4px',
                    fontWeight: 600,
                    color: 'var(--color-primary-600)',
                    border: '1px solid var(--color-border)',
                }}
            >
                Total: {totalValue.toLocaleString()} JOD
            </div>
        </div>
    </>
);

export default PurchaseOrderFormHeader;
