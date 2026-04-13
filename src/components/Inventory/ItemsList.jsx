import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Search, Plus, Edit, Trash2, Package, Tag, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ItemsList = () => {
    const { items, deleteItem, getStockLevel } = useInventory();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(items.map(i => i.category))];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Items & Services</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage your product master data and services.</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate('/admin/inventory/items/new')}>
                    Add New Item
                </Button>
            </div>

            <Card className="padding-md">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="var(--color-text-muted)" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)', minWidth: '150px', color: 'var(--color-text-main)',
                            }}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredItems.map(item => (
                    <Card key={item.id} className="padding-md" style={{ borderLeft: `4px solid ${item.type === 'Stock' ? 'var(--color-primary-500)' : 'var(--color-secondary-500)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>{item.sku}</span>
                                    <span>•</span>
                                    <span>{item.category}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navigate(`/admin/inventory/items/${item.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Selling Price</div>
                                <div style={{ fontWeight: 600 }}>{item.sellingPrice.toFixed(2)} JOD</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Cost Price</div>
                                <div style={{ fontWeight: 600 }}>{item.purchasePrice.toFixed(2)} JOD</div>
                            </div>
                        </div>

                        {item.type === 'Stock' && (
                            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Package size={16} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Quality on Hand</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getStockLevel(item.id) <= item.reorderLevel ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                    {getStockLevel(item.id)} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>{item.uom}</span>
                                </span>
                            </div>
                        )}
                        {item.type === 'Service' && (
                            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                                <Tag size={16} />
                                Service Item (Non-stock)
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ItemsList;
