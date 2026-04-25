import React, { useEffect, useState } from 'react';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const navigate = useNavigate();
    const dashboardQuery = useCustomQuery('/api/inventory/dashboard/', ['inventory-dashboard']);
    const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth < 1100);

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const summary = dashboardQuery.data?.summary ?? {};
    const lowStockItems = Array.isArray(dashboardQuery.data?.low_stock_items) ? dashboardQuery.data.low_stock_items : [];
    const recentTransactions = Array.isArray(dashboardQuery.data?.recent_movements?.data)
        ? dashboardQuery.data.recent_movements.data.slice(0, 5)
        : [];
    const totalInventoryValue = Number(summary.total_inventory_value ?? 0);
    const totalItems = Number(summary.total_items ?? 0);
    const lowStockAlerts = Number(summary.low_stock_alerts ?? lowStockItems.length ?? 0);
    const movementsToday = Number(summary.movements_today ?? 0);

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
                        value={lowStockAlerts}
                        icon={<AlertTriangle size={24} />}
                        color={lowStockAlerts > 0 ? "danger" : "success"}
                    />
                </div>
                <div onClick={() => navigate('/admin/inventory/transactions')} style={{ cursor: 'pointer' }}>
                    <KPICard title="Movements (Today)" value={movementsToday} icon={<TrendingUp size={24} />} color="secondary" />
                </div>
            </div>
            {dashboardQuery.isPending && <Spinner />}

            {dashboardQuery.isError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load dashboard data.</p>
                        <button
                            type="button"
                            onClick={() => dashboardQuery.refetch()}
                            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem 0.8rem', cursor: 'pointer', color: 'var(--color-text-main)' }}
                        >
                            Retry
                        </button>
                    </div>
                </Card>
            )}

            {!dashboardQuery.isPending && !dashboardQuery.isError && (
                <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '2fr 1fr', gap: '1.5rem' }}>
                    {/* Recent Activity */}
                    <Card title="Recent Transactions">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {recentTransactions.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent activity.</td></tr>
                                ) : (
                                    recentTransactions.map((trans) => {
                                        const type = String(trans.type || '').toUpperCase();
                                        const isIn = type === 'IN';
                                        const isTransfer = type === 'TRANSFER';
                                        return (
                                            <tr key={trans.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.75rem 0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            padding: '0.5rem',
                                                            borderRadius: '50%',
                                                            background: isIn
                                                                ? 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))'
                                                                : isTransfer
                                                                    ? 'color-mix(in srgb, var(--color-primary-500) 18%, var(--color-bg-card))'
                                                                    : 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
                                                            color: isIn
                                                                ? 'var(--color-success)'
                                                                : isTransfer
                                                                    ? 'var(--color-primary-600)'
                                                                    : 'var(--color-warning)',
                                                        }}>
                                                            {isIn ? <ArrowDownLeft size={16} /> : isTransfer ? <ArrowRightLeft size={16} /> : <ArrowUpRight size={16} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{trans.reference}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{trans.date}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {type}
                                                </td>
                                            </tr>
                                        );
                                    })
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
                                lowStockItems.map((item) => (
                                    <div key={`${item.id}-${item.warehouse}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'color-mix(in srgb, var(--color-error) 16%, var(--color-bg-card))', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-error)' }}>{item.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.warehouse}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ display: 'block', fontWeight: 700, color: 'var(--color-error)' }}>{Number(item.quantity ?? 0)}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Reorder: {item.reorder_level ?? 0}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
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
