import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { getPaymentTermsLabel } from './utils';

const thStyle = { padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600 };
const tdStyle = { padding: '1rem' };
const tdStrongStyle = { padding: '1rem', fontWeight: 600 };
const actionButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const VendorsList = ({ vendors, onView, onEdit, onDelete }) => {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr
                        style={{
                            background: 'var(--color-bg-table-header)',
                            borderBottom: '1px solid var(--color-border)',
                            textAlign: 'left',
                        }}
                    >
                        <th style={thStyle}>Vendor Name</th>
                        <th style={thStyle}>Contact Person</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Phone</th>
                        <th style={thStyle}>Payment Terms</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vendors.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    color: 'var(--color-text-secondary)',
                                    textAlign: 'center',
                                }}
                            >
                                No vendors found.
                            </td>
                        </tr>
                    ) : (
                        vendors.map((vendor) => (
                            <tr
                                key={vendor.id}
                                style={{ borderBottom: '1px solid var(--color-border)' }}
                                className="erp-table-row-hover"
                            >
                                <td style={tdStrongStyle}>{vendor.name || '--'}</td>
                                <td style={tdStyle}>{vendor.contactPerson || '--'}</td>
                                <td style={tdStyle}>{vendor.email || '--'}</td>
                                <td style={tdStyle}>{vendor.phone || '--'}</td>
                                <td style={tdStyle}>{getPaymentTermsLabel(vendor.paymentTerms)}</td>
                                <td style={tdStyle}>
                                    <span
                                        style={{
                                            color: vendor.isActive
                                                ? 'var(--color-success)'
                                                : 'var(--color-text-secondary)',
                                            background: vendor.isActive
                                                ? 'var(--color-success-dim)'
                                                : 'var(--color-bg-subtle)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {vendor.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => onView(vendor.id)}
                                            style={actionButtonStyle}
                                            title="View Vendor"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onEdit(vendor.id)}
                                            style={actionButtonStyle}
                                            title="Edit Vendor"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(vendor)}
                                            style={{ ...actionButtonStyle, color: 'var(--color-error)' }}
                                            title="Delete Vendor"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default VendorsList;
