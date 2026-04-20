import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/Shared/Button';

const PurchaseOrderEditHeader = ({ orderNumber, totalAmount, currency, onBack }) => (
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
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Edit Purchase Order</h1>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    {orderNumber || 'Purchase Order'}
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
                Total: {totalAmount.toLocaleString()} {currency}
            </div>
        </div>
    </>
);

export default PurchaseOrderEditHeader;
