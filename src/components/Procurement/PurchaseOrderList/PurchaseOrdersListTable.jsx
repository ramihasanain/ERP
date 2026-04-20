import React from 'react';
import { CheckCircle, Eye, Pencil, Trash2, XCircle } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import { getStatusColor } from './utils';

const PurchaseOrdersListTable = ({
    purchaseOrders,
    isLoading,
    isError,
    onView,
    onEdit,
    onDelete,
}) => (
    <Card>
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg-table-header)' }}>
                        <th style={thStyle}>PO ID</th>
                        <th style={thStyle}>Vendor</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Expected Delivery</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr>
                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                <Spinner />
                            </td>
                        </tr>
                    )}
                    {isError && !isLoading && (
                        <tr>
                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                Failed to load purchase orders.
                            </td>
                        </tr>
                    )}
                    {purchaseOrders.map((po) => (
                        <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                            <td style={tdStyle}>{po.number}</td>
                            <td style={tdStyle}>{po.vendorName}</td>
                            <td style={tdStyle}>{po.orderDate}</td>
                            <td style={tdStyle}>{po.expectedDate}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                                {po.totalAmount.toLocaleString()} {po.currency}
                            </td>
                            <td style={tdStyle}>
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: `${getStatusColor(po.status)}20`,
                                        color: getStatusColor(po.status),
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {po.status === 'Approved' && <CheckCircle size={12} />}
                                    {po.status === 'Rejected' && <XCircle size={12} />}
                                    {po.status}
                                </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        style={{ paddingInline: '0.45rem' }}
                                        icon={<Eye size={14} />}
                                        onClick={() => onView(po.id)}
                                        className="font-medium cursor-pointer"
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        style={{ paddingInline: '0.45rem' }}
                                        icon={<Pencil size={14} />}
                                        onClick={() => onEdit(po.id)}
                                        className="font-medium cursor-pointer"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        style={{ paddingInline: '0.45rem' }}
                                        icon={<Trash2 size={14} />}
                                        onClick={() => onDelete(po)}
                                        className="font-medium cursor-pointer"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {!isLoading && !isError && purchaseOrders.length === 0 && (
                        <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No purchase orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);

const thStyle = {
    padding: '1rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
};

const tdStyle = {
    padding: '1rem',
    whiteSpace: 'nowrap',
};

export default PurchaseOrdersListTable;
