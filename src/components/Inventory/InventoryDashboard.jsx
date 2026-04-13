import React from 'react';
import { useInventory } from '@/context/InventoryContext';
import Card from '@/components/Shared/Card';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const { items, getStockLevel, transactions } = useInventory();
    const navigate = useNavigate();

    // KPIs
    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.type === 'Stock' && getStockLevel(i.id) <= i.reorderLevel);

    // Calculate Total Inventory Value
    const totalInventoryValue = items.reduce((acc, item) => {
        if (item.type !== 'Stock') return acc;
        return acc + (getStockLevel(item.id) * item.purchasePrice);
    }, 0);

    const recentTransactions = transactions.slice(0, 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div onClick={() => navigate('/admin/inventory/reports/valuation')} style={{ cursor: 'pointer' }}>
                    <KPICard title="Total Inventory Value" value={`${totalInventoryValue.toLocaleString()} JOD`} icon={<DollarSign size={24} />} color="primary" />
                </div>
                <div onClick={() => navigate('/admin/inventory/items')} style={{ cursor: 'pointer' }}>
                    <KPICard title="Total Items" value={totalItems} icon={<Package size={24} />} color="primary" />
                </div>
                <div onClick={() => navigate('/admin/inventory/items?filter=low_stock')} style={{ cursor: 'pointer' }}>
                    <KPICard
                        title="Low Stock Alerts"
                        value={lowStockItems.length}
                        icon={<AlertTriangle size={24} />}
                        color={lowStockItems.length > 0 ? "danger" : "success"}
                    />
                </div>
                <div onClick={() => navigate('/admin/inventory/transactions')} style={{ cursor: 'pointer' }}>
                    <KPICard title="Movements (Today)" value={transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length} icon={<TrendingUp size={24} />} color="secondary" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Recent Activity */}
                <Card title="Recent Transactions">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {recentTransactions.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent activity.</td></tr>
                            ) : (
                                recentTransactions.map(trans => (
                                    <tr key={trans.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    padding: '0.5rem', borderRadius: '50%',
                                                    background: trans.type === 'IN' ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))' : 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                                    color: trans.type === 'IN' ? 'var(--color-success)' : 'var(--color-warning)'
                                                }}>
                                                    {trans.type === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{trans.reference}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{trans.date}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {trans.type}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button onClick={() => navigate('/admin/inventory/transactions')} style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer' }}>View All</button>
                    </div>
                </Card>

                {/* Low Stock List */}
                <Card title="Low Stock Items" headerAction={<span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>{lowStockItems.length} Items</span>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {lowStockItems.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>All stock levels healthy.</div>
                        ) : (
                            lowStockItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'color-mix(in srgb, var(--color-error) 16%, var(--color-bg-card))', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-error)' }}>{item.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>SKU: {item.sku}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontWeight: 700, color: 'var(--color-error)' }}>{getStockLevel(item.id)} {item.uom}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Reorder: {item.reorderLevel}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, color }) => {
    const c = color === 'indigo' ? 'primary' : color;
    return (
        <Card className="padding-md" style={{ borderLeft: `4px solid var(--color-${c}-500)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    padding: '0.75rem',
                    background: `color-mix(in srgb, var(--color-${c}-500) 14%, var(--color-bg-card))`,
                    borderRadius: '50%',
                    color: `var(--color-${c}-600)`,
                }}
                >
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{title}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
                </div>
            </div>
        </Card>
    );
};

export default InventoryDashboard;
