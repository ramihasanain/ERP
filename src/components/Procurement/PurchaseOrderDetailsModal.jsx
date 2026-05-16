import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';

const normalizePurchaseOrderDetails = (order) => {
    if (!order) return null;

    return {
        id: order.id,
        number: order.number || '-',
        vendorName: order.vendor_name || '-',
        orderDate: order.order_date || '-',
        expectedDate: order.expected_date || '-',
        currency: order.currency || 'JOD',
        status: order.status_display || order.status || '-',
        totalAmount: Number(order.total_amount ?? 0),
        lines: Array.isArray(order.lines)
            ? order.lines.map((line) => ({
                id: line.id,
                productName: line.product_name || '-',
                productSku: line.product_sku || '-',
                quantity: Number(line.quantity ?? 0),
                unitPrice: Number(line.unit_price ?? 0),
                totalCost: Number(line.total_cost ?? 0),
            }))
            : [],
    };
};

const PurchaseOrderDetailsModal = ({ orderId, isOpen, onClose }) => {
    const orderDetailsQuery = useCustomQuery(
        orderId ? `/api/purchasing/purchase-orders/${orderId}/` : '/api/purchasing/purchase-orders/',
        ['purchasing-purchase-order-details', orderId],
        {
            enabled: Boolean(isOpen && orderId),
            select: normalizePurchaseOrderDetails,
        }
    );

    const order = useMemo(() => orderDetailsQuery.data ?? null, [orderDetailsQuery.data]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(2px)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    width: 'min(1000px, 100%)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '12px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 16px 38px rgba(2, 6, 23, 0.2)',
                }}
            >
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-bg-table-header)',
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            Purchase Order Details
                        </h2>
                        {order?.number && (
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)' }}>
                                {order.number}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label="Close details"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                    {orderDetailsQuery.isLoading && (
                        <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                            <Spinner />
                        </div>
                    )}

                    {orderDetailsQuery.isError && !orderDetailsQuery.isLoading && (
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>
                            Failed to load purchase order details.
                        </p>
                    )}

                    {order && !orderDetailsQuery.isLoading && !orderDetailsQuery.isError && (
                        <>
                            <Card className="padding-md" style={{ marginBottom: '1rem' }}>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '0.9rem',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Vendor</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{order.vendorName}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Order Date</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{order.orderDate}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Expected Date</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{order.expectedDate}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Status</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{order.status}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Total Amount</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>
                                            {order.totalAmount.toLocaleString()} {order.currency}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="padding-none">
                                <div
                                    style={{
                                        padding: '0.9rem 1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    <Package size={16} />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Order Items</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-table-header)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Product</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>SKU</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Qty</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Unit Price</th>
                                                <th style={{ padding: '0.8rem 1rem', color: 'var(--color-text-secondary)' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.lines.map((line) => (
                                                <tr key={line.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{line.productName}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{line.productSku}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{line.quantity}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>
                                                        {line.unitPrice.toLocaleString()} {order.currency}
                                                    </td>
                                                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700 }}>
                                                        {line.totalCost.toLocaleString()} {order.currency}
                                                    </td>
                                                </tr>
                                            ))}
                                            {order.lines.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        style={{
                                                            padding: '1rem',
                                                            textAlign: 'center',
                                                            color: 'var(--color-text-secondary)',
                                                        }}
                                                    >
                                                        This order has no items.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderDetailsModal;
