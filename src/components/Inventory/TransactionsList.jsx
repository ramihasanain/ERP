import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Search, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransactionsList = () => {
    const { transactions, warehouses } = useInventory();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const getWarehouseName = (id) => {
        const wh = warehouses.find(w => w.id === id);
        return wh ? wh.name : 'Unknown';
    };

    const filteredTransactions = transactions.filter(t =>
        t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Inventory Transactions</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Track all stock movements.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<ArrowRight size={16} />} onClick={() => navigate('/admin/inventory/transactions/issue')}>
                        Goods Issue
                    </Button>
                    <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/inventory/transactions/receipt')}>
                        Goods Receipt
                    </Button>
                    <Button variant="outline" icon={<ArrowRight size={16} />} onClick={() => navigate('/admin/inventory/transactions/transfer')}>
                        Transfer
                    </Button>
                </div>
            </div>

            <Card className="padding-md">
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by Reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                            fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                        }}
                    />
                </div>
            </Card>

            <Card className="padding-md">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Reference</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Warehouse</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Items</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map(trans => (
                                <tr key={trans.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="erp-table-row-hover">
                                    <td style={tdStyle}>{trans.date}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{trans.reference}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                            background: trans.type === 'IN' ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))' : trans.type === 'OUT' ? 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))' : 'color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))',
                                            color: trans.type === 'IN' ? 'var(--color-success)' : trans.type === 'OUT' ? 'var(--color-warning)' : 'var(--color-primary-600)'
                                        }}>
                                            {trans.type}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{getWarehouseName(trans.warehouseId)}</td>
                                    <td style={tdStyle}>
                                        <span style={{ color: 'var(--color-success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            Posted
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{trans.items.length} items</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 };
const tdStyle = { padding: '1rem', verticalAlign: 'middle', fontSize: '0.9rem' };

export default TransactionsList;
