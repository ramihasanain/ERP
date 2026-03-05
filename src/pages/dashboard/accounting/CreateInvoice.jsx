import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { costCenters, customers, taxRules, calculateTax, productsAndServices } = useAccounting();

    // Invoice State
    const [clientId, setClientId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [isTaxInclusive, setIsTaxInclusive] = useState(false);

    // Items State
    const [items, setItems] = useState([
        { id: 1, item: '', qty: 1, price: 0, taxRuleId: '', costCenter: '', taxAmount: 0, total: 0 }
    ]);

    // Recalculate totals whenever items or tax settings change
    useEffect(() => {
        const updatedItems = items.map(item => {
            const taxResult = calculateTax(item.qty * item.price, item.taxRuleId, isTaxInclusive);
            return {
                ...item,
                taxAmount: taxResult.tax,
                total: taxResult.total,
                net: taxResult.net
            };
        });

        // Only update if values actually changed to avoid infinite loop (JSON comparison is quick for small logic)
        if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
            setItems(updatedItems);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTaxInclusive, items.map(i => `${i.qty}-${i.price}-${i.taxRuleId}`).join(',')]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), item: '', qty: 1, price: 0, taxRuleId: '', costCenter: '', taxAmount: 0, total: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const getTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (isTaxInclusive ? item.net : (item.qty * item.price)), 0);
        const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
        return { subtotal, taxTotal, grandTotal };
    };

    const { subtotal, taxTotal, grandTotal } = getTotals();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Create Invoice</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Issue a new sales invoice to a client.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Client Details</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Client Name</label>
                                <select
                                    style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                >
                                    <option value="">Select client...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="outline"
                                style={{ width: '2.5rem', padding: 0, justifyContent: 'center' }}
                                title="Add New Client"
                                onClick={() => navigate('/admin/accounting/customers/new')}
                            >
                                <Plus size={18} />
                            </Button>
                        </div>
                        <Input label="Billing Address" placeholder="Street, City, Country" />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="taxInclusive"
                                checked={isTaxInclusive}
                                onChange={e => setIsTaxInclusive(e.target.checked)}
                                style={{ width: '1rem', height: '1rem' }}
                            />
                            <label htmlFor="taxInclusive" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>Amounts include tax</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Invoice Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input label="Invoice Date" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        <Input label="Invoice Number" defaultValue={`INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`} readOnly />
                    </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.5rem', width: '30%' }}>Item Description</th>
                                <th style={{ padding: '0.5rem', width: '10%', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '0.5rem', width: '15%', textAlign: 'right' }}>Price</th>
                                <th style={{ padding: '0.5rem', width: '20%' }}>Tax Rule</th>
                                <th style={{ padding: '0.5rem', width: '15%', textAlign: 'right' }}>Total</th>
                                <th style={{ padding: '0.5rem', width: '5%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={item.item}
                                            onChange={(e) => {
                                                const selectedProduct = productsAndServices.find(p => p.name === e.target.value);
                                                if (selectedProduct) {
                                                    updateItem(item.id, 'item', selectedProduct.name);
                                                    updateItem(item.id, 'price', selectedProduct.price);
                                                    if (selectedProduct.taxRuleId) {
                                                        updateItem(item.id, 'taxRuleId', selectedProduct.taxRuleId);
                                                    }
                                                } else {
                                                    updateItem(item.id, 'item', e.target.value);
                                                }
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                        >
                                            <option value="">Select item...</option>
                                            {productsAndServices.filter(p => p.type === 'Service').length > 0 && (
                                                <optgroup label="Services">
                                                    {productsAndServices.filter(p => p.type === 'Service').map(p => (
                                                        <option key={p.id} value={p.name}>{p.name} ({p.price.toFixed(2)} JOD / {p.unit})</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {productsAndServices.filter(p => p.type === 'Product').length > 0 && (
                                                <optgroup label="Products">
                                                    {productsAndServices.filter(p => p.type === 'Product').map(p => (
                                                        <option key={p.id} value={p.name}>{p.name} ({p.price.toFixed(2)} JOD / {p.unit})</option>
                                                    ))}
                                                </optgroup>
                                            )}
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
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                            style={{ textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            value={item.taxRuleId}
                                            onChange={(e) => updateItem(item.id, 'taxRuleId', e.target.value)}
                                        >
                                            <option value="">No Tax</option>
                                            {taxRules.map(rule => (
                                                <option key={rule.id} value={rule.id}>{rule.name} ({rule.rate}%)</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600 }}>${item.total.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            (Tax: ${item.taxAmount.toFixed(2)})
                                        </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal (Net):</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Total Tax:</span>
                        <span>${taxTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '1.25rem', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span>Grand Total:</span>
                        <span style={{ color: 'var(--color-primary-600)' }}>${grandTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button icon={<Save size={18} />}>Save Invoice</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CreateInvoice;
