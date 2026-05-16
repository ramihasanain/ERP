import React from 'react';
import { useTranslation } from 'react-i18next';
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
        <Card className="padding-md" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
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
                                        value={line.unitCost}
                                        disabled
                                        style={disabledInputStyle}
                                        className="font-normal"
                                    />
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>
                                    {Number(line.totalCost || 0).toLocaleString()} JOD
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => onRemoveLine(index)}
                                        style={removeButtonStyle}
                                        className="cursor-pointer"
                                        type="button"
                                        aria-label="Remove line"
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
                disabled={isReadOnly}
                className="font-medium cursor-pointer"
            >
                Add Line Item
            </Button>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" onClick={onCancel} className="font-medium cursor-pointer">{t('actions.cancel', { ns: 'common' })}</Button>

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

const removeButtonStyle = {
    border: 'none',
    background: 'none',
    color: 'var(--color-danger)',
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
};

export default PurchaseOrderFormCard;
