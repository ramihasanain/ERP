import React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';

const PurchaseOrderFormCard = ({
    formData,
    lineItems,
    vendors,
    products,
    isReadOnly,
    status,
    isEdit,
    onFormChange,
    onLineChange,
    onAddLine,
    onRemoveLine,
    onCancel,
    onSubmit,
    onSubmission,
    onApproval,
    onRejection,
}) => (
    <>
        <Card className="padding-md" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label style={labelStyle} className="font-medium">Vendor</label>
                    <select
                        value={formData.vendorId}
                        onChange={(event) => onFormChange({ vendorId: event.target.value })}
                        style={inputStyle}
                        required
                        disabled={isReadOnly}
                        className="font-normal cursor-pointer"
                    >
                        <option value="">Select Vendor</option>
                        {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={labelStyle} className="font-medium">Order Date</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(event) => onFormChange({ date: event.target.value })}
                        style={inputStyle}
                        required
                        className="font-normal"
                    />
                </div>
                <div>
                    <label style={labelStyle} className="font-medium">Expected Delivery</label>
                    <input
                        type="date"
                        value={formData.expectedDate}
                        onChange={(event) => onFormChange({ expectedDate: event.target.value })}
                        style={inputStyle}
                        className="font-normal"
                    />
                </div>
            </div>
        </Card>

        <Card className="padding-md">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
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
                    {lineItems.map((line, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={tdStyle}>
                                <select
                                    value={line.itemId}
                                    onChange={(event) => onLineChange(index, 'itemId', event.target.value)}
                                    style={{ ...inputStyle, width: '100%' }}
                                    className="font-normal cursor-pointer"
                                >
                                    <option value="">Select Item</option>
                                    {products
                                        .filter((item) => item.type === 'stock_item')
                                        .map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} ({item.sku})
                                            </option>
                                        ))}
                                </select>
                            </td>
                            <td style={tdStyle}>
                                <input
                                    type="number"
                                    value={line.quantity}
                                    onChange={(event) => onLineChange(index, 'quantity', event.target.value)}
                                    style={{ ...inputStyle, width: '80px' }}
                                    className="font-normal"
                                />
                            </td>
                            <td style={tdStyle}>
                                <input
                                    type="number"
                                    value={line.unitCost}
                                    disabled
                                    style={disabledInputStyle}
                                    className="font-normal"
                                />
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                                {line.totalCost.toFixed(2)}
                            </td>
                            <td style={tdStyle}>
                                <button
                                    onClick={() => onRemoveLine(index)}
                                    style={removeButtonStyle}
                                    className="cursor-pointer"
                                    type="button"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Button
                variant="outline"
                icon={<Plus size={16} />}
                onClick={onAddLine}
                style={{ marginBottom: '2rem' }}
                disabled={isReadOnly}
                className="font-medium cursor-pointer"
            >
                Add Line Item
            </Button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <Button variant="outline" onClick={onCancel} className="font-medium cursor-pointer">Cancel</Button>

                {status === 'Draft' && (
                    <>
                        <Button variant="primary" icon={<Save size={16} />} onClick={onSubmit} className="font-medium cursor-pointer">
                            Save As Draft
                        </Button>
                        {isEdit && (
                            <Button variant="primary" style={{ backgroundColor: 'var(--color-indigo-600)' }} onClick={onSubmission} className="font-medium cursor-pointer">
                                Submit for Approval
                            </Button>
                        )}
                    </>
                )}

                {status === 'Pending Approval' && (
                    <>
                        <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={onRejection} className="font-medium cursor-pointer">
                            Reject
                        </Button>
                        <Button variant="primary" style={{ backgroundColor: 'var(--color-success-600)' }} onClick={onApproval} className="font-medium cursor-pointer">
                            Approve PO
                        </Button>
                    </>
                )}
            </div>
        </Card>
    </>
);

const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 500,
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
};

const inputStyle = {
    padding: '0.6rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};

const thStyle = {
    textAlign: 'left',
    padding: '1rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
};

const tdStyle = {
    padding: '1rem',
    verticalAlign: 'middle',
};

const disabledInputStyle = {
    width: '100px',
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: 'var(--color-text-secondary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxShadow: 'none',
    cursor: 'default',
};

const removeButtonStyle = {
    border: 'none',
    background: 'none',
    color: 'var(--color-danger)',
};

export default PurchaseOrderFormCard;
