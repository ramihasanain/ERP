import React from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { BarChart3, PieChart, TrendingUp, FileText, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBasePath } from '@/hooks/useBasePath';

const ReportCard = ({ title, description, icon, links }) => {
    const navigate = useNavigate();
    return (
        <Card className="padding-lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))', borderRadius: '0.75rem', color: 'var(--color-primary-600)' }}>
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
    const { t } = useTranslation('reports');
    const navigate = useNavigate();
    const basePath = useBasePath();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(`${basePath}/accounting`)}
                    className="cursor-pointer shrink-0"
                    aria-label={t('aria.back')}
                />
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('center.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('center.subtitle')}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <ReportCard
                    title={t('cards.financial.title')}
                    description={t('cards.financial.description')}
                    icon={<TrendingUp size={24} />}
                    links={[
                        { label: t('cards.financial.balanceSheet'), url: 'balance-sheet' },
                        { label: t('cards.financial.profitAndLoss'), url: 'pnl' },
                        { label: t('cards.financial.cashFlow'), url: 'cash-flow' },
                        { label: t('cards.financial.taxReturn'), url: 'tax-return' },
                    ]}
                />
                <ReportCard
                    title={t('cards.sales.title')}
                    description={t('cards.sales.description')}
                    icon={<BarChart3 size={24} />}
                    links={[
                        { label: t('cards.sales.salesByCustomer'), url: 'sales-by-customer' },
                        { label: t('cards.sales.agedReceivables'), url: 'aged-receivables' },
                        { label: t('cards.sales.revenueByItem'), url: 'revenue-by-item' },
                    ]}
                />
                <ReportCard
                    title={t('cards.expense.title')}
                    description={t('cards.expense.description')}
                    icon={<PieChart size={24} />}
                    links={[
                        { label: t('cards.expense.expenseBreakdown'), url: 'expense-breakdown' },
                        { label: t('cards.expense.agedPayables'), url: 'aged-payables' },
                        { label: t('cards.expense.purchaseHistory'), url: 'purchase-history' },
                    ]}
                />
                <ReportCard
                    title={t('cards.inventory.title')}
                    description={t('cards.inventory.description')}
                    icon={<FileText size={24} />}
                    links={[
                        { label: t('cards.inventory.inventoryValuation'), url: 'inventory-valuation' },
                        { label: t('cards.inventory.lowStock'), url: 'low-stock' },
                        { label: t('cards.inventory.stockMovement'), url: 'stock-movement' },
                    ]}
                />
            </div>
        </div>
    );
};

export default Reports;
