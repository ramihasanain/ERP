import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

const CreatePurchaseOrder = () => {
    const navigate = useNavigate();
    const { costCenters } = useAccounting();
    const [items, setItems] = useState([
        { id: 1, item: '', qty: 1, unitCost: 0, costCenter: '' }
    ]);

    const addItem = () => {
        setItems([...items, { id: items.length + 1, item: '', qty: 1, unitCost: 0, costCenter: '' }]);
    };

    // ... (rest of handlers same as before)
    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>New Purchase Order</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Order stock from suppliers.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* ... (Header inputs same as before) ... */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Supplier Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Vendor</label>
                            <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <option>Global Tech Supplies Ltd.</option>
                                <option>Office Depot Inc.</option>
                            </select>
                        </div>
                        <Input label="Expected Delivery" type="date" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Order Details</h3>
                        <Input label="PO Number" defaultValue="PO-2025-009" />
                        <Input label="Order Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.5rem', width: '30%' }}>Item Description</th>
                                <th style={{ padding: '0.5rem', width: '15%' }}>Cost Center</th>
                                <th style={{ padding: '0.5rem', width: '10%', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '0.5rem', width: '15%', textAlign: 'right' }}>Unit Cost</th>
                                <th style={{ padding: '0.5rem', width: '15%', textAlign: 'right' }}>Line Total</th>
                                <th style={{ padding: '0.5rem', width: '5%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <Input
                                            value={item.item}
                                            onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                                            placeholder="Select item..."
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            value={item.costCenter}
                                            onChange={(e) => updateItem(item.id, 'costCenter', e.target.value)}
                                        >
                                            <option value="">None</option>
                                            {costCenters.map(cc => (
                                                <option key={cc.id} value={cc.id}>{cc.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.unitCost}
                                            onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                                            style={{ textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                                        ${(item.qty * item.unitCost).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Button variant="outline" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '1.25rem', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--color-primary-600)' }}>${calculateTotal().toFixed(2)}</span>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button icon={<Save size={18} />}>Create Order</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CreatePurchaseOrder;
