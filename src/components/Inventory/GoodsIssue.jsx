import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ArrowLeft, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GoodsIssue = () => {
    const { items, warehouses, addTransaction, getStockLevel } = useInventory();
    const { addEntry } = useAccounting();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        reference: '',
        date: new Date().toISOString().split('T')[0],
        warehouseId: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState([
        { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, currentStock: 0 }
    ]);

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;

        if (field === 'itemId') {
            const item = items.find(i => i.id === value);
            if (item) {
                // Use Purchase Cost for COGS
                lines[index].unitCost = item.purchasePrice;
                lines[index].currentStock = getStockLevel(value, formData.warehouseId);
            }
        }

        if (field === 'quantity' || field === 'unitCost' || field === 'itemId') {
            lines[index].totalCost = lines[index].quantity * lines[index].unitCost;
        }

        setLineItems(lines);
    };

    const addLine = () => {
        setLineItems([...lineItems, { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, currentStock: 0 }]);
    };

    const removeLine = (index) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!formData.warehouseId || !formData.reference) return alert('Please fill required fields');

        // Validation: Check Stock
        for (let line of lineItems) {
            const stock = getStockLevel(line.itemId, formData.warehouseId);
            if (line.quantity > stock) {
                alert(`Insufficient stock for item ID: ${line.itemId}. Available: ${stock}`);
                return;
            }
        }

        // 1. Create Inventory Transaction
        const transaction = {
            ...formData,
            type: 'OUT',
            status: 'Posted',
            items: lineItems
        };

        addTransaction(transaction);

        // 2. Create Journal Entry
        // Debit COGS (5000), Credit Inventory Asset (1200)
        const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

        addEntry({
            date: formData.date,
            reference: formData.reference,
            description: `Goods Issue - ${formData.reference}`,
            status: 'Posted',
            sourceType: 'Inventory',
            isAutomatic: true,
            lines: [
                { id: 1, account: '5000', description: 'Cost of Goods Sold', debit: totalValue, credit: 0 },
                { id: 2, account: '1200', description: 'Inventory Asset', debit: 0, credit: totalValue }
            ]
        });

        navigate('/admin/inventory/transactions');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/transactions')} style={{ marginBottom: '1rem' }}>
                Back to Transactions
            </Button>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Goods Issue (Delivery)</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Reference (e.g. Invoice #)</label>
                        <input value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} style={inputStyle} placeholder="INV-2024-001" required />
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Issuing Warehouse</label>
                        <select value={formData.warehouseId} onChange={e => setFormData({ ...formData, warehouseId: e.target.value })} style={inputStyle} required>
                            <option value="">Select Warehouse</option>
                            {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Item</th>
                            <th style={thStyle}>Stock On Hand</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Unit Cost (Avg)</th>
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
                                        disabled={!formData.warehouseId}
                                    >
                                        <option value="">Select Item</option>
                                        {items.filter(i => i.type === 'Stock').map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                        ))}
                                    </select>
                                    {!formData.warehouseId && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Select Warehouse first</div>}
                                </td>
                                <td style={tdStyle}>
                                    {line.itemId && (
                                        <span style={{ fontWeight: 600, color: getStockLevel(line.itemId, formData.warehouseId) < line.quantity ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                            {getStockLevel(line.itemId, formData.warehouseId)}
                                        </span>
                                    )}
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
                                    {line.unitCost.toFixed(2)}
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

                <Button variant="outline" icon={<Plus size={16} />} onClick={addLine} style={{ marginBottom: '2rem' }}>
                    Add Line Item
                </Button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <Button variant="outline" onClick={() => navigate('/admin/inventory/transactions')}>Cancel</Button>
                    <Button variant="primary" icon={<CheckCircle size={16} />} onClick={handleSubmit}>
                        Post Issue
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-primary)' };
const inputStyle = { padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

export default GoodsIssue;
