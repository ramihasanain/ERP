import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const AddItem = () => {
    const { items, addItem, updateItem } = useInventory();
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        type: 'Stock', // Stock, Service
        uom: 'pcs',
        category: 'General',
        purchasePrice: '',
        sellingPrice: '',
        reorderLevel: '',
        glAccountId: '1200' // Default Inventory Account
    });

    useEffect(() => {
        if (id && items) {
            const item = items.find(i => i.id === id);
            if (item) {
                setFormData(item);
            }
        }
    }, [id, items]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            purchasePrice: parseFloat(formData.purchasePrice),
            sellingPrice: parseFloat(formData.sellingPrice),
            reorderLevel: parseInt(formData.reorderLevel)
        };

        if (id) {
            updateItem(id, payload);
        } else {
            addItem(payload);
        }
        navigate('/admin/inventory/items');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/items')} style={{ marginBottom: '1rem' }}>
                Back to Items
            </Button>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>{id ? 'Edit Item' : 'Add New Item'}</h1>

            <form onSubmit={handleSubmit}>
                <Card className="padding-md">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        {/* Basic Info */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Item Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>SKU (Stock Keeping Unit)</label>
                            <input name="sku" value={formData.sku} onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Category</label>
                            <input name="category" value={formData.category} onChange={handleChange} list="categories" style={inputStyle} />
                            <datalist id="categories">
                                <option value="General" />
                                <option value="Electronics" />
                                <option value="Furniture" />
                                <option value="Consumables" />
                                <option value="Services" />
                            </datalist>
                        </div>

                        <div>
                            <label style={labelStyle}>Item Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                                <option value="Stock">Stock Item</option>
                                <option value="Service">Service (Non-stock)</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Unit of Measure</label>
                            <select name="uom" value={formData.uom} onChange={handleChange} style={inputStyle}>
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="m">Meters (m)</option>
                                <option value="l">Liters (l)</option>
                                <option value="hr">Hours (hr)</option>
                            </select>
                        </div>

                        {/* Pricing */}
                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', margin: '1rem 0' }}></div>

                        <div>
                            <label style={labelStyle}>Cost Price (Purchase)</label>
                            <input name="purchasePrice" type="number" step="0.01" value={formData.purchasePrice} onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Selling Price</label>
                            <input name="sellingPrice" type="number" step="0.01" value={formData.sellingPrice} onChange={handleChange} required style={inputStyle} />
                        </div>

                        {/* Stock Settings */}
                        {formData.type === 'Stock' && (
                            <>
                                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', margin: '1rem 0' }}></div>

                                <div>
                                    <label style={labelStyle}>Reorder Level (Low Stock Alert)</label>
                                    <input name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} style={inputStyle} />
                                </div>

                                <div>
                                    <label style={labelStyle}>Inventory Asset Account (GL)</label>
                                    <select name="glAccountId" value={formData.glAccountId} onChange={handleChange} style={inputStyle} disabled>
                                        <option value="1200">1200 - Inventory Asset</option>
                                    </select>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Default GL account for stock valuation.</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="primary" icon={<CheckCircle size={18} />}>
                            {id ? 'Update Item' : 'Create Item'}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };

export default AddItem;
