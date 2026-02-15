import React, { useState, useEffect } from 'react';
import { useInventory } from '../../../context/InventoryContext';
import { useAccounting } from '../../../context/AccountingContext';
import { useProcurement } from '../../../context/ProcurementContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Plus, Save, Trash2, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GoodsReceipt = () => {
    const { addTransaction, items, warehouses } = useInventory();
    const { addEntry, vendors, bankAccounts } = useAccounting();
    const { purchaseOrders, updatePurchaseOrder } = useProcurement();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        reference: '',
        date: new Date().toISOString().split('T')[0],
        warehouseId: '',
        notes: '',
        poId: '' // Link to PO
    });

    const [lineItems, setLineItems] = useState([]);

    // Filter Approved POs
    const approvedPOs = purchaseOrders.filter(po => po.status === 'Approved');

    const handlePOSelection = (e) => {
        const poId = e.target.value;
        const po = purchaseOrders.find(p => p.id === poId);

        if (po) {
            setFormData(prev => ({
                ...prev,
                poId: poId,
                reference: `GRN-${poId}`,
                notes: `Received against ${poId}`
            }));

            // Map PO items to GRN items
            const newItems = po.items.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.totalCost
            }));
            setLineItems(newItems);
        } else {
            setFormData(prev => ({ ...prev, poId: '' }));
            setLineItems([]);
        }
    };

    const handleLineChange = (index, field, value) => {
        const lines = [...lineItems];
        lines[index][field] = value;

        // Auto-calculate total
        if (field === 'quantity' || field === 'unitCost') {
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
        if (!formData.warehouseId) {
            alert("Please select a warehouse");
            return;
        }

        const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

        // 1. Add Inventory Transaction
        const transaction = {
            date: formData.date,
            type: 'IN', // Inbound
            warehouseId: formData.warehouseId,
            reference: formData.reference,
            items: lineItems.map(line => ({
                itemId: line.itemId,
                quantity: parseInt(line.quantity),
                unitCost: parseFloat(line.unitCost)
            })),
            notes: formData.notes
        };

        addTransaction(transaction);

        // 2. Create Journal Entry (Dr Inventory / Cr GRNI)
        const journalEntry = {
            date: formData.date,
            reference: formData.reference,
            description: `Goods Receipt - ${formData.reference}`,
            status: 'Posted',
            sourceType: 'Inventory',
            isAutomatic: true,
            lines: [
                {
                    id: 1,
                    account: '1200', // Inventory Asset (Using Group/Main for now, ideally specific)
                    description: 'Inventory Asset',
                    debit: totalValue,
                    credit: 0
                },
                {
                    id: 2,
                    account: '2105', // GRNI Liability
                    description: `Goods Received Not Invoiced - ${formData.poId || 'Direct'}`,
                    debit: 0,
                    credit: totalValue
                }
            ]
        };

        addEntry(journalEntry);

        // 3. Update PO Status if applicable
        if (formData.poId) {
            updatePurchaseOrder(formData.poId, { status: 'Received' });
        }

        navigate('/admin/inventory/transactions');
    };

    const totalValue = lineItems.reduce((acc, item) => acc + item.totalCost, 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Goods Receipt (GRN)</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Load from Purchase Order</label>
                        <select
                            value={formData.poId}
                            onChange={handlePOSelection}
                            style={{ ...inputStyle, borderColor: 'var(--color-primary)' }}
                        >
                            <option value="">Select Approved PO...</option>
                            {approvedPOs.map(po => (
                                <option key={po.id} value={po.id}>{po.id} - {po.vendorName}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            Selecting a PO will auto-fill items and link the transaction.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Reference No.</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            style={inputStyle}
                            placeholder="e.g. GRN-001"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Warehouse</label>
                        <select
                            value={formData.warehouseId}
                            onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        style={{ ...inputStyle, width: '100%', minHeight: '60px' }}
                    />
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
                                        onChange={(e) => {
                                            const item = items.find(i => i.id === e.target.value);
                                            handleLineChange(index, 'itemId', e.target.value);
                                            if (item) handleLineChange(index, 'unitCost', item.averageCost || 0);
                                        }}
                                        style={{ ...inputStyle, width: '100%' }}
                                    >
                                        <option value="">Select Item</option>
                                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
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

                <Button variant="outline" icon={<Plus size={16} />} onClick={addLine} style={{ marginBottom: '2rem' }}>
                    Add Line Item
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        Total Value: {totalValue.toLocaleString()} JOD
                    </div>
                    <Button variant="primary" icon={<Save size={16} />} onClick={handleSubmit}>
                        Process Receipt
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

export default GoodsReceipt;
