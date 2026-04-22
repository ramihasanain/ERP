import React, { useMemo, useState } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { useAccounting } from '@/context/AccountingContext';
import { get, post } from '@/api';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

let dropdownDataPromise = null;
let dropdownDataCache = null;

const VendorInvoiceForm = () => {
    const VENDORS_ENDPOINT = 'https://zeyad.erp-api.site/api/purchasing/vendors/';
    const APPROVED_PURCHASE_ORDERS_ENDPOINT = 'https://zeyad.erp-api.site/api/purchasing/purchase-orders/?status=approved&vendor=&date_from=&date_to=';

    const { addVendorInvoice, purchaseOrders: contextPurchaseOrders } = useProcurement();
    const { vendors: contextVendors, addEntry } = useAccounting();
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPoLines, setIsLoadingPoLines] = useState(false);

    const [vendors, setVendors] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    React.useEffect(() => {
        let isCancelled = false;

        const getDropdownData = async () => {
            if (dropdownDataCache) return dropdownDataCache;

            if (!dropdownDataPromise) {
                dropdownDataPromise = Promise.all([
                    get(VENDORS_ENDPOINT),
                    get(APPROVED_PURCHASE_ORDERS_ENDPOINT),
                ]).then(([vendorsResponse, purchaseOrdersResponse]) => {
                    const vendorsData = Array.isArray(vendorsResponse?.data)
                        ? vendorsResponse.data
                        : Array.isArray(vendorsResponse?.results)
                            ? vendorsResponse.results
                            : Array.isArray(vendorsResponse)
                                ? vendorsResponse
                                : [];

                    const purchaseOrdersData = Array.isArray(purchaseOrdersResponse?.data)
                        ? purchaseOrdersResponse.data
                        : Array.isArray(purchaseOrdersResponse?.results)
                            ? purchaseOrdersResponse.results
                            : Array.isArray(purchaseOrdersResponse)
                                ? purchaseOrdersResponse
                                : [];

                    dropdownDataCache = {
                        vendors: vendorsData.map((vendor) => ({
                            id: vendor.id,
                            name: vendor.name || 'Unknown Vendor',
                        })),
                        purchaseOrders: purchaseOrdersData.map((order) => ({
                            id: order.id,
                            number: order.number || order.id,
                            vendorId: order.vendor_id || order.vendor?.id || '',
                            vendorName: order.vendor_name || order.vendor?.name || '',
                            status: order.status_display || order.status || 'Approved',
                            totalAmount: Number(order.total_amount ?? 0),
                            currency: order.currency || 'JOD',
                            items: Array.isArray(order.items) ? order.items : [],
                        })),
                    };

                    return dropdownDataCache;
                }).catch((error) => {
                    dropdownDataPromise = null;
                    throw error;
                });
            }

            return dropdownDataPromise;
        };

        const loadDropdownData = async () => {
            try {
                const data = await getDropdownData();
                if (isCancelled) return;
                setVendors(data.vendors);
                setPurchaseOrders(data.purchaseOrders);
            } catch (error) {
                if (isCancelled) return;
                // Keep fallback data from contexts when APIs fail.
                setVendors(Array.isArray(contextVendors) ? contextVendors : []);
                setPurchaseOrders(Array.isArray(contextPurchaseOrders) ? contextPurchaseOrders : []);
            }
        };

        loadDropdownData();

        return () => {
            isCancelled = true;
        };
    }, []);

    const selectedVendor = useMemo(
        () => vendors.find((vendor) => vendor.id === formData.vendorId),
        [vendors, formData.vendorId]
    );

    // Get approved POs for selected vendor
    const availablePOs = useMemo(
        () =>
            purchaseOrders.filter((po) => {
                const normalizedStatus = String(po.status || '').toLowerCase();
                const isApproved = normalizedStatus === 'approved';
                if (!isApproved) return false;
                if (!formData.vendorId) return true;
                if (po.vendorId) return po.vendorId === formData.vendorId;
                return Boolean(selectedVendor?.name) && po.vendorName === selectedVendor.name;
            }),
        [formData.vendorId, purchaseOrders, selectedVendor?.name]
    );
    const handleVendorChange = (e) => {
        const vendorId = e.target.value;
        setFormData(prev => ({ ...prev, vendorId, poId: '' }));
        setLineItems([]);
    };

    const handlePOSelection = async (e) => {
        const poId = e.target.value;
        const po = purchaseOrders.find(p => p.id === poId);

        if (!po) {
            setFormData(prev => ({ ...prev, poId: '' }));
            setLineItems([]);
            return;
        }

        const matchedVendorByName = vendors.find((vendor) => vendor.name === po.vendorName);
        const resolvedVendorId = po.vendorId || matchedVendorByName?.id || '';

        setFormData(prev => ({
            ...prev,
            poId,
            vendorId: resolvedVendorId || prev.vendorId // Force vendor match when available
        }));

        setIsLoadingPoLines(true);
        try {
            const poDetails = await get(`https://zeyad.erp-api.site/api/purchasing/purchase-orders/${poId}/`);
            const poLines = Array.isArray(poDetails?.lines) ? poDetails.lines : [];

            const newItems = poLines.map((line) => {
                const quantity = Number(line.quantity ?? 0);
                const unitPrice = Number(line.unit_price ?? 0);
                const total = Number(line.total_cost ?? (quantity * unitPrice));

                return {
                    description: line.product_name || line.product_sku || `Item ${line.product_id || line.id}`,
                    itemId: line.product_id || line.id,
                    quantity,
                    unitPrice,
                    total,
                    account: '2105',
                };
            });

            setLineItems(newItems);
        } catch (error) {
            // Fallback to list endpoint items if details endpoint fails.
            const fallbackItems = (Array.isArray(po.items) ? po.items : []).map((item) => {
                const quantity = Number(item.quantity ?? 0);
                const unitPrice = Number(item.unitCost ?? item.unit_price ?? 0);
                const total = Number(item.totalCost ?? item.total_cost ?? (quantity * unitPrice));

                return {
                    description: item.name || item.product_name || `Item ${item.itemId || item.product_id || item.id}`,
                    itemId: item.itemId || item.product_id || item.id,
                    quantity,
                    unitPrice,
                    total,
                    account: '2105',
                };
            });
            setLineItems(fallbackItems);
        } finally {
            setIsLoadingPoLines(false);
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

    const handleSubmit = async () => {
        if (!formData.vendorId || !formData.date || !formData.vendorInvoiceNumber) {
            alert("Please fill required fields (Vendor, Date, Vendor Invoice #)");
            return;
        }

        if (!lineItems.length) {
            alert("Please add at least one line item.");
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
            setIsSubmitting(true);
            const payload = {
                vendor_id: formData.vendorId,
                purchase_order_id: formData.poId || null,
                vendor_invoice_number: formData.vendorInvoiceNumber,
                bill_date: formData.date,
                due_date: formData.dueDate || null,
                status: 'draft',
                notes: formData.notes || '',
                lines: lineItems.map((item) => ({
                    description: item.description || '',
                    account_id: item.account || null,
                    quantity: Number(item.quantity || 0).toFixed(4),
                    rate: Number(item.unitPrice || 0).toFixed(2),
                })),
            };

            const createdBill = await post('/api/purchasing/bills/create/', payload);

            // 1. Save Bill in Procurement Context
            const newBill = {
                ...formData,
                id: createdBill?.id || `BILL-${Date.now()}`,
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
            const message = error?.response?.data?.detail || error?.message || 'Failed to create vendor bill.';
            alert(message);
        } finally {
            setIsSubmitting(false);
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
                <div style={formGridStyle}>
                    <div style={fieldStyle}>
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
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Load from Purchase Order</label>
                        <select
                            value={formData.poId}
                            onChange={handlePOSelection}
                            style={{ ...inputStyle, borderColor: 'var(--color-primary)' }}
                        >
                            <option value="">Select PO...</option>
                            {availablePOs.map(po => (
                                <option key={po.id} value={po.id}>
                                    {po.number} ({po.totalAmount} {po.currency})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={fieldStyle}>
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
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Bill Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Due Date</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                            placeholder="Optional note for this bill"
                        />
                    </div>
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
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
                    <Button variant="primary" icon={<Save size={16} />} onClick={handleSubmit} disabled={isSubmitting || isLoadingPoLines}>
                        {isSubmitting ? 'Saving...' : 'Save Bill'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem 1.25rem'
};
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const labelStyle = { margin: 0, fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-text-secondary)' };
const inputStyle = { width: '100%', minHeight: '40px', padding: '0.6rem 0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

export default VendorInvoiceForm;
