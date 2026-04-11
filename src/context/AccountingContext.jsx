import React, { createContext, useContext, useState, useMemo } from 'react';

const AccountingContext = createContext();

const initialCostCenters = [
    { id: 'CC-001', name: 'Executive / Admin', code: 'ADM', budget: 120000 },
    { id: 'CC-002', name: 'Sales & Marketing', code: 'SLS', budget: 85000 },
    { id: 'CC-003', name: 'IT & Development', code: 'DEV', budget: 150000 },
    { id: 'CC-004', name: 'Operations', code: 'OPS', budget: 95000 },
];

const initialEntries = [
    {
        id: 'JE-2025-001', date: '2025-01-01', reference: 'OPEN-2025', description: 'Annual Opening Balance', status: 'Posted', isAutomatic: true, sourceType: 'System',
        lines: [
            { id: 1, account: '1111', description: 'Initial Cash', debit: 50000, credit: 0, costCenter: '' },
            { id: 2, account: '1131', description: 'Arab Bank Opening', debit: 150000, credit: 0, costCenter: '' },
            { id: 3, account: '3110', description: 'Capital Account', debit: 0, credit: 200000, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-002', date: '2025-02-01', reference: 'RENT-FEB', description: 'Monthly Office Rent - Feb 2025', status: 'Posted',
        lines: [
            { id: 1, account: '6120', description: 'February Rent', debit: 2500, credit: 0, costCenter: 'CC-001' },
            { id: 2, account: '1131', description: 'Payment via Arab Bank', debit: 0, credit: 2500, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-003', date: '2025-02-03', reference: 'INV-TS-001', description: 'Software Consulting - Tech Solutions Ltd.', status: 'Posted',
        lines: [
            { id: 1, account: '1140', description: 'Receivable from Tech Solutions', debit: 4500, credit: 0, costCenter: 'CC-002' },
            { id: 2, account: '4110', description: 'Sales Revenue', debit: 0, credit: 4500, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-004', date: '2025-02-05', reference: 'ASSET-PURCH', description: 'MacBook Pro M3 Max - IT Dept', status: 'Posted',
        lines: [
            { id: 1, account: '1250', description: 'IT Equipment Asset', debit: 3500, credit: 0, costCenter: 'CC-003' },
            { id: 2, account: '1131', description: 'Arab Bank Payment', debit: 0, credit: 3500, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-005', date: '2025-02-06', reference: 'DEPR-FEB', description: 'Monthly Depreciation - IT Equipment', status: 'Posted', isAutomatic: true, sourceType: 'Asset System',
        lines: [
            { id: 1, account: '6610', description: 'Depreciation Expense', debit: 150, credit: 0, costCenter: 'CC-003' },
            { id: 2, account: '1320', description: 'Acc. Depr. - IT', debit: 0, credit: 150, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-006', date: '2025-02-08', reference: 'INV-GT-550', description: 'Global Trading Co. Service Maintenance', status: 'Posted',
        lines: [
            { id: 1, account: '1140', description: 'Receivable from Global Trading', debit: 1200, credit: 0, costCenter: 'CC-004' },
            { id: 2, account: '4120', description: 'Service Revenue', debit: 0, credit: 1200, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-007', date: '2025-02-10', reference: 'MARK-ADS', description: 'Google Ads - Q1 Campaign', status: 'Posted',
        lines: [
            { id: 1, account: '6230', description: 'Social Media Ads', debit: 800, credit: 0, costCenter: 'CC-002' },
            { id: 2, account: '1131', description: 'Arab Bank Payment', debit: 0, credit: 800, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-008', date: '2025-02-12', reference: 'UTIL-HQ', description: 'Electricity & Water HQ', status: 'Posted',
        lines: [
            { id: 1, account: '6130', description: 'Utilities Expense', debit: 450, credit: 0, costCenter: 'CC-001' },
            { id: 2, account: '1111', description: 'Petty Cash Payment', debit: 0, credit: 450, costCenter: '' },
        ]
    },
    {
        id: 'JE-2025-009', date: '2025-02-13', reference: 'SAL-FEB-PARTIAL', description: 'Employee Advances - Feb', status: 'Posted',
        lines: [
            { id: 1, account: '1190', description: 'Staff Advance', debit: 1500, credit: 0, costCenter: 'CC-001' },
            { id: 2, account: '1132', description: 'Housing Bank Payment', debit: 0, credit: 1500, costCenter: '' },
        ]
    }
];

// ── Accounts Data ──
// ── Accounts Data ──
const initialAccounts = [
    // 1000 - ASSETS
    { id: '1000', code: '1000', name: 'ASSETS', type: 'Asset', isSystem: true, isGroup: true },
    { id: '1100', code: '1100', name: 'Current Assets', type: 'Asset', parentCode: '1000', isSystem: true, isGroup: true },
    { id: '1130', code: '1130', name: 'Bank Accounts', type: 'Asset', parentCode: '1100', isSystem: true, isGroup: true },
    { id: '1131', code: '1131', name: 'Arab Bank - Corporate', type: 'Asset', parentCode: '1130', isSystem: false, isGroup: false },
    { id: '1132', code: '1132', name: 'Housing Bank - Operations', type: 'Asset', parentCode: '1130', isSystem: false, isGroup: false },

    { id: '1110', code: '1110', name: 'Cash on Hand', type: 'Asset', parentCode: '1100', isSystem: true, isGroup: true },
    { id: '1111', code: '1111', name: 'Main Cash Box', type: 'Asset', parentCode: '1110', isSystem: false, isGroup: false },
    { id: '1140', code: '1140', name: 'Accounts Receivable', type: 'Asset', parentCode: '1100', isSystem: true, isGroup: false },
    { id: '1150', code: '1150', name: 'Allowance for Doubtful Accounts', type: 'Asset', parentCode: '1100', isSystem: false, isGroup: false },
    { id: '1160', code: '1160', name: 'Inventory', type: 'Asset', parentCode: '1100', isSystem: true, isGroup: false },
    { id: '1170', code: '1170', name: 'Work in Progress (WIP)', type: 'Asset', parentCode: '1100', isSystem: false, isGroup: false },
    { id: '1180', code: '1180', name: 'Prepaid Expenses', type: 'Asset', parentCode: '1100', isSystem: false, isGroup: false },
    { id: '1190', code: '1190', name: 'Employee Advances', type: 'Asset', parentCode: '1100', isSystem: false, isGroup: false },
    { id: '1195', code: '1195', name: 'Short-term Investments', type: 'Asset', parentCode: '1100', isSystem: false, isGroup: false },

    { id: '1200', code: '1200', name: 'Fixed Assets', type: 'Asset', parentCode: '1000', isSystem: true, isGroup: true, icon: 'Building' },
    { id: '1210', code: '1210', name: 'Land', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Map' },
    { id: '1220', code: '1220', name: 'Buildings', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Building' },
    { id: '1230', code: '1230', name: 'Office Furniture', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Armchair' },
    { id: '1240', code: '1240', name: 'Office Equipment', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Printer' },
    { id: '1250', code: '1250', name: 'Computers & IT Equipment', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Monitor' },
    { id: '1260', code: '1260', name: 'Vehicles', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Truck' },
    { id: '1270', code: '1270', name: 'Machinery', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Wrench' },
    { id: '1280', code: '1280', name: 'Leasehold Improvements', type: 'Asset', parentCode: '1200', isSystem: false, isGroup: false, icon: 'Hammer' },

    { id: '1300', code: '1300', name: 'Accumulated Depreciation', type: 'Asset', parentCode: '1000', isSystem: true, isGroup: true },
    { id: '1310', code: '1310', name: 'Acc. Depr. - Buildings', type: 'Asset', parentCode: '1300', isSystem: false, isGroup: false },
    { id: '1320', code: '1320', name: 'Acc. Depr. - Equipment', type: 'Asset', parentCode: '1300', isSystem: false, isGroup: false },
    { id: '1330', code: '1330', name: 'Acc. Depr. - Vehicles', type: 'Asset', parentCode: '1300', isSystem: false, isGroup: false },

    { id: '1400', code: '1400', name: 'Intangible Assets', type: 'Asset', parentCode: '1000', isSystem: false, isGroup: true },
    { id: '1410', code: '1410', name: 'Software Licenses', type: 'Asset', parentCode: '1400', isSystem: false, isGroup: false },
    { id: '1420', code: '1420', name: 'Patents', type: 'Asset', parentCode: '1400', isSystem: false, isGroup: false },
    { id: '1430', code: '1430', name: 'Trademarks', type: 'Asset', parentCode: '1400', isSystem: false, isGroup: false },
    { id: '1440', code: '1440', name: 'Goodwill', type: 'Asset', parentCode: '1400', isSystem: false, isGroup: false },

    // 2000 - LIABILITIES
    { id: '2000', code: '2000', name: 'LIABILITIES', type: 'Liability', isSystem: true, isGroup: true },
    { id: '2100', code: '2100', name: 'Current Liabilities', type: 'Liability', parentCode: '2000', isSystem: true, isGroup: true },
    { id: '2105', code: '2105', name: 'Goods Received Not Invoiced (GRNI)', type: 'Liability', parentCode: '2100', isSystem: true, isGroup: false },
    { id: '2110', code: '2110', name: 'Accounts Payable', type: 'Liability', parentCode: '2100', isSystem: true, isGroup: false },
    { id: '2120', code: '2120', name: 'Accrued Expenses', type: 'Liability', parentCode: '2100', isSystem: false, isGroup: false },
    { id: '2130', code: '2130', name: 'Salaries Payable', type: 'Liability', parentCode: '2100', isSystem: true, isGroup: false },
    { id: '2140', code: '2140', name: 'Tax Payable', type: 'Liability', parentCode: '2100', isSystem: true, isGroup: false },
    { id: '2150', code: '2150', name: 'VAT Payable', type: 'Liability', parentCode: '2100', isSystem: true, isGroup: false },
    { id: '2160', code: '2160', name: 'Unearned Revenue', type: 'Liability', parentCode: '2100', isSystem: false, isGroup: false },
    { id: '2170', code: '2170', name: 'Short-term Loans', type: 'Liability', parentCode: '2100', isSystem: false, isGroup: false },
    { id: '2180', code: '2180', name: 'Credit Card Payable', type: 'Liability', parentCode: '2100', isSystem: false, isGroup: false },

    { id: '2200', code: '2200', name: 'Long-term Liabilities', type: 'Liability', parentCode: '2000', isSystem: false, isGroup: true },
    { id: '2210', code: '2210', name: 'Bank Loans', type: 'Liability', parentCode: '2200', isSystem: false, isGroup: false },
    { id: '2220', code: '2220', name: 'Mortgage Payable', type: 'Liability', parentCode: '2200', isSystem: false, isGroup: false },
    { id: '2230', code: '2230', name: 'Bonds Payable', type: 'Liability', parentCode: '2200', isSystem: false, isGroup: false },
    { id: '2240', code: '2240', name: 'Long-term Lease Obligations', type: 'Liability', parentCode: '2200', isSystem: false, isGroup: false },

    // 3000 - EQUITY
    { id: '3000', code: '3000', name: 'EQUITY', type: 'Equity', isSystem: true, isGroup: true },
    { id: '3110', code: '3110', name: 'Owner Capital', type: 'Equity', parentCode: '3000', isSystem: true, isGroup: false },
    { id: '3120', code: '3120', name: 'Partner Capital', type: 'Equity', parentCode: '3000', isSystem: false, isGroup: false },
    { id: '3130', code: '3130', name: 'Share Capital', type: 'Equity', parentCode: '3000', isSystem: false, isGroup: false },
    { id: '3140', code: '3140', name: 'Additional Paid-in Capital', type: 'Equity', parentCode: '3000', isSystem: false, isGroup: false },
    { id: '3150', code: '3150', name: 'Retained Earnings', type: 'Equity', parentCode: '3000', isSystem: true, isGroup: false },
    { id: '3160', code: '3160', name: 'Current Year Earnings', type: 'Equity', parentCode: '3000', isSystem: true, isGroup: false },
    { id: '3170', code: '3170', name: 'Dividends Paid', type: 'Equity', parentCode: '3000', isSystem: false, isGroup: false },
    { id: '3180', code: '3180', name: 'Owner Drawings', type: 'Equity', parentCode: '3000', isSystem: false, isGroup: false },

    // 4000 - REVENUE
    { id: '4000', code: '4000', name: 'REVENUE', type: 'Revenue', isSystem: true, isGroup: true },
    { id: '4100', code: '4100', name: 'Operating Revenue', type: 'Revenue', parentCode: '4000', isSystem: true, isGroup: true },
    { id: '4110', code: '4110', name: 'Sales Revenue', type: 'Revenue', parentCode: '4100', isSystem: true, isGroup: false },
    { id: '4120', code: '4120', name: 'Service Revenue', type: 'Revenue', parentCode: '4100', isSystem: false, isGroup: false },
    { id: '4130', code: '4130', name: 'Subscription Revenue', type: 'Revenue', parentCode: '4100', isSystem: false, isGroup: false },
    { id: '4140', code: '4140', name: 'Project Revenue', type: 'Revenue', parentCode: '4100', isSystem: false, isGroup: false },
    { id: '4150', code: '4150', name: 'Consulting Revenue', type: 'Revenue', parentCode: '4100', isSystem: false, isGroup: false },
    { id: '4160', code: '4160', name: 'Training Revenue', type: 'Revenue', parentCode: '4100', isSystem: false, isGroup: false },

    { id: '4200', code: '4200', name: 'Other Income', type: 'Revenue', parentCode: '4000', isSystem: false, isGroup: true },
    { id: '4210', code: '4210', name: 'Interest Income', type: 'Revenue', parentCode: '4200', isSystem: false, isGroup: false },
    { id: '4220', code: '4220', name: 'Investment Income', type: 'Revenue', parentCode: '4200', isSystem: false, isGroup: false },
    { id: '4230', code: '4230', name: 'Gain on Asset Sale', type: 'Revenue', parentCode: '4200', isSystem: false, isGroup: false },
    { id: '4240', code: '4240', name: 'Other Income', type: 'Revenue', parentCode: '4200', isSystem: false, isGroup: false },

    // 5000 - COST OF GOODS SOLD
    { id: '5000', code: '5000', name: 'COST OF GOODS SOLD', type: 'COGS', isSystem: true, isGroup: true },
    { id: '5110', code: '5110', name: 'Cost of Goods Sold', type: 'COGS', parentCode: '5000', isSystem: true, isGroup: false },
    { id: '5120', code: '5120', name: 'Raw Materials', type: 'COGS', parentCode: '5000', isSystem: false, isGroup: false },
    { id: '5130', code: '5130', name: 'Direct Labor', type: 'COGS', parentCode: '5000', isSystem: false, isGroup: false },
    { id: '5140', code: '5140', name: 'Manufacturing Costs', type: 'COGS', parentCode: '5000', isSystem: false, isGroup: false },
    { id: '5150', code: '5150', name: 'Packaging Costs', type: 'COGS', parentCode: '5000', isSystem: false, isGroup: false },
    { id: '5160', code: '5160', name: 'Shipping Costs', type: 'COGS', parentCode: '5000', isSystem: false, isGroup: false },

    // 6000 - EXPENSES
    { id: '6000', code: '6000', name: 'EXPENSES', type: 'Expense', isSystem: true, isGroup: true },
    { id: '6100', code: '6100', name: 'Administrative Expenses', type: 'Expense', parentCode: '6000', isSystem: true, isGroup: true },
    { id: '6110', code: '6110', name: 'Salaries Expense', type: 'Expense', parentCode: '6100', isSystem: true, isGroup: false },
    { id: '6120', code: '6120', name: 'Rent Expense', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },
    { id: '6130', code: '6130', name: 'Utilities Expense', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },
    { id: '6140', code: '6140', name: 'Office Supplies', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },
    { id: '6150', code: '6150', name: 'Insurance Expense', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },
    { id: '6160', code: '6160', name: 'Legal Fees', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },
    { id: '6170', code: '6170', name: 'Accounting Fees', type: 'Expense', parentCode: '6100', isSystem: false, isGroup: false },

    { id: '6200', code: '6200', name: 'Sales & Marketing', type: 'Expense', parentCode: '6000', isSystem: false, isGroup: true },
    { id: '6210', code: '6210', name: 'Marketing Expense', type: 'Expense', parentCode: '6200', isSystem: false, isGroup: false },
    { id: '6220', code: '6220', name: 'Advertising Expense', type: 'Expense', parentCode: '6200', isSystem: false, isGroup: false },
    { id: '6230', code: '6230', name: 'Social Media Ads', type: 'Expense', parentCode: '6200', isSystem: false, isGroup: false },
    { id: '6240', code: '6240', name: 'Sales Commissions', type: 'Expense', parentCode: '6200', isSystem: false, isGroup: false },

    { id: '6300', code: '6300', name: 'Technology Expenses', type: 'Expense', parentCode: '6000', isSystem: false, isGroup: true },
    { id: '6310', code: '6310', name: 'Software Subscriptions', type: 'Expense', parentCode: '6300', isSystem: false, isGroup: false },
    { id: '6320', code: '6320', name: 'Server & Hosting Costs', type: 'Expense', parentCode: '6300', isSystem: false, isGroup: false },
    { id: '6330', code: '6330', name: 'IT Support', type: 'Expense', parentCode: '6300', isSystem: false, isGroup: false },

    { id: '6400', code: '6400', name: 'HR Expenses', type: 'Expense', parentCode: '6000', isSystem: false, isGroup: true },
    { id: '6410', code: '6410', name: 'Recruitment Costs', type: 'Expense', parentCode: '6400', isSystem: false, isGroup: false },
    { id: '6420', code: '6420', name: 'Training Costs', type: 'Expense', parentCode: '6400', isSystem: false, isGroup: false },
    { id: '6430', code: '6430', name: 'Employee Benefits', type: 'Expense', parentCode: '6400', isSystem: false, isGroup: false },

    { id: '6500', code: '6500', name: 'Financial Expenses', type: 'Expense', parentCode: '6000', isSystem: false, isGroup: true },
    { id: '6510', code: '6510', name: 'Bank Charges', type: 'Expense', parentCode: '6500', isSystem: false, isGroup: false },
    { id: '6520', code: '6520', name: 'Interest Expense', type: 'Expense', parentCode: '6500', isSystem: false, isGroup: false },
    { id: '6530', code: '6530', name: 'Currency Exchange Loss', type: 'Expense', parentCode: '6500', isSystem: false, isGroup: false },

    { id: '6600', code: '6600', name: 'Depreciation', type: 'Expense', parentCode: '6000', isSystem: true, isGroup: true },
    { id: '6610', code: '6610', name: 'Depreciation – Equipment', type: 'Expense', parentCode: '6600', isSystem: false, isGroup: false },
    { id: '6620', code: '6620', name: 'Depreciation – Vehicles', type: 'Expense', parentCode: '6600', isSystem: false, isGroup: false },

    // 7000 - TAXES
    { id: '7000', code: '7000', name: 'TAXES', type: 'Expense', isSystem: true, isGroup: true },
    { id: '7110', code: '7110', name: 'Income Tax Expense', type: 'Expense', parentCode: '7000', isSystem: true, isGroup: false },
    { id: '7120', code: '7120', name: 'Deferred Tax', type: 'Expense', parentCode: '7000', isSystem: false, isGroup: false },
];

export const AccountingProvider = ({ children }) => {
    const [costCenters, setCostCenters] = useState(initialCostCenters);
    const [entries, setEntries] = useState(initialEntries);
    const [accounts, setAccounts] = useState(initialAccounts);

    // Initial Bank Data (Syncing with what was hardcoded in UI)
    const [bankAccounts, setBankAccounts] = useState([
        { id: 'BA-001', name: 'Arab Bank - Corporate', type: 'Bank', accountNumber: '**** 4829', balance: 142500.00, currency: 'JOD', glAccountId: '1131' },
        { id: 'BA-002', name: 'Housing Bank - Operations', type: 'Bank', accountNumber: '**** 9102', balance: 50000.00, currency: 'JOD', glAccountId: '1132' },
        { id: 'BA-003', name: 'Main Cash Box', type: 'Cash', accountNumber: 'HQ Safe', balance: 3250.00, currency: 'JOD', glAccountId: '1111' }
    ]);

    // ── Accounting Period Control ──
    // Status: 'Open', 'Soft Lock' (Admin only), 'Hard Lock' (No changes)
    const [accountingPeriods, setAccountingPeriods] = useState([
        { month: '2025-01', status: 'Hard Lock' }, // Past month closed
        { month: '2025-02', status: 'Open' }       // Current month open
    ]);

    const getPeriodStatus = (dateString) => {
        const month = dateString.substring(0, 7); // YYYY-MM
        const period = accountingPeriods.find(p => p.month === month);
        return period ? period.status : 'Open'; // Default to Open if not defined (future)
    };

    const togglePeriodStatus = (month) => {
        setAccountingPeriods(prev => {
            const existing = prev.find(p => p.month === month);
            if (existing) {
                // Cycle: Open -> Soft Lock -> Hard Lock -> Open
                const nextStatus = existing.status === 'Open' ? 'Soft Lock'
                    : existing.status === 'Soft Lock' ? 'Hard Lock'
                        : 'Open';
                return prev.map(p => p.month === month ? { ...p, status: nextStatus } : p);
            } else {
                return [...prev, { month, status: 'Soft Lock' }];
            }
        });
    };

    // ── Customers Logic ──
    const [customers, setCustomers] = useState([
        { id: 'CUST-001', name: 'Tech Solutions Ltd.', contact: 'David Miller', email: 'accounts@techsol.com', phone: '+1 (555) 123-4567', balance: 1200.00 },
        { id: 'CUST-002', name: 'Global Trading Co.', contact: 'Sarah Connor', email: 'billing@globaltrading.net', phone: '+1 (555) 987-6543', balance: 3500.00 }
    ]);



    const updateCustomer = (id, updatedData) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    };

    // ── Vendors Logic ──
    const [vendors, setVendors] = useState([
        { id: 'VEN-001', name: 'Office Supplies Co.', contact: 'John Smith', email: 'sales@officesupplies.com', phone: '+1 (555) 111-2222', balance: 0 },
        { id: 'VEN-002', name: 'Tech Wholesalers', contact: 'Jane Doe', email: 'orders@techwhole.com', phone: '+1 (555) 333-4444', balance: 0 }
    ]);

    const addVendor = (vendor) => {
        setVendors(prev => [...prev, { ...vendor, id: `VEN-${Date.now()}` }]);
    };

    const updateVendor = (id, updatedData) => {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updatedData } : v));
    };

    // ── Company Settings ──
    const [companyProfile, setCompanyProfile] = useState({
        name: 'Acme Corp',
        country: 'JO', // Default to Jordan
        currency: 'JOD',
        taxId: ''
    });

    const updateCompanyProfile = (data) => {
        setCompanyProfile(prev => ({ ...prev, ...data }));
    };

    // ── Tax Management Logic ──
    const [taxJurisdictions, setTaxJurisdictions] = useState([
        { id: 'JO', name: 'Jordan', currency: 'JOD', taxType: 'VAT', baseRate: 16, allowPartial: false },
        { id: 'SA', name: 'Saudi Arabia', currency: 'SAR', taxType: 'VAT', baseRate: 15, allowPartial: false },
        { id: 'DE', name: 'Germany', currency: 'EUR', taxType: 'VAT', baseRate: 19, allowPartial: true },
        { id: 'US', name: 'United States', currency: 'USD', taxType: 'Sales Tax', baseRate: 0, allowPartial: false }, // Variable by state
    ]);

    const [taxRules, setTaxRules] = useState([
        { id: 'TR-JO-STD', jurisdictionId: 'JO', name: 'Standard VAT 16%', rate: 16, type: 'Standard', accountSales: '2200', accountPurchase: '1205' },
        { id: 'TR-JO-ZERO', jurisdictionId: 'JO', name: 'Zero Rated 0%', rate: 0, type: 'Zero', accountSales: '2200', accountPurchase: '1205' },
        { id: 'TR-SA-STD', jurisdictionId: 'SA', name: 'Standard VAT 15%', rate: 15, type: 'Standard', accountSales: '2200', accountPurchase: '1205' },
    ]);

    const calculateTax = (amount, taxRuleId, isInclusive = false) => {
        const rule = taxRules.find(r => r.id === taxRuleId);
        if (!rule) return { net: amount, tax: 0, total: amount, rate: 0 };

        const rate = rule.rate / 100;
        let tax = 0;
        let net = 0;

        if (isInclusive) {
            // Amount = Net + Tax
            // Tax = Amount - (Amount / (1 + Rate))
            net = amount / (1 + rate);
            tax = amount - net;
        } else {
            // Amount = Net
            net = amount;
            tax = amount * rate;
        }

        return {
            net: Number(net.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            total: Number((net + tax).toFixed(2)),
            rate: rule.rate
        };
    };

    const addTaxRule = (ruleData) => {
        const newRule = { ...ruleData, id: `TR-${Date.now()}` };
        setTaxRules(prev => [...prev, newRule]);
    };

    const updateTaxRule = (id, updatedData) => {
        setTaxRules(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    };

    // ── Drawer State ──
    const [drawerState, setDrawerState] = useState({
        isOpen: false,
        entityType: null, // 'Account', 'Journal', 'Customer', 'Asset', 'Bank', 'Cost Center'
        entityId: null
    });

    const openDrawer = (type, id) => {
        setDrawerState({ isOpen: true, entityType: type, entityId: id });
    };

    const closeDrawer = () => {
        setDrawerState(prev => ({ ...prev, isOpen: false }));
    };

    // Ensure initial GL accounts exist for these defaults if not already present
    // (In a real app, strict database seeding is better. Here we just ensure we don't break logic)

    // ... (budgetUsage logic remains here) ...

    // ── Bank Management Logic ──
    const addBankAccount = (data) => {
        // 1. Create GL Account
        // Determine parent: 1130 for Bank, 1110 for Cash
        const parentCode = data.type === 'Bank' ? '1130' : '1110';

        const newGLAccount = addAccount({
            name: data.name,
            type: 'Asset',
            parentCode: parentCode,
            description: `Linked to ${data.type} Account: ${data.accountNumber}`
        });

        // 2. Create Bank Account Record
        const newBank = {
            id: `BA-${Date.now()}`,
            ...data,
            glAccountId: newGLAccount.id // Link to GL
        };

        setBankAccounts(prev => [...prev, newBank]);

        // 3. Create Opening Balance Entry if Amount > 0
        if (Number(data.balance) > 0) {
            addEntry({
                date: new Date().toISOString().split('T')[0],
                reference: 'OP-BAL',
                description: `Opening Balance - ${data.name}`,
                lines: [
                    { id: 1, account: newGLAccount.id, description: 'Opening Balance', debit: data.balance, credit: 0, costCenter: '' },
                    { id: 2, account: '3000', description: 'Opening Balance Equity', debit: 0, credit: data.balance, costCenter: '' }
                ]
            });
        }
    };

    const updateBankAccount = (id, updatedData) => {
        setBankAccounts(prev => prev.map(acc => {
            if (acc.id === id) {
                // Determine if we need to update the linked GL Account
                const nameChanged = updatedData.name && updatedData.name !== acc.name;

                if (nameChanged && acc.glAccountId) {
                    updateAccount(acc.glAccountId, { name: updatedData.name });
                }

                return { ...acc, ...updatedData };
            }
            return acc;
        }));
    };

    const addAccount = (data) => {
        let newCode;
        const typePrefix = {
            'Asset': '1',
            'Liability': '2',
            'Equity': '3',
            'Revenue': '4',
            'Expense': '5'
        };

        const prefix = typePrefix[data.type] || '9';

        if (data.parentCode) {
            // Sub-account: Generate number close to parent
            const parentNum = parseInt(data.parentCode);
            // Find existing children
            const siblings = accounts.filter(a => a.parentCode === data.parentCode);

            if (siblings.length > 0) {
                const maxSibling = Math.max(...siblings.map(a => parseInt(a.code)));
                newCode = (maxSibling + 10).toString();
            } else {
                newCode = (parentNum + 10).toString();
            }
        } else {
            // Top Level: Find max global code for this type to ensure no collision
            const typeAccounts = accounts.filter(a => a.type === data.type);
            const maxCode = typeAccounts.reduce((max, acc) => {
                const codeNum = parseInt(acc.code);
                return codeNum > max ? codeNum : max;
            }, parseInt(prefix + '000'));

            // Increment by 100 for top-level separation
            newCode = (Math.floor(maxCode / 100) * 100 + 100).toString();
        }

        // Safety check loop to avoid collision
        let codeCheck = parseInt(newCode);
        while (accounts.some(a => a.code === codeCheck.toString())) {
            codeCheck += 10;
        }
        newCode = codeCheck.toString();

        const newAccount = {
            id: newCode,
            code: newCode,
            name: data.name,
            type: data.type,
            parentCode: data.parentCode || null,
            description: data.description || '',
            icon: data.icon || null,
            depreciationRate: data.depreciationRate || 0, // New field
            isSystem: false, // User created
            isDefault: false,
            isGroup: false
        };

        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
    };

    const updateAccount = (id, updatedData) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === id) {
                // Protect System Accounts: Cannot change Name or Type (usually)
                // But user requirement says: "Don't allow user to change System Accounts names like Cash..."
                if (acc.isSystem) {
                    // Only allow updating description or minor fields if desired, 
                    // or strictly prevent specific changes.
                    // For now, we'll allow updating description but NOT name or code/type.
                    return { ...acc, description: updatedData.description };
                }
                return { ...acc, ...updatedData };
            }
            return acc;
        }));
    };

    const deleteAccount = (id) => {
        const account = accounts.find(a => a.id === id);
        if (account?.isSystem) {
            alert("Cannot delete System Accounts.");
            return;
        }
        // Also check if used in entries (simple check)
        const isUsed = entries.some(e => e.lines.some(l => l.account === id));
        if (isUsed) {
            alert("Cannot delete account with existing transactions.");
            return;
        }
        setAccounts(prev => prev.filter(a => a.id !== id));
    };

    // Calculate actual spending per cost center
    // Logic: Sum of DEBITS to lines with that cost center
    // (In a real system, we'd filter for Expense/Asset accounts, but for now sum all debits tagged)
    const budgetUsage = useMemo(() => {
        const usage = {};
        costCenters.forEach(cc => usage[cc.id] = 0);

        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.costCenter && usage[line.costCenter] !== undefined) {
                    usage[line.costCenter] += Number(line.debit);
                }
            });
        });
        return usage;
    }, [entries, costCenters]);

    const addCostCenter = (center) => {
        setCostCenters(prev => [...prev, { ...center, id: `CC-${Date.now()}` }]);
    };

    const updateCostCenter = (id, updated) => {
        setCostCenters(prev => prev.map(cc => cc.id === id ? { ...cc, ...updated } : cc));
    };

    const deleteCostCenter = (id) => {
        setCostCenters(prev => prev.filter(cc => cc.id !== id));
    };

    // ── Auto-Generate ID Logic ──
    const generateEntryId = () => {
        const year = new Date().getFullYear();
        const prefix = `JE-${year}-`;

        // Find max number for this year
        const currentYearEntries = entries.filter(e => e.id.startsWith(prefix));
        let maxNum = 0;
        currentYearEntries.forEach(e => {
            const numPart = parseInt(e.id.split('-')[2]);
            if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        });

        const nextNum = (maxNum + 1).toString().padStart(3, '0');
        return `${prefix}${nextNum}`;
    };

    const addEntry = (entry) => {
        const periodStatus = getPeriodStatus(entry.date || new Date().toISOString().split('T')[0]);

        if (periodStatus === 'Hard Lock') {
            alert("This accounting period is Hard Locked. No new entries allowed.");
            return null;
        }
        if (periodStatus === 'Soft Lock') {
            const confirm = window.confirm("This period is Soft Locked. Are you sure you want to post?");
            if (!confirm) return null;
        }

        const newEntry = {
            id: generateEntryId(),
            date: entry.date || new Date().toISOString().split('T')[0],
            reference: entry.reference || '',
            description: entry.description || '',
            currency: entry.currency || 'JOD',
            exchangeRate: entry.exchangeRate || 1,
            amount: entry.amount || 0,
            status: entry.status || 'Draft',
            createdBy: entry.createdBy || 'System Admin',
            isAutomatic: entry.isAutomatic || false, // New Flag
            sourceType: entry.sourceType || 'Manual', // New Flag
            attachedFile: entry.attachedFile || null,
            lines: entry.lines.map(l => ({
                ...l,
                debit: Number(l.debit),
                credit: Number(l.credit)
            }))
        };
        setEntries(prev => [newEntry, ...prev]);
        return newEntry;
    };

    const updateEntry = (id, updatedEntry) => {
        const originalEntry = entries.find(e => e.id === id);
        if (!originalEntry) return;

        // Protection Rules
        const periodStatus = getPeriodStatus(originalEntry.date);

        if (periodStatus === 'Hard Lock') {
            alert("Cannot edit entries in a Hard Locked period.");
            return;
        }

        // Block manual edit of Auto entries (unless explicitly overriden by system process)
        // We detect "System Process" implies updatedEntry has isAutomatic=true or is passed via internal function,
        // but UI calls will trigger this. 
        // Simple logic: If original is auto, and we are not specifically allowing it (e.g. valid adjustment), block.
        // For now, we block ALL manual edits to Auto entries via this context method if it comes from UI.
        // *However*, our Fixed Asset editor calls this. So we need a way to distinguish.
        // The Fixed Asset editor is a valid "System Source".
        // Let's rely on UI to hide "Edit" button for Auto entries, but here simply enforce Period Lock.
        // If we want strict backend-like protection:
        // if (originalEntry.isAutomatic && !updatedEntry.isSystemOverride) { ... }

        setEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                return {
                    ...entry,
                    ...updatedEntry,
                    id: id,
                    lines: updatedEntry.lines.map(l => ({
                        ...l,
                        debit: Number(l.debit),
                        credit: Number(l.credit)
                    }))
                };
            }
            return entry;
        }));
    };
    // Recursive helper to get all child account IDs for a parent
    const getAllChildAccountIds = (parentId) => {
        const parentAccount = accounts.find(a => a.id === parentId);
        if (!parentAccount) return [];

        const children = accounts.filter(a => a.parentCode === parentAccount.code);
        let ids = children.map(c => c.id);

        children.forEach(child => {
            if (child.isGroup) {
                ids = [...ids, ...getAllChildAccountIds(child.id)];
            }
        });

        return ids;
    };

    // ── Invoices Logic ──
    const [invoices, setInvoices] = useState([
        {
            id: 'INV-2025-001',
            customerId: 'CUST-001',
            date: '2025-02-01',
            dueDate: '2025-02-15',
            items: [{ description: 'Software Development', quantity: 1, price: 1200, total: 1200 }],
            subtotal: 1200,
            tax: 0,
            total: 1200,
            status: 'Paid',
            payments: [
                { id: 'PAY-01', date: '2025-02-10', amount: 1200, method: 'Bank Transfer', accountId: '1131', reference: 'TRX-998877' }
            ]
        },
        {
            id: 'INV-2025-002',
            customerId: 'CUST-002',
            date: '2025-02-05',
            dueDate: '2025-02-20',
            items: [{ description: 'Consulting Services', quantity: 10, price: 350, total: 3500 }],
            subtotal: 3500,
            tax: 0,
            total: 3500,
            status: 'Partial',
            payments: [
                { id: 'PAY-02', date: '2025-02-12', amount: 1000, method: 'Cash', accountId: '1111', reference: 'RCPT-5544' }
            ]
        },
        {
            id: 'INV-2025-003',
            customerId: 'CUST-001',
            date: '2025-02-14',
            dueDate: '2025-02-28',
            items: [{ description: 'Hosting Fees', quantity: 1, price: 500, total: 500 }],
            subtotal: 500,
            tax: 0,
            total: 500,
            status: 'Posted',
            payments: []
        }
    ]);

    const recordInvoicePayment = (invoiceId, paymentData) => {
        // ... (existing invoice logic)
    };
    // ── Products & Services ──
    const [productsAndServices, setProductsAndServices] = useState([
        { id: 'PS-001', name: 'Web Development', type: 'Service', price: 500, unit: 'Hour', taxRuleId: '', description: 'Full-stack web development services', revenueAccount: '4110' },
        { id: 'PS-002', name: 'UI/UX Design', type: 'Service', price: 350, unit: 'Hour', taxRuleId: '', description: 'User interface and experience design', revenueAccount: '4110' },
        { id: 'PS-003', name: 'Cloud Hosting', type: 'Service', price: 99, unit: 'Month', taxRuleId: '', description: 'Monthly cloud server hosting', revenueAccount: '4120' },
        { id: 'PS-004', name: 'Software License', type: 'Product', price: 1200, unit: 'Unit', taxRuleId: '', description: 'Annual software license', revenueAccount: '4110' },
        { id: 'PS-005', name: 'Technical Consultation', type: 'Service', price: 200, unit: 'Hour', taxRuleId: '', description: 'Expert technical consulting', revenueAccount: '4120' },
    ]);

    const addProductOrService = (item) => {
        const newItem = { ...item, id: `PS-${Date.now()}` };
        setProductsAndServices(prev => [...prev, newItem]);
        return newItem;
    };

    const updateProductOrService = (id, updates) => {
        setProductsAndServices(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProductOrService = (id) => {
        setProductsAndServices(prev => prev.filter(p => p.id !== id));
    };

    const [vendorPayments, setVendorPayments] = useState([]);

    const recordBillPayment = (billId, paymentData) => {
        // paymentData: { date, amount, method, accountId, vendorId, reference, notes }

        const newPayment = {
            id: `VPAY-${Date.now()}`,
            billId,
            ...paymentData,
            status: 'Pending Approval',
            createdAt: new Date().toISOString()
        };

        setVendorPayments(prev => [newPayment, ...prev]);
        return newPayment;
    };

    const approveVendorPayment = (paymentId, approvedBy = 'Finance Manager') => {
        const payment = vendorPayments.find(p => p.id === paymentId);
        if (!payment) return;

        // 1. Update Vendor Balance
        setVendors(prev => prev.map(v => v.id === payment.vendorId ? { ...v, balance: (v.balance || 0) - Number(payment.amount) } : v));

        // 2. Create Journal Entry (Debit AP, Credit Bank/Cash)
        const depositAccount = accounts.find(a => a.id === payment.accountId);

        addEntry({
            date: payment.date,
            reference: payment.reference || `PAY-BILL-${payment.billId}`,
            description: `Vendor Payment Approved (Ref: ${payment.id}) - ${payment.notes || ''}`,
            status: 'Posted',
            isAutomatic: true,
            sourceType: 'Procurement',
            lines: [
                { id: 1, account: '2110', description: `Accounts Payable - Bill #${payment.billId}`, debit: Number(payment.amount), credit: 0, costCenter: '' },
                { id: 2, account: payment.accountId, description: `Payment via ${depositAccount?.name || 'Bank/Cash'}`, debit: 0, credit: Number(payment.amount), costCenter: '' }
            ]
        });

        // 3. Update Payment Status
        setVendorPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'Approved', approvedBy, approvedAt: new Date().toISOString() } : p));
    };

    const rejectVendorPayment = (paymentId, reason) => {
        setVendorPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'Rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() } : p));
    };

    return (
        <AccountingContext.Provider value={{
            costCenters,
            entries,
            budgetUsage,
            addCostCenter,
            updateCostCenter,
            deleteCostCenter,
            addEntry,
            updateEntry, // Exposed
            accounts,
            addAccount,
            updateAccount,
            deleteAccount,
            bankAccounts,
            addBankAccount,
            updateBankAccount, // New
            accountingPeriods, // New
            getPeriodStatus,   // New
            togglePeriodStatus,// New
            customers,
            setCustomers,
            updateCustomer, // New
            vendors, // New
            addVendor, // New
            updateVendor, // New
            companyProfile, // New
            updateCompanyProfile, // New
            invoices, // New
            setInvoices, // New
            recordInvoicePayment, // New
            recordBillPayment, // New
            vendorPayments,
            approveVendorPayment,
            rejectVendorPayment,
            taxJurisdictions, // New
            taxRules, // New 
            calculateTax, // New
            addTaxRule, // New
            updateTaxRule, // New
            productsAndServices,
            addProductOrService,
            updateProductOrService,
            deleteProductOrService,
            drawerState,
            openDrawer,
            closeDrawer,
            getAccountBalance: (accountId) => {
                const account = accounts.find(a => a.id === accountId);
                if (!account) return 0;

                let balance = 0;
                // Add initial balances from bankAccount definitions if applicable
                // (In a real system, initial balances would be in an Opening Entry, which we support, so we rely on entries)

                entries.forEach(entry => {
                    if (entry.status !== 'Posted') return;

                    entry.lines.forEach(line => {
                        if (line.account === accountId) {
                            if (account.type === 'Asset' || account.type === 'Expense' || account.type === 'COGS') {
                                balance += Number(line.debit) - Number(line.credit);
                            } else {
                                balance += Number(line.credit) - Number(line.debit);
                            }
                        }
                    });
                });
                return balance;
            },
            getAllChildAccountIds // Export helper
        }}>
            {children}
        </AccountingContext.Provider>
    );
};

export const useAccounting = () => useContext(AccountingContext);
