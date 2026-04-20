import React from 'react';
import { Plus, Search } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { STATUS_FILTERS } from './utils';

const PurchaseOrderHeaderFilters = ({
    searchTerm,
    filterStatus,
    onSearchTermChange,
    onFilterStatusChange,
    onCreatePurchaseOrder,
}) => (
    <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Purchase Orders</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage procurement and vendor orders</p>
            </div>
            <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={onCreatePurchaseOrder}
                className="font-medium cursor-pointer"
            >
                New Purchase Order
            </Button>
        </div>

        <Card className="padding-md" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <Search
                    size={18}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
                />
                <input
                    type="text"
                    placeholder="Search POs or Vendors..."
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    className="font-normal"
                    style={{
                        width: '100%',
                        padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    maxWidth: '100%',
                    background: 'var(--color-bg-toggle-track)',
                    padding: '4px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                }}
            >
                {STATUS_FILTERS.map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => onFilterStatusChange(status)}
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                            boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                            color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                        }}
                        className="cursor-pointer"
                    >
                        {status}
                    </button>
                ))}
            </div>
        </Card>
    </>
);

export default PurchaseOrderHeaderFilters;
