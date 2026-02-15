import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpRight, ArrowDownRight,
    Users, DollarSign, Package, ShoppingCart,
    TrendingUp, CreditCard, Clock, AlertTriangle,
    Wallet, FileText, UserCheck, Truck, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import Card from '../../components/common/Card';

// ── Generate realistic daily data (Jan 2024 → Dec 2025) ──

const generateDailyData = () => {
    const data = [];
    const start = new Date(2024, 0, 1);
    const end = new Date(2025, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const month = d.getMonth();
        const seasonFactor = 1 + 0.2 * Math.sin((month - 3) * Math.PI / 6);
        const weekendDip = (dayOfWeek === 5 || dayOfWeek === 6) ? 0.6 : 1;
        const base = 1500 * seasonFactor * weekendDip;
        data.push({
            date: d.toISOString().split('T')[0],
            revenue: Math.round(base + Math.random() * 800),
            expenses: Math.round((base * 0.65) + Math.random() * 400),
        });
    }
    return data;
};
const allDailyData = generateDailyData();

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const aggregateData = (data, mode) => {
    if (mode === 'daily') return data.map(d => ({ label: d.date.slice(5), ...d }));
    const groups = {};
    data.forEach(d => {
        const dt = new Date(d.date);
        let key;
        if (mode === 'weekly') {
            const weekStart = new Date(dt);
            weekStart.setDate(dt.getDate() - dt.getDay());
            key = weekStart.toISOString().split('T')[0];
        } else if (mode === 'monthly') {
            key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = `${dt.getFullYear()}`;
        }
        if (!groups[key]) groups[key] = { revenue: 0, expenses: 0 };
        groups[key].revenue += d.revenue;
        groups[key].expenses += d.expenses;
    });
    return Object.entries(groups).map(([key, val]) => {
        let label = key;
        if (mode === 'monthly') {
            const [y, m] = key.split('-');
            label = `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`;
        } else if (mode === 'weekly') {
            const dt = new Date(key);
            label = `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}`;
        }
        return { label, revenue: val.revenue, expenses: val.expenses };
    });
};

const expenseBreakdown = [
    { name: 'Salaries', value: 45 },
    { name: 'Operations', value: 25 },
    { name: 'Marketing', value: 15 },
    { name: 'Supplies', value: 15 },
];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const recentActivity = [
    { id: 1, text: 'Payroll processed for February', dept: 'HR', time: '2h ago', color: '#3b82f6' },
    { id: 2, text: 'Invoice #1042 paid — $8,500', dept: 'Finance', time: '3h ago', color: '#10b981' },
    { id: 3, text: 'Low stock alert: USB-C Hubs (5 left)', dept: 'Inventory', time: '5h ago', color: '#f59e0b' },
    { id: 4, text: 'New purchase order #PO-331 created', dept: 'Sales', time: '6h ago', color: '#8b5cf6' },
    { id: 5, text: 'Employee Sarah Ahmed promoted', dept: 'HR', time: '1d ago', color: '#3b82f6' },
];

// ── Main Component ─────────────────────────────────────

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [chartFilter, setChartFilter] = useState('monthly');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const chartData = useMemo(() => {
        let filtered = allDailyData;
        if (dateFrom) filtered = filtered.filter(d => d.date >= dateFrom);
        if (dateTo) filtered = filtered.filter(d => d.date <= dateTo);
        // If date range is short (≤14 days), show daily; otherwise use selected mode
        const effectiveMode = (dateFrom && dateTo)
            ? ((new Date(dateTo) - new Date(dateFrom)) / 86400000 <= 14 ? 'daily' : chartFilter)
            : chartFilter;
        return aggregateData(filtered, effectiveMode);
    }, [chartFilter, dateFrom, dateTo]);

    const dateInputStyle = {
        padding: '0.35rem 0.5rem', borderRadius: '0.4rem',
        border: '1px solid var(--color-border)', fontSize: '0.75rem',
        color: 'var(--color-text-main)', background: 'white',
        outline: 'none', cursor: 'pointer'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Page Header */}
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    Company overview across all departments
                </p>
            </div>

            {/* ── Top KPI Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <KpiCard
                    label="Total Revenue" value="$145,200" change="+12.5%"
                    up icon={<DollarSign size={20} />} accent="#10b981"
                />
                <KpiCard
                    label="Employees" value="124" change="+4 this month"
                    up icon={<Users size={20} />} accent="#3b82f6"
                />
                <KpiCard
                    label="Inventory Items" value="1,204" change="12 low stock"
                    icon={<Package size={20} />} accent="#f59e0b"
                />
                <KpiCard
                    label="Open Orders" value="45" change="+8 today"
                    up icon={<ShoppingCart size={20} />} accent="#8b5cf6"
                />
            </div>

            {/* ── Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Revenue Trend */}
                <Card className="padding-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Revenue vs Expenses</h3>
                        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-slate-100)', borderRadius: '0.5rem', padding: '3px' }}>
                            {['weekly', 'monthly', 'yearly'].map(f => (
                                <button key={f} onClick={() => setChartFilter(f)} style={{
                                    padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: 'none',
                                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                    background: chartFilter === f ? 'white' : 'transparent',
                                    color: chartFilter === f ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                    boxShadow: chartFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {f === 'weekly' ? 'Weekly' : f === 'monthly' ? 'Monthly' : 'Yearly'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Date Range Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>From</span>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={dateInputStyle} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>To</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={dateInputStyle} />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{
                                padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid var(--color-border)',
                                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                                background: 'white', color: 'var(--color-text-muted)'
                            }}>
                                Clear
                            </button>
                        )}
                    </div>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickFormatter={v => v >= 1000 ? `$${v / 1000}k` : `$${v}`} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Expense Breakdown */}
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Expense Breakdown</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {expenseBreakdown.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Legend iconType="circle" />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* ── Department Panels ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Finance & Accounting */}
                <DeptCard
                    title="Finance & Accounting" accent="#10b981"
                    icon={<Wallet size={20} />}
                    onClick={() => navigate('/admin/accounting')}
                    stats={[
                        { label: 'Cash Balance', value: '$842,000' },
                        { label: 'Receivables', value: '$38,500' },
                        { label: 'Payables', value: '$24,200' },
                        { label: 'Net Profit', value: '$61,200', trend: '+18%', up: true },
                    ]}
                />

                {/* Human Resources */}
                <DeptCard
                    title="Human Resources" accent="#3b82f6"
                    icon={<UserCheck size={20} />}
                    onClick={() => navigate('/admin/hr')}
                    stats={[
                        { label: 'Total Employees', value: '124' },
                        { label: 'On Leave Today', value: '8' },
                        { label: 'Open Positions', value: '6' },
                        { label: 'Payroll (Monthly)', value: '$240,000' },
                    ]}
                />

                {/* Inventory & Warehouse */}
                <DeptCard
                    title="Inventory & Warehouse" accent="#f59e0b"
                    icon={<Package size={20} />}
                    onClick={() => navigate('/admin/inventory')}
                    stats={[
                        { label: 'Total Items', value: '1,204' },
                        { label: 'Stock Value', value: '$840,000' },
                        { label: 'Low Stock Items', value: '12', color: '#ef4444' },
                        { label: 'Pending POs', value: '5' },
                    ]}
                />

                {/* Sales & CRM */}
                <DeptCard
                    title="Sales & CRM" accent="#8b5cf6"
                    icon={<ShoppingCart size={20} />}
                    onClick={() => navigate('/admin/sales')}
                    stats={[
                        { label: 'Active Orders', value: '45' },
                        { label: 'Monthly Sales', value: '$52,000', trend: '+15%', up: true },
                        { label: 'Customers', value: '312' },
                        { label: 'Avg. Order Value', value: '$1,155' },
                    ]}
                />
            </div>

            {/* ── Recent Activity ── */}
            <Card className="padding-lg">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recentActivity.map(item => (
                        <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: item.color, flexShrink: 0
                                }} />
                                <span style={{ fontSize: '0.9rem' }}>{item.text}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600, color: item.color,
                                    background: `${item.color}15`, padding: '2px 8px', borderRadius: '1rem'
                                }}>{item.dept}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// ── Sub-Components ─────────────────────────────────────

const KpiCard = ({ label, value, change, up, icon, accent }) => (
    <Card className="padding-md hoverable" style={{ borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{value}</h3>
            </div>
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${accent}15`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
        </div>
        {change && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {up !== undefined && (
                    <span style={{ color: up ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center' }}>
                        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                )}
                <span style={{ color: 'var(--color-text-muted)' }}>{change}</span>
            </div>
        )}
    </Card>
);

const DeptCard = ({ title, accent, icon, stats, onClick }) => (
    <Card className="padding-lg hoverable" style={{ cursor: 'pointer', borderTop: `3px solid ${accent}` }} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: `${accent}15`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {stats.map((s, i) => (
                <div key={i} style={{ padding: '0.5rem 0' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>{s.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: s.color || 'var(--color-text-main)' }}>{s.value}</span>
                        {s.trend && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: s.up ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center' }}>
                                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {s.trend}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

export default AdminDashboard;
