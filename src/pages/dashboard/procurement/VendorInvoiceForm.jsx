import React, { useState } from 'react';
import { useProcurement } from '../../../context/ProcurementContext';
import { useAccounting } from '../../../context/AccountingContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorInvoiceForm = () => {
    const { addVendorInvoice, purchaseOrders } = useProcurement();
    const { vendors, addEntry } = useAccounting();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        vendorId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        vendorInvoiceNumber: '',
        poId: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState([]);

    // Get Approved POs for the selected vendor
    const availablePOs = purchaseOrders.filter(po =>
        (po.status === 'Approved' || po.status === 'Received') &&
        (!formData.vendorId || po.vendorId === formData.vendorId)
    );

    const handleVendorChange = (e) => {
        const vendorId = e.target.value;
        setFormData(prev => ({ ...prev, vendorId, poId: '' }));
        setLineItems([]);
    };

    const handlePOSelection = (e) => {
        const poId = e.target.value;
        const po = purchaseOrders.find(p => p.id === poId);

        if (po) {
            setFormData(prev => ({
                ...prev,
                poId,
                vendorId: po.vendorId // Force vendor match
            }));

            // Load items from PO
            const newItems = po.items.map(item => ({
                description: item.name || `Item ${item.itemId}`, // Fallback description
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitCost,
                total: item.totalCost,
                account: '2105' // Default to GRNI Clearing Account
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
        if (field === 'quantity' || field === 'unitPrice') {
            lines[index].total = lines[index].quantity * lines[index].unitPrice;
        }
        setLineItems(lines);
    };

    const removeLine = (index) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!formData.vendorId || !formData.date || !formData.vendorInvoiceNumber) {
            alert("Please fill required fields (Vendor, Date, Vendor Invoice #)");
            return;
        }

        // Matching Logic Check (Optional Warning)
        if (formData.poId) {
            const po = purchaseOrders.find(p => p.id === formData.poId);
            if (po && Math.abs(totalValue - po.totalAmount) > 0.01) {
                if (!window.confirm(`Total Amount (${totalValue} JOD) differs from PO Amount (${po.totalAmount} JOD). Continue?`)) {
                    return;
                }
            }
        }

        const totalAmount = lineItems.reduce((acc, item) => acc + item.total, 0);
        const vendor = vendors.find(v => v.id === formData.vendorId);

        try {
            // 1. Save Bill in Procurement Context
            const newBill = {
                ...formData,
                vendorName: vendor?.name,
                items: lineItems,
                totalAmount,
                poReference: formData.poId
            };
            addVendorInvoice(newBill);

            // 2. Post Journal Entry (Dr GRNI / Cr AP)
            const journalLines = [
                {
                    id: 1,
                    account: '2000', // Accounts Payable
                    description: `Bill #${formData.vendorInvoiceNumber} - ${vendor?.name}`,
                    debit: 0,
                    credit: totalAmount
                },
                ...lineItems.map((item, idx) => ({
                    id: idx + 2,
                    account: item.account || '2105',
                    description: item.description,
                    debit: item.total,
                    credit: 0
                }))
            ];

            addEntry({
                date: formData.date,
                reference: formData.vendorInvoiceNumber,
                description: `Vendor Bill - ${vendor?.name}`,
                status: 'Posted',
                sourceType: 'Procurement',
                isAutomatic: true,
                lines: journalLines
            });

            navigate('/admin/inventory/invoices');
        } catch (error) {
            alert(error.message);
        }
    };

    const totalValue = lineItems.reduce((acc, item) => acc + item.total, 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/invoices')} style={{ marginBottom: '1rem' }}>
                Back to Bills
            </Button>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>Record Vendor Bill</h1>

            <Card className="padding-md" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Vendor</label>
                        <select
                            value={formData.vendorId}
                            onChange={handleVendorChange}
                            style={inputStyle}
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Load from Purchase Order</label>
                        <select
                            value={formData.poId}
                            onChange={handlePOSelection}
                            style={{ ...inputStyle, borderColor: 'var(--color-primary)' }}
                        >
                            <option value="">Select PO...</option>
                            {availablePOs.map(po => <option key={po.id} value={po.id}>{po.id} ({po.totalAmount} JOD)</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Vendor Invoice #</label>
                        <input
                            type="text"
                            placeholder="e.g. INV-8822"
                            value={formData.vendorInvoiceNumber}
                            onChange={e => setFormData({ ...formData, vendorInvoiceNumber: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Bill Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Due Date</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Description</th>
                            <th style={thStyle}>Account</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Rate</th>
                            <th style={thStyle}>Amount</th>
                            <th style={thStyle}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lineItems.map((line, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <input
                                        type="text"
                                        value={line.description}
                                        onChange={e => handleLineChange(index, 'description', e.target.value)}
                                        style={{ ...inputStyle, width: '100%' }}
                                    />
                                </td>
                                <td style={tdStyle}>
                                    <select
                                        value={line.account}
                                        onChange={e => handleLineChange(index, 'account', e.target.value)}
                                        style={{ ...inputStyle, width: '100%' }}
                                    >
                                        <option value="2105">2105 - GRNI Clearing</option>
                                        <option value="5000">5000 - Cost of Goods Sold</option>
                                        <option value="6000">6000 - General Expenses</option>
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                                        style={{ ...inputStyle, width: '70px' }}
                                    />
                                </td>
                                <td style={tdStyle}>
                                    <input
                                        type="number"
                                        value={line.unitPrice}
                                        onChange={e => handleLineChange(index, 'unitPrice', e.target.value)}
                                        style={{ ...inputStyle, width: '90px' }}
                                    />
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>
                                    {line.total.toLocaleString()}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        Total Payable: {totalValue.toLocaleString()} JOD
                    </div>
                    <Button variant="primary" icon={<Save size={16} />} onClick={handleSubmit}>
                        Save Bill
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

export default VendorInvoiceForm;
