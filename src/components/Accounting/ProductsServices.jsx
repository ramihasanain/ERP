import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '@/context/AccountingContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Trash2, Edit3, Search, ArrowLeft, Package, Briefcase, Save, X } from 'lucide-react';

const ProductsServices = () => {
    const navigate = useNavigate();
    const { productsAndServices, addProductOrService, updateProductOrService, deleteProductOrService, taxRules, accounts } = useAccounting();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: '4110'
    });

    const revenueAccounts = accounts.filter(a => a.code?.startsWith('4') && !a.isGroup);

    const filteredItems = productsAndServices.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.price) return;
        if (editingItem) {
            updateProductOrService(editingItem.id, { ...formData, price: Number(formData.price) });
        } else {
            addProductOrService({ ...formData, price: Number(formData.price) });
        }
        resetForm();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, type: item.type, price: item.price, unit: item.unit, taxRuleId: item.taxRuleId || '', description: item.description || '', revenueAccount: item.revenueAccount || '4110' });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', type: 'Service', price: '', unit: 'Unit', taxRuleId: '', description: '', revenueAccount: '4110' });
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem',
        background: 'white', color: 'var(--color-text-main)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/accounting')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Products & Services</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Manage your catalog of billable items.</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => { resetForm(); setShowForm(true); }}>
                    Add Item
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search products or services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '8px', border: '1px solid var(--color-border)',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-slate-100)', padding: '4px', borderRadius: '8px' }}>
                    {['All', 'Product', 'Service'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                padding: '6px 14px', border: 'none', borderRadius: '6px',
                                background: filterType === type ? 'white' : 'transparent',
                                boxShadow: filterType === type ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                color: filterType === type ? 'var(--color-primary-600)' : 'var(--color-slate-600)',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                            }}
                        >
                            {type === 'All' ? 'All' : type + 's'}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="padding-lg" style={{ border: '2px solid var(--color-primary-200)', background: 'linear-gradient(to bottom right, white, var(--color-primary-50))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <Input label="Item Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Web Development" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                            <select style={selectStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="Service">Service</option>
                                <option value="Product">Product</option>
                            </select>
                        </div>
                        <Input label="Price *" type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Unit</label>
                            <select style={selectStyle} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="Unit">Unit</option>
                                <option value="Hour">Hour</option>
                                <option value="Day">Day</option>
                                <option value="Month">Month</option>
                                <option value="Project">Project</option>
                                <option value="Piece">Piece</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tax Rule</label>
                            <select style={selectStyle} value={formData.taxRuleId} onChange={e => setFormData({ ...formData, taxRuleId: e.target.value })}>
                                <option value="">No Tax</option>
                                {taxRules.map(rule => (
                                    <option key={rule.id} value={rule.id}>{rule.name} ({rule.rate}%)</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Revenue Account</label>
                            <select style={selectStyle} value={formData.revenueAccount} onChange={e => setFormData({ ...formData, revenueAccount: e.target.value })}>
                                {revenueAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSubmit}>{editingItem ? 'Update' : 'Save'}</Button>
                    </div>
                </Card>
            )}

            {/* Items Table */}
            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-slate-50)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Item</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Unit</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tax</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: item.type === 'Service' ? 'var(--color-primary-50)' : 'var(--color-success-dim)',
                                            color: item.type === 'Service' ? 'var(--color-primary-600)' : 'var(--color-success)'
                                        }}>
                                            {item.type === 'Service' ? <Briefcase size={18} /> : <Package size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: item.type === 'Service' ? 'var(--color-primary-50)' : 'var(--color-success-dim)',
                                        color: item.type === 'Service' ? 'var(--color-primary-600)' : 'var(--color-success)'
                                    }}>
                                        {item.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{item.unit}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{Number(item.price).toFixed(2)} JOD</td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                    {item.taxRuleId ? taxRules.find(r => r.id === item.taxRuleId)?.name || 'N/A' : 'None'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => deleteProductOrService(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No items found. Click "Add Item" to create your first product or service.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default ProductsServices;
