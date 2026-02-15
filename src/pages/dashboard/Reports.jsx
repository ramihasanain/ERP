import React from 'react';
import Card from '../../components/common/Card';
import { BarChart3, PieChart, TrendingUp, FileText, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportCard = ({ title, description, icon, links }) => {
    const navigate = useNavigate();
    return (
        <Card className="padding-lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--color-primary-50)', borderRadius: '0.75rem', color: 'var(--color-primary-700)' }}>
                    {icon}
                </div>
                <ArrowUpRight size={20} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1 }}>{description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {links.map((link, i) => (
                    <div key={i} onClick={() => link.url && navigate(link.url)} style={{ fontSize: '0.9rem', color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 500, display: 'block', cursor: link.url ? 'pointer' : 'default' }}>
                        {link.label}
                    </div>
                ))}
            </div>
        </Card>
    );
};

const Reports = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Reports Center</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Financial insights and operational analytics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <ReportCard
                    title="Financial Statements"
                    description="Essential financial reports for accounting compliance and health monitoring."
                    icon={<TrendingUp size={24} />}
                    links={[
                        { label: "Balance Sheet", url: "balance-sheet" },
                        { label: "Profit & Loss (Income Statement)", url: "pnl" },
                        { label: "Cash Flow Statement", url: "cash-flow" },
                        { label: "Tax Return (VAT/GST)", url: "tax-return" }
                    ]}
                />
                <ReportCard
                    title="Sales & Customers"
                    description="Analyze revenue trends, customer growth, and outstanding debts."
                    icon={<BarChart3 size={24} />}
                    links={[
                        { label: "Sales by Customer", url: "sales-by-customer" },
                        { label: "Aged Receivables", url: "aged-receivables" },
                        { label: "Revenue by Item", url: "revenue-by-item" }
                    ]}
                />
                <ReportCard
                    title="Expense & Purchasing"
                    description="Track spending, vendor payments, and operational costs."
                    icon={<PieChart size={24} />}
                    links={[
                        { label: "Expense Breakdown", url: "expense-breakdown" },
                        { label: "Aged Payables", url: "aged-payables" },
                        { label: "Purchase History", url: "purchase-history" }
                    ]}
                />
                <ReportCard
                    title="Inventory & Stock"
                    description="Monitor stock levels, valuation, and movement history."
                    icon={<FileText size={24} />}
                    links={[
                        { label: "Inventory Valuation", url: "inventory-valuation" },
                        { label: "Low Stock Alert", url: "low-stock" },
                        { label: "Stock Movement Log", url: "stock-movement" }
                    ]}
                />
            </div>
        </div>
    );
};

export default Reports;
