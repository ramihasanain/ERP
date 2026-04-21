import React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';

const PurchaseOrderEditFormCard = ({
    vendorId,
    orderDate,
    expectedDate,
    vendors,
    products,
    lines,
    currency,
    isSaving,
    onVendorChange,
    onOrderDateChange,
    onExpectedDateChange,
    onLineChange,
    onAddLine,
    onRemoveLine,
    onCancel,
    onSave,
    onMarkPendingApproval,
    isStatusUpdating,
}) => (
    <>
        <Card className="padding-md" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                    <label style={labelStyle} className="font-medium">Vendor</label>
                    <select
                        value={vendorId}
                        onChange={(event) => onVendorChange(event.target.value)}
                        style={inputStyle}
                        className="font-normal cursor-pointer"
                    >
                        <option value="">Select vendor</option>
                        {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={labelStyle} className="font-medium">Order Date</label>
                    <input
                        type="date"
                        value={orderDate}
                        onChange={(event) => onOrderDateChange(event.target.value)}
                        style={inputStyle}
                        className="font-normal"
                    />
                </div>
                <div>
                    <label style={labelStyle} className="font-medium">Expected Delivery</label>
                    <input
                        type="date"
                        value={expectedDate}
                        onChange={(event) => onExpectedDateChange(event.target.value)}
                        style={inputStyle}
                        className="font-normal"
                    />
                </div>
            </div>
        </Card>

        <Card className="padding-md">
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Unit Cost</th>
                            <th style={thStyle}>Total Cost</th>
                            <th style={thStyle} />
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={`${line.id || 'line'}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <select
                                        value={line.productId}
                                        onChange={(event) => onLineChange(index, 'productId', event.target.value)}
                                        style={{ ...inputStyle, width: '100%' }}
                                        className="font-normal cursor-pointer"
                                    >
                                        <option value="">Select item</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} {product.sku ? `(${product.sku})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={(event) => onLineChange(index, 'quantity', event.target.value)}
                                        style={{ ...inputStyle, width: '88px' }}
                                        className="font-normal"
                                    />
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.unitPrice}
                                        disabled
                                        style={disabledInputStyle}
                                        className="font-normal"
                                    />
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>
                                    {Number(line.totalCost || 0).toLocaleString()} {currency}
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLine(index)}
                                        style={removeButtonStyle}
                                        aria-label="Remove line"
                                        className="cursor-pointer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Button
                variant="outline"
                icon={<Plus size={16} />}
                onClick={onAddLine}
                style={{ marginTop: '1rem', marginBottom: '1.5rem' }}
                className="font-medium cursor-pointer"
            >
                Add Line Item
            </Button>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" onClick={onCancel} className="font-medium cursor-pointer">
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    onClick={onMarkPendingApproval}
                    isLoading={isStatusUpdating}
                    className="font-medium cursor-pointer"
                >
                    Mark Pending Approval
                </Button>
                <Button
                    variant="primary"
                    icon={<Save size={16} />}
                    onClick={onSave}
                    isLoading={isSaving}
                    className="font-medium cursor-pointer"
                >
                    Save Changes
                </Button>
            </div>
        </Card>
    </>
);

const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 600,
    fontSize: '0.86rem',
    color: 'var(--color-text-main)',
};

const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};

const disabledInputStyle = {
    width: '120px',
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: 'var(--color-text-secondary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxShadow: 'none',
    cursor: 'default',
};

const thStyle = {
    textAlign: 'left',
    padding: '0.9rem',
    fontSize: '0.83rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
};

const tdStyle = {
    padding: '0.9rem',
    verticalAlign: 'middle',
};

const removeButtonStyle = {
    border: 'none',
    background: 'none',
    color: 'var(--color-danger)',
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
};

export default PurchaseOrderEditFormCard;
