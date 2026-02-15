import React, { useState, useEffect } from 'react';
import { useProcurement } from '../../../context/ProcurementContext';
import { useAccounting } from '../../../context/AccountingContext';
import { useInventory } from '../../../context/InventoryContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const PurchaseOrderForm = () => {
    const { addPurchaseOrder, updatePurchaseOrder, purchaseOrders, submitPO, approvePO, rejectPO } = useProcurement();
    const { vendors } = useAccounting();
    const { items } = useInventory();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        vendorId: '',
        date: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState([
        { itemId: '', quantity: 1, unitCost: 0, totalCost: 0 }
    ]);

    useEffect(() => {
        if (isEdit) {
            const po = purchaseOrders.find(p => p.id === id);
            if (po) {
                setFormData({
                    vendorId: po.vendorId,
                    date: po.date,
                    expectedDate: po.expectedDate,
                    notes: po.notes || ''
                });
                setLineItems(po.items);
            }
        }
    }, [isEdit, id, purchaseOrders]);

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;

        if (field === 'itemId') {
            const item = items.find(i => i.id === value);
            if (item) {
                lines[index].unitCost = item.purchasePrice;
            }
        }

        if (field === 'quantity' || field === 'unitCost' || field === 'itemId') {
            lines[index].totalCost = lines[index].quantity * lines[index].unitCost;
        }

        setLineItems(lines);
    };

    const addLine = () => {
        setLineItems([...lineItems, { itemId: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
    };

    const removeLine = (index) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!formData.vendorId || !formData.date) return alert('Please fill required fields');
        if (lineItems.length === 0 || !lineItems[0].itemId) return alert('Add at least one item');

        const totalAmount = lineItems.reduce((acc, item) => acc + item.totalCost, 0);
        const vendor = vendors.find(v => v.id === formData.vendorId);

        const poData = {
            ...formData,
            vendorName: vendor?.name || 'Unknown',
            items: lineItems,
            totalAmount
        };

        if (isEdit) {
            updatePurchaseOrder(id, poData);
        } else {
            addPurchaseOrder(poData);
        }

        navigate('/admin/inventory/purchase-orders');
    };

    const handleSubmission = () => {
        submitPO(id);
        navigate('/admin/inventory/purchase-orders');
    };

    const handleApproval = () => {
        approvePO(id);
        navigate('/admin/inventory/purchase-orders');
    };

    const handleRejection = () => {
        const reason = window.prompt("Reason for rejection:");
        if (reason) {
            rejectPO(id, reason);
            navigate('/admin/inventory/purchase-orders');
        }
    };

    const po = purchaseOrders.find(p => p.id === id);
    const status = po?.status || 'Draft';
    const isReadOnly = status !== 'Draft';

    const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/purchase-orders')} style={{ marginBottom: '1rem' }}>
                Back to List
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
                <div style={{ padding: '0.5rem 1rem', background: 'var(--color-primary-50)', borderRadius: '4px', fontWeight: 600, color: 'var(--color-primary-700)' }}>
                    Total: {totalValue.toLocaleString()} JOD
                </div>
            </div>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Vendor</label>
                        <select
                            value={formData.vendorId}
                            onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                            style={inputStyle}
                            required
                            disabled={isEdit && formData.status !== 'Draft'}
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Order Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Expected Delivery</label>
                        <input type="date" value={formData.expectedDate} onChange={e => setFormData({ ...formData, expectedDate: e.target.value })} style={inputStyle} />
                    </div>
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Unit Cost</th>
                            <th style={thStyle}>Total Cost</th>
                            <th style={thStyle}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lineItems.map((line, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <select
                                        value={line.itemId}
                                        onChange={(e) => handleLineChange(index, 'itemId', e.target.value)}
                                        style={{ ...inputStyle, width: '100%' }}
                                    >
                                        <option value="">Select Item</option>
                                        {items.filter(i => i.type === 'Stock').map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                        style={{ ...inputStyle, width: '80px' }}
                                    />
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.unitCost}
                                        onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
                                        style={{ ...inputStyle, width: '100px' }}
                                    />
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>
                                    {line.totalCost.toFixed(2)}
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => removeLine(index)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Button variant="outline" icon={<Plus size={16} />} onClick={addLine} style={{ marginBottom: '2rem' }} disabled={isReadOnly}>
                    Add Line Item
                </Button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <Button variant="outline" onClick={() => navigate('/admin/inventory/purchase-orders')}>Cancel</Button>

                    {status === 'Draft' && (
                        <>
                            <Button variant="primary" icon={<Save size={16} />} onClick={handleSubmit}>
                                Save As Draft
                            </Button>
                            {isEdit && (
                                <Button variant="primary" style={{ backgroundColor: 'var(--color-indigo-600)' }} onClick={handleSubmission}>
                                    Submit for Approval
                                </Button>
                            )}
                        </>
                    )}

                    {status === 'Pending Approval' && (
                        <>
                            <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleRejection}>
                                Reject
                            </Button>
                            <Button variant="primary" style={{ backgroundColor: 'var(--color-success-600)' }} onClick={handleApproval}>
                                Approve PO
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* Approval History */}
            {isEdit && po?.approvalLog?.length > 0 && (
                <Card title="Approval History" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                        {po.approvalLog.map((log, idx) => (
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
            )}
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-primary)' };
const inputStyle = { padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem' };
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

export default PurchaseOrderForm;
