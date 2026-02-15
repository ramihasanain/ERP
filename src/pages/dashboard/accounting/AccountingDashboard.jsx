import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { FileText, List, Plus, Landmark, Monitor, Percent, Users, ArrowUpRight, DollarSign, ShoppingCart, Package, Target, CheckCircle } from 'lucide-react';

const AccountingDashboard = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Accounting</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage your general ledger, accounts, and transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button icon={<Plus size={18} />} onClick={() => navigate('journal/new')}>New Journal Entry</Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('coa')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <List size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chart of Accounts</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage account structure.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('gl')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>General Ledger</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>View account history.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('journal')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Journal Entries</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>View & edit entries.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('invoices')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Sales Invoices</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage billing & revenue.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('customers')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Customers</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage client profiles.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('bank')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Landmark size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Bank & Cash</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Treasury management.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('assets')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Monitor size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Fixed Assets</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Track depreciation.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('trial-balance')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Percent size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Trial Balance</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Debit/Credit totals.</p>
                </Card>
                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/reports')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reports Center</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>P&L, Balance Sheet.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate('cost-centers')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Target size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cost Centers</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Budgets & Allocation.</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{
                        width: '240px',
                        cursor: 'pointer',
                        border: '1px solid var(--color-primary-200)',
                        background: 'linear-gradient(to bottom right, white, var(--color-primary-50))'
                    }}
                    onClick={() => navigate('vendor-payments')}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Vendor Payments</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Approval workflow.</p>
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.7rem',
                        background: 'var(--color-primary-600)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        display: 'inline-block'
                    }}>
                        Approvals Needed
                    </div>
                </Card>
            </div>

            {/* Recent Transactions Section */}
            <Card className="padding-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Transactions</h3>
                    <Button variant="ghost" size="sm" icon={<ArrowUpRight size={16} />}>View All</Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <TransactionItem
                        icon={<DollarSign size={18} />}
                        title="Payment from Global Corp"
                        subtitle="Inv #INV-2025-001 - Sales Revenue"
                        date="Today, 10:30 AM"
                        amount="+$12,500.00"
                        amountColor="var(--color-success)"
                        bg="var(--color-success-dim)"
                        iconColor="var(--color-success)"
                    />
                    <TransactionItem
                        icon={<ShoppingCart size={18} />}
                        title="Office Supplies Purchase"
                        subtitle="Vendor: Staples Inc. - Stationary"
                        date="Yesterday, 2:15 PM"
                        amount="-$342.50"
                        amountColor="var(--color-text-main)"
                        bg="var(--color-slate-100)"
                        iconColor="var(--color-slate-600)"
                    />
                    <TransactionItem
                        icon={<Monitor size={18} />}
                        title="New Asset: Server Rack"
                        subtitle="Fixed Assets - IT Equipment"
                        date="Feb 05, 09:00 AM"
                        amount="-$4,200.00"
                        amountColor="var(--color-text-main)"
                        bg="var(--color-primary-50)"
                        iconColor="var(--color-primary-600)"
                    />
                    <TransactionItem
                        icon={<Landmark size={18} />}
                        title="Bank Fee Charge"
                        subtitle="Monthly Service Fee"
                        date="Feb 01, 12:00 AM"
                        amount="-$25.00"
                        amountColor="var(--color-text-main)"
                        bg="var(--color-warning-dim)"
                        iconColor="var(--color-warning)"
                    />
                </div>
            </Card>
        </div>
    );
};

const TransactionItem = ({ icon, title, subtitle, date, amount, amountColor, bg, iconColor }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 0', borderBottom: '1px solid var(--color-border)'
    }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
                minWidth: '2.75rem', height: '2.75rem', borderRadius: '1rem',
                background: bg, color: iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{subtitle}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-border)' }}></span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{date}</span>
                </div>
            </div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: amountColor }}>{amount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'var(--color-success-dim)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>
                Posted
            </span>
        </div>
    </div>
);

export default AccountingDashboard;
