import React, { useState } from 'react';
import { useInventory } from '../../../context/InventoryContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Plus, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WarehouseTransfer = () => {
    const { items, warehouses, addTransaction, getStockLevel } = useInventory();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        reference: '',
        date: new Date().toISOString().split('T')[0],
        fromWarehouseId: '',
        toWarehouseId: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState([
        { itemId: '', quantity: 1 }
    ]);

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;
        setLineItems(lines);
    };

    const addLine = () => {
        setLineItems([...lineItems, { itemId: '', quantity: 1 }]);
    };

    const removeLine = (index) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!formData.fromWarehouseId || !formData.toWarehouseId || !formData.reference) return alert('Please fill required fields');
        if (formData.fromWarehouseId === formData.toWarehouseId) return alert('Source and Destination warehouses cannot be the same.');

        // Validation: Check Stock in Source Warehouse
        for (let line of lineItems) {
            const stock = getStockLevel(line.itemId, formData.fromWarehouseId);
            if (line.quantity > stock) {
                alert(`Insufficient stock in source warehouse for item ID: ${line.itemId}. Available: ${stock}`);
                return;
            }
        }

        // 1. Create OUT Transaction from Source
        addTransaction({
            ...formData,
            warehouseId: formData.fromWarehouseId,
            type: 'OUT', // Transfer Out
            status: 'Posted',
            reference: `${formData.reference}-OUT`,
            items: lineItems.map(l => ({ ...l, unitCost: 0, totalCost: 0 })) // Transfer doesn't necessarily have new cost, keeps existing value
        });

        // 2. Create IN Transaction to Destination
        addTransaction({
            ...formData,
            warehouseId: formData.toWarehouseId,
            type: 'IN', // Transfer In
            status: 'Posted',
            reference: `${formData.reference}-IN`,
            items: lineItems.map(l => ({ ...l, unitCost: 0, totalCost: 0 }))
        });

        navigate('/admin/inventory/transactions');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/transactions')} style={{ marginBottom: '1rem' }}>
                Back to Transactions
            </Button>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Warehouse Transfer</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Reference</label>
                        <input value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} style={inputStyle} placeholder="TRF-2024-001" required />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={inputStyle} required />
                    </div>

                    <div>
                        <label style={labelStyle}>From Warehouse</label>
                        <select value={formData.fromWarehouseId} onChange={e => setFormData({ ...formData, fromWarehouseId: e.target.value })} style={inputStyle} required>
                            <option value="">Select Source</option>
                            {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowRight size={24} color="var(--color-primary-500)" />
                    </div>

                    <div>
                        <label style={labelStyle}>To Warehouse</label>
                        <select value={formData.toWarehouseId} onChange={e => setFormData({ ...formData, toWarehouseId: e.target.value })} style={inputStyle} required>
                            <option value="">Select Destination</option>
                            {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                    </div>


                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Available at Source</th>
                            <th style={thStyle}>Transfer Quantity</th>
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
                                        disabled={!formData.fromWarehouseId}
                                    >
                                        <option value="">Select Item</option>
                                        {items.filter(i => i.type === 'Stock').map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                        ))}
                                    </select>
                                    {!formData.fromWarehouseId && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Select Source Warehouse first</div>}
                                </td>
                                <td style={tdStyle}>
                                    {line.itemId && (
                                        <span style={{ fontWeight: 600 }}>
                                            {getStockLevel(line.itemId, formData.fromWarehouseId)}
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                        style={{ ...inputStyle, width: '100px' }}
                                    />
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

                <Button variant="outline" icon={<Plus size={16} />} onClick={addLine} style={{ marginBottom: '2rem' }}>
                    Add Line Item
                </Button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <Button variant="outline" onClick={() => navigate('/admin/inventory/transactions')}>Cancel</Button>
                    <Button variant="primary" icon={<CheckCircle size={16} />} onClick={handleSubmit}>
                        Transfer Stock
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-primary)' };
const inputStyle = { padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem' };
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

export default WarehouseTransfer;
