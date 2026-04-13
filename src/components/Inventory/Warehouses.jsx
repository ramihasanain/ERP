import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Plus, Edit, Trash2, MapPin, User, Warehouse } from 'lucide-react';

const Warehouses = () => {
    const { warehouses, addWarehouse, updateWarehouse } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [formData, setFormData] = useState({ name: '', location: '', managerId: '' });

    const handleEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        setFormData(warehouse);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingWarehouse(null);
        setFormData({ name: '', location: '', managerId: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingWarehouse) {
            updateWarehouse(editingWarehouse.id, formData);
        } else {
            addWarehouse(formData);
        }
        setIsModalOpen(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Warehouses</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage physical storage locations.</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
                    Add Warehouse
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {warehouses.map(wh => (
                    <Card key={wh.id} className="padding-md" style={{ borderTop: '4px solid var(--color-secondary-500)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.75rem', background: 'color-mix(in srgb, var(--color-secondary-500) 14%, var(--color-bg-card))', borderRadius: '50%', color: 'var(--color-secondary-600)' }}>
                                    <Warehouse size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{wh.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <MapPin size={14} />
                                        <span>{wh.location}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleEdit(wh)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                <Edit size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                            <User size={16} color="var(--color-text-muted)" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>Manager:</span>
                            <span style={{ fontWeight: 500 }}>{wh.managerId === '1' ? 'Ahmed Al-Sayed' : wh.managerId === '2' ? 'Sara Khalil' : 'Unassigned'}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Warehouse Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Location / Address</label>
                                <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Manager</label>
                                <select value={formData.managerId} onChange={e => setFormData({ ...formData, managerId: e.target.value })} style={inputStyle}>
                                    <option value="">Select Manager</option>
                                    <option value="1">Ahmed Al-Sayed</option>
                                    <option value="2">Sara Khalil</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">{editingWarehouse ? 'Update' : 'Create'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
    background: 'var(--color-bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '400px',
    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)',
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-main)' };
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' };

export default Warehouses;
