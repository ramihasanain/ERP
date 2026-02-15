import React, { useState } from 'react';
import { useCategories } from '../../context/CategoryContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Plus, Edit3, Trash2, Check, X, Tag, Package, Monitor, Briefcase, FolderOpen } from 'lucide-react';

const groupIcons = {
    'Inventory Items': <Package size={18} />,
    'Fixed Assets': <Monitor size={18} />,
    'Expense Types': <Briefcase size={18} />,
    'Account Types': <FolderOpen size={18} />,
};

const groupColors = {
    'Inventory Items': '#f59e0b',
    'Fixed Assets': '#3b82f6',
    'Expense Types': '#ef4444',
    'Account Types': '#10b981',
};

const CategoryManagement = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [addingGroup, setAddingGroup] = useState(null);
    const [newName, setNewName] = useState('');

    const handleAdd = (group) => {
        if (!newName.trim()) return;
        addCategory(group, newName.trim());
        setNewName('');
        setAddingGroup(null);
    };

    const handleEdit = (group, id) => {
        if (!editValue.trim()) return;
        updateCategory(group, id, editValue.trim());
        setEditingId(null);
        setEditValue('');
    };

    const handleDelete = (group, id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            deleteCategory(group, id);
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditValue(cat.name);
        setAddingGroup(null);
    };

    const startAdd = (group) => {
        setAddingGroup(group);
        setNewName('');
        setEditingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Category Management</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    Manage all category dropdowns used across the system.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {Object.entries(categories).map(([group, items]) => {
                    const accent = groupColors[group] || '#6366f1';
                    return (
                        <Card key={group} className="padding-lg" style={{ borderTop: `3px solid ${accent}` }}>
                            {/* Group Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: `${accent}15`, color: accent,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {groupIcons[group] || <Tag size={18} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{group}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{items.length} categories</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => startAdd(group)}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                                        background: `${accent}15`, color: accent, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Add category"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Category List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {items.map(cat => (
                                    <div key={cat.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.6rem 0', borderBottom: '1px solid var(--color-slate-100)'
                                    }}>
                                        {editingId === cat.id ? (
                                            /* Edit Mode */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                                <input
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleEdit(group, cat.id)}
                                                    style={{
                                                        flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem',
                                                        border: `1px solid ${accent}`, borderRadius: '4px', outline: 'none'
                                                    }}
                                                />
                                                <button onClick={() => handleEdit(group, cat.id)} style={{ ...iconBtnStyle, color: '#10b981' }}><Check size={14} /></button>
                                                <button onClick={() => setEditingId(null)} style={{ ...iconBtnStyle, color: 'var(--color-text-muted)' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat.name}</span>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button onClick={() => startEdit(cat)} style={iconBtnStyle} title="Edit"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDelete(group, cat.id)} style={{ ...iconBtnStyle, color: '#ef4444' }} title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Add New Row */}
                                {addingGroup === group && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0' }}>
                                        <input
                                            autoFocus
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAdd(group)}
                                            placeholder="New category name..."
                                            style={{
                                                flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem',
                                                border: `1px solid ${accent}`, borderRadius: '4px', outline: 'none'
                                            }}
                                        />
                                        <button onClick={() => handleAdd(group)} style={{ ...iconBtnStyle, color: '#10b981' }}><Check size={14} /></button>
                                        <button onClick={() => setAddingGroup(null)} style={{ ...iconBtnStyle, color: 'var(--color-text-muted)' }}><X size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

const iconBtnStyle = {
    width: '26px', height: '26px', borderRadius: '4px', border: 'none',
    background: 'transparent', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)',
    transition: 'background 0.15s ease',
};

export default CategoryManagement;
