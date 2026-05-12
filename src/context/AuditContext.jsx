import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const AuditContext = createContext();

export const useAudit = () => {
    const context = useContext(AuditContext);
    if (!context) throw new Error('useAudit must be used within AuditProvider');
    return context;
};

// Default Audit Firms (used by admin-side components)
const DEFAULT_FIRMS = [
    {
        id: 'AUDIT-001',
        name: 'Deloitte Jordan',
        licenseNumber: 'AUD-2024-001',
        email: 'audit@deloitte.jo',
        phone: '+962-6-5600-001',
        address: 'Amman, Jordan',
        contactPerson: 'Ahmad Al-Masri',
        specialization: 'Big Four - Full Service',
        rating: 5,
        logo: null,
        createdAt: '2025-01-01'
    },
    {
        id: 'AUDIT-002',
        name: 'PwC Arabia',
        licenseNumber: 'AUD-2024-002',
        email: 'audit@pwc-arabia.com',
        phone: '+962-6-5600-002',
        address: 'Amman, Jordan',
        contactPerson: 'Sara Khalil',
        specialization: 'Tax & Assurance',
        rating: 5,
        logo: null,
        createdAt: '2025-02-01'
    },
    {
        id: 'AUDIT-003',
        name: 'Al-Rasheed Audit Office',
        licenseNumber: 'AUD-2024-003',
        email: 'info@alrasheed-audit.com',
        phone: '+962-6-5500-100',
        address: 'Amman, Jordan',
        contactPerson: 'Mohammed Al-Rasheed',
        specialization: 'SME Auditing',
        rating: 4,
        logo: null,
        createdAt: '2025-03-01'
    }
];

// Client Companies that use audit services
const DEFAULT_CLIENT_COMPANIES = [
    {
        id: 'COMP-001',
        name: 'TechFlow Solutions',
        industry: 'Technology',
        registrationNumber: 'JO-2020-45821',
        taxId: 'TAX-001-2020',
        address: 'King Abdullah II St, Building 14, Floor 3, Amman 11953',
        phone: '+962-6-555-1001',
        fax: '+962-6-555-1002',
        email: 'finance@techflow.jo',
        website: 'www.techflow.jo',
        contactPerson: 'Khaled Nasser',
        contactRole: 'CFO',
        ceo: 'Dr. Faisal Al-Zoubi',
        logo: '💻',
        status: 'active',
        foundedYear: 2020,
        employees: 85,
        capital: 500000,
        currency: 'JOD',
        annualRevenue: 1250000,
        legalForm: 'Limited Liability Company (LLC)',
        taxInfo: {
            taxNumber: 'TAX-001-2020',
            salesTaxNumber: 'ST-45821-2020',
            incomeTaxId: 'IT-2020-001',
            taxOffice: 'Amman Income & Sales Tax Dept.',
            vatRegistered: true,
            vatRate: 16,
            lastTaxFiling: '2024-12-31',
            taxStatus: 'Compliant'
        },
        bankAccounts: [
            { bankName: 'Arab Bank', accountNumber: 'JO94ARAB0000001234567890', iban: 'JO94ARAB0000001234567890', currency: 'JOD', type: 'Current Account', balance: 285000 },
            { bankName: 'Jordan Islamic Bank', accountNumber: 'JO52JKBI0000009876543210', iban: 'JO52JKBI0000009876543210', currency: 'JOD', type: 'Savings Account', balance: 120000 },
            { bankName: 'Arab Bank', accountNumber: 'JO12ARAB0000005555666677', iban: 'JO12ARAB0000005555666677', currency: 'USD', type: 'Foreign Currency', balance: 45000 }
        ],
        attachments: [
            { id: 'ATT-001', name: 'Commercial Registration Certificate', type: 'PDF', size: '1.2 MB', date: '2020-03-15', category: 'Legal' },
            { id: 'ATT-002', name: 'Tax Registration Certificate', type: 'PDF', size: '0.8 MB', date: '2020-04-01', category: 'Tax' },
            { id: 'ATT-003', name: 'Articles of Association', type: 'PDF', size: '2.4 MB', date: '2020-03-10', category: 'Legal' },
            { id: 'ATT-004', name: 'Financial Report Q4 2024', type: 'PDF', size: '5.6 MB', date: '2025-01-15', category: 'Financial' },
            { id: 'ATT-005', name: 'Board Minutes - Jan 2025', type: 'DOCX', size: '0.5 MB', date: '2025-01-30', category: 'Corporate' },
            { id: 'ATT-006', name: 'VAT Return - Dec 2024', type: 'PDF', size: '1.1 MB', date: '2025-01-10', category: 'Tax' },
            { id: 'ATT-007', name: 'Bank Reconciliation Statement', type: 'XLSX', size: '0.9 MB', date: '2025-02-01', category: 'Financial' }
        ],
        shareholders: [
            { name: 'Dr. Faisal Al-Zoubi', share: 40, role: 'CEO & Founder' },
            { name: 'Nadia Qasem', share: 30, role: 'CTO' },
            { name: 'Innovation Fund Jordan', share: 30, role: 'Investor' }
        ]
    },
    {
        id: 'COMP-002',
        name: 'Al-Baraka Trading Co.',
        industry: 'Retail & Trading',
        registrationNumber: 'JO-2018-33012',
        taxId: 'TAX-002-2018',
        address: 'Zahran St, Commercial Complex B, Amman 11183',
        phone: '+962-6-555-2002',
        fax: '+962-6-555-2003',
        email: 'accounts@albaraka.jo',
        website: 'www.albaraka-trading.jo',
        contactPerson: 'Layla Ibrahim',
        contactRole: 'Finance Manager',
        ceo: 'Hassan Al-Baraka',
        logo: '🏪',
        status: 'active',
        foundedYear: 2018,
        employees: 42,
        capital: 250000,
        currency: 'JOD',
        annualRevenue: 890000,
        legalForm: 'General Partnership',
        taxInfo: {
            taxNumber: 'TAX-002-2018',
            salesTaxNumber: 'ST-33012-2018',
            incomeTaxId: 'IT-2018-002',
            taxOffice: 'Amman Income & Sales Tax Dept.',
            vatRegistered: true,
            vatRate: 16,
            lastTaxFiling: '2024-12-31',
            taxStatus: 'Compliant'
        },
        bankAccounts: [
            { bankName: 'Housing Bank', accountNumber: 'JO88HBHO0000002222333344', iban: 'JO88HBHO0000002222333344', currency: 'JOD', type: 'Current Account', balance: 175000 },
            { bankName: 'Cairo Amman Bank', accountNumber: 'JO33CAAB0000004444555566', iban: 'JO33CAAB0000004444555566', currency: 'JOD', type: 'Current Account', balance: 68000 }
        ],
        attachments: [
            { id: 'ATT-101', name: 'Commercial Registration', type: 'PDF', size: '1.0 MB', date: '2018-06-20', category: 'Legal' },
            { id: 'ATT-102', name: 'Tax Certificate', type: 'PDF', size: '0.7 MB', date: '2018-07-01', category: 'Tax' },
            { id: 'ATT-103', name: 'Partnership Agreement', type: 'PDF', size: '3.1 MB', date: '2018-06-15', category: 'Legal' },
            { id: 'ATT-104', name: 'Annual Report 2024', type: 'PDF', size: '4.2 MB', date: '2025-02-01', category: 'Financial' }
        ],
        shareholders: [
            { name: 'Hassan Al-Baraka', share: 60, role: 'Managing Partner' },
            { name: 'Rami Al-Baraka', share: 40, role: 'Partner' }
        ]
    },
    {
        id: 'COMP-003',
        name: 'Skyline Construction',
        industry: 'Construction',
        registrationNumber: 'JO-2019-28764',
        taxId: 'TAX-003-2019',
        address: 'Mecca St, Tower 7, Floor 10, Amman 11821',
        phone: '+962-6-555-3003',
        fax: '+962-6-555-3004',
        email: 'cfo@skyline.jo',
        website: 'www.skyline-construction.jo',
        contactPerson: 'Ahmad Khatib',
        contactRole: 'CFO',
        ceo: 'Eng. Omar Mansour',
        logo: '🏗️',
        status: 'active',
        foundedYear: 2019,
        employees: 210,
        capital: 1500000,
        currency: 'JOD',
        annualRevenue: 4200000,
        legalForm: 'Public Shareholding Company',
        taxInfo: {
            taxNumber: 'TAX-003-2019',
            salesTaxNumber: 'ST-28764-2019',
            incomeTaxId: 'IT-2019-003',
            taxOffice: 'Amman Income & Sales Tax Dept.',
            vatRegistered: true,
            vatRate: 16,
            lastTaxFiling: '2024-12-31',
            taxStatus: 'Under Review'
        },
        bankAccounts: [
            { bankName: 'Arab Bank', accountNumber: 'JO77ARAB0000007777888899', iban: 'JO77ARAB0000007777888899', currency: 'JOD', type: 'Current Account', balance: 890000 },
            { bankName: 'Bank of Jordan', accountNumber: 'JO55BJOR0000001111222233', iban: 'JO55BJOR0000001111222233', currency: 'JOD', type: 'Project Escrow', balance: 350000 },
            { bankName: 'Arab Bank', accountNumber: 'JO44ARAB0000006666777788', iban: 'JO44ARAB0000006666777788', currency: 'USD', type: 'Foreign Currency', balance: 125000 }
        ],
        attachments: [
            { id: 'ATT-201', name: 'Commercial Registration', type: 'PDF', size: '1.3 MB', date: '2019-02-10', category: 'Legal' },
            { id: 'ATT-202', name: 'Tax Registration Certificate', type: 'PDF', size: '0.9 MB', date: '2019-03-01', category: 'Tax' },
            { id: 'ATT-203', name: 'Memorandum of Association', type: 'PDF', size: '4.5 MB', date: '2019-01-25', category: 'Legal' },
            { id: 'ATT-204', name: 'Annual Audit Report 2024', type: 'PDF', size: '8.2 MB', date: '2025-01-20', category: 'Financial' },
            { id: 'ATT-205', name: 'Engineering License', type: 'PDF', size: '1.5 MB', date: '2019-04-15', category: 'Legal' },
            { id: 'ATT-206', name: 'Project Portfolio 2025', type: 'PDF', size: '12.3 MB', date: '2025-02-10', category: 'Corporate' }
        ],
        shareholders: [
            { name: 'Eng. Omar Mansour', share: 35, role: 'Chairman & CEO' },
            { name: 'Al-Noor Investment Group', share: 25, role: 'Strategic Investor' },
            { name: 'Jordanian Construction Fund', share: 20, role: 'Institutional Investor' },
            { name: 'Public Float', share: 20, role: 'Public Shares' }
        ]
    }
];

// Audit periods with statuses
const AUDIT_STATUSES = {
    OPEN: 'open',
    SUBMITTED: 'submitted',
    IN_REVIEW: 'in_review',
    REVISION: 'revision',
    APPROVED: 'approved',
    SEALED: 'sealed'
};

const DEFAULT_PERIODS = [
    {
        id: 'PRD-001',
        companyId: 'COMP-001',
        month: 1, year: 2025,
        label: 'January 2025',
        status: AUDIT_STATUSES.SEALED,
        auditorId: 'AUDIT-001',
        submittedAt: '2025-02-05',
        reviewedAt: '2025-02-15',
        sealedAt: '2025-02-20',
        sealNumber: 'SEAL-2025-001',
        auditorNotes: 'All accounts are in order. No material misstatements found.',
        version: 1,
        versions: [
            { version: 1, sealedAt: '2025-02-20', sealNumber: 'SEAL-2025-001', notes: 'Initial approval' }
        ]
    },
    {
        id: 'PRD-002',
        companyId: 'COMP-001',
        month: 2, year: 2025,
        label: 'February 2025',
        status: AUDIT_STATUSES.APPROVED,
        auditorId: 'AUDIT-001',
        submittedAt: '2025-03-03',
        reviewedAt: '2025-03-10',
        sealedAt: '2025-03-12',
        sealNumber: 'SEAL-2025-002',
        auditorNotes: 'Approved with minor recommendations for next period.',
        version: 1,
        versions: [
            { version: 1, sealedAt: '2025-03-12', sealNumber: 'SEAL-2025-002', notes: 'Initial approval' }
        ]
    },
    {
        id: 'PRD-003',
        companyId: 'COMP-001',
        month: 3, year: 2025,
        label: 'March 2025',
        status: AUDIT_STATUSES.OPEN,
        auditorId: null,
        submittedAt: null, reviewedAt: null, sealedAt: null, sealNumber: null,
        auditorNotes: '', version: 0, versions: []
    },
    {
        id: 'PRD-004',
        companyId: 'COMP-002',
        month: 1, year: 2025,
        label: 'January 2025',
        status: AUDIT_STATUSES.SUBMITTED,
        auditorId: 'AUDIT-001',
        submittedAt: '2025-02-08',
        reviewedAt: null, sealedAt: null, sealNumber: null,
        auditorNotes: '', version: 0, versions: []
    },
    {
        id: 'PRD-005',
        companyId: 'COMP-003',
        month: 1, year: 2025,
        label: 'January 2025',
        status: AUDIT_STATUSES.IN_REVIEW,
        auditorId: 'AUDIT-001',
        submittedAt: '2025-02-10',
        reviewedAt: '2025-02-12',
        sealedAt: null, sealNumber: null,
        auditorNotes: '', version: 0, versions: []
    }
];

export const AuditProvider = ({ children }) => {
    const { user } = useAuth();
    const [auditFirms, setAuditFirms] = useState(DEFAULT_FIRMS);
    const [auditPeriods, setAuditPeriods] = useState(DEFAULT_PERIODS);
    const [clientCompanies] = useState(DEFAULT_CLIENT_COMPANIES);

    const currentAuditor = useMemo(() => {
        if (user?.role !== 'auditor') return null;
        return {
            id: user.auditor_firm?.id || user.id,
            name: user.auditor_firm?.name || user.full_name || user.name || 'Auditor',
            email: user.email,
            fullName: user.full_name || user.name || 'Auditor',
        };
    }, [user]);

    // ---- FIRM CRUD (admin-side) ----
    const updateFirm = (firmId, updates) => {
        setAuditFirms(prev => prev.map(f => f.id === firmId ? { ...f, ...updates } : f));
    };

    const deleteFirm = (firmId) => {
        setAuditFirms(prev => prev.filter(f => f.id !== firmId));
    };

    // ---- PERIOD MANAGEMENT ----
    const submitForAudit = (periodId, auditorId) => {
        setAuditPeriods(prev => prev.map(p =>
            p.id === periodId ? {
                ...p,
                status: AUDIT_STATUSES.SUBMITTED,
                auditorId,
                submittedAt: new Date().toISOString().split('T')[0]
            } : p
        ));
    };

    const startReview = (periodId) => {
        setAuditPeriods(prev => prev.map(p =>
            p.id === periodId ? { ...p, status: AUDIT_STATUSES.IN_REVIEW, reviewedAt: new Date().toISOString().split('T')[0] } : p
        ));
    };

    const requestRevision = (periodId, notes) => {
        setAuditPeriods(prev => prev.map(p =>
            p.id === periodId ? { ...p, status: AUDIT_STATUSES.REVISION, auditorNotes: notes } : p
        ));
    };

    const approvePeriod = (periodId, notes) => {
        const sealNumber = `SEAL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        setAuditPeriods(prev => prev.map(p => {
            if (p.id !== periodId) return p;
            const newVersion = p.version + 1;
            return {
                ...p,
                status: AUDIT_STATUSES.APPROVED,
                auditorNotes: notes || p.auditorNotes,
                sealedAt: new Date().toISOString().split('T')[0],
                sealNumber,
                version: newVersion,
                versions: [...p.versions, { version: newVersion, sealedAt: new Date().toISOString().split('T')[0], sealNumber, notes: notes || 'Approved' }]
            };
        }));
    };

    const sealPeriod = (periodId) => {
        setAuditPeriods(prev => prev.map(p =>
            p.id === periodId ? { ...p, status: AUDIT_STATUSES.SEALED } : p
        ));
    };

    // Auditor creates a new version (revision after seal)
    const createNewVersion = (periodId, notes) => {
        const sealNumber = `SEAL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        setAuditPeriods(prev => prev.map(p => {
            if (p.id !== periodId) return p;
            const newVersion = p.version + 1;
            return {
                ...p,
                status: AUDIT_STATUSES.APPROVED,
                auditorNotes: notes,
                sealedAt: new Date().toISOString().split('T')[0],
                sealNumber,
                version: newVersion,
                versions: [...p.versions, { version: newVersion, sealedAt: new Date().toISOString().split('T')[0], sealNumber, notes }]
            };
        }));
    };

    // ---- PERMISSION CHECKS ----
    const isPeriodLocked = (periodId) => {
        const period = auditPeriods.find(p => p.id === periodId);
        if (!period) return false;
        return [AUDIT_STATUSES.SUBMITTED, AUDIT_STATUSES.IN_REVIEW, AUDIT_STATUSES.APPROVED, AUDIT_STATUSES.SEALED].includes(period.status);
    };

    const isMonthLocked = (month, year) => {
        const period = auditPeriods.find(p => p.month === month && p.year === year);
        if (!period) return false;
        return isPeriodLocked(period.id);
    };

    const canAdminEdit = (periodId) => {
        const period = auditPeriods.find(p => p.id === periodId);
        if (!period) return true;
        return [AUDIT_STATUSES.OPEN, AUDIT_STATUSES.REVISION].includes(period.status);
    };

    const canAuditorEdit = (periodId) => {
        const period = auditPeriods.find(p => p.id === periodId);
        if (!period) return false;
        return [AUDIT_STATUSES.SUBMITTED, AUDIT_STATUSES.IN_REVIEW, AUDIT_STATUSES.APPROVED, AUDIT_STATUSES.SEALED].includes(period.status);
    };

    const getAuditorPeriods = (auditorId) => {
        return auditPeriods.filter(p => p.auditorId === auditorId);
    };

    const getAuditorCompanies = (auditorId) => {
        const periodCompanyIds = [...new Set(auditPeriods.filter(p => p.auditorId === auditorId).map(p => p.companyId))];
        return clientCompanies.filter(c => periodCompanyIds.includes(c.id));
    };

    // ---- AUDITOR ADJUSTMENTS ----
    const [adjustments, setAdjustments] = useState([
        {
            id: 'ADJ-001',
            periodId: 'PRD-001',
            companyId: 'COMP-001',
            auditorId: 'AUDIT-001',
            auditorName: 'Deloitte Jordan',
            type: 'journal_entry',
            title: 'Revenue Recognition Adjustment',
            description: 'Deferred revenue should be recognized in January per IFRS 15.',
            status: 'approved', // pending | approved | rejected
            createdAt: '2025-02-18',
            reviewedAt: '2025-02-19',
            adminNotes: 'Agreed - applied to books.',
            changes: {
                entryId: 'JE-ADJ-001',
                lines: [
                    { account: '2150', accountName: 'Deferred Revenue', debit: 3200, credit: 0 },
                    { account: '4110', accountName: 'Sales Revenue', debit: 0, credit: 3200 }
                ]
            }
        },
        {
            id: 'ADJ-002',
            periodId: 'PRD-002',
            companyId: 'COMP-001',
            auditorId: 'AUDIT-001',
            auditorName: 'Deloitte Jordan',
            type: 'journal_entry',
            title: 'Depreciation Correction',
            description: 'Depreciation for IT equipment was understated by 800 JOD.',
            status: 'pending',
            createdAt: '2025-03-11',
            reviewedAt: null,
            adminNotes: '',
            changes: {
                entryId: 'JE-ADJ-002',
                lines: [
                    { account: '6150', accountName: 'Depreciation Expense', debit: 800, credit: 0 },
                    { account: '1250', accountName: 'Accumulated Depreciation', debit: 0, credit: 800 }
                ]
            }
        },
        {
            id: 'ADJ-003',
            periodId: 'PRD-002',
            companyId: 'COMP-001',
            auditorId: 'AUDIT-001',
            auditorName: 'Deloitte Jordan',
            type: 'account_reclassify',
            title: 'Reclassify Prepaid to Expense',
            description: 'Insurance prepaid for Q1 should be expensed as the period has passed.',
            status: 'rejected',
            createdAt: '2025-03-11',
            reviewedAt: '2025-03-12',
            adminNotes: 'Insurance covers Q1-Q2, only 50% should be expensed.',
            changes: {
                entryId: 'JE-ADJ-003',
                lines: [
                    { account: '6300', accountName: 'Insurance Expense', debit: 2400, credit: 0 },
                    { account: '1180', accountName: 'Prepaid Expenses', debit: 0, credit: 2400 }
                ]
            }
        }
    ]);

    const proposeAdjustment = (adjustment) => {
        const newAdj = {
            ...adjustment,
            id: `ADJ-${Date.now()}`,
            auditorId: currentAuditor?.id,
            auditorName: currentAuditor?.name || 'Unknown',
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
            reviewedAt: null,
            adminNotes: ''
        };
        setAdjustments(prev => [newAdj, ...prev]);
        return newAdj;
    };

    const approveAdjustment = (adjId, adminNotes) => {
        setAdjustments(prev => prev.map(a =>
            a.id === adjId ? { ...a, status: 'approved', reviewedAt: new Date().toISOString().split('T')[0], adminNotes: adminNotes || 'Approved' } : a
        ));
    };

    const rejectAdjustment = (adjId, adminNotes) => {
        setAdjustments(prev => prev.map(a =>
            a.id === adjId ? { ...a, status: 'rejected', reviewedAt: new Date().toISOString().split('T')[0], adminNotes: adminNotes || 'Rejected' } : a
        ));
    };

    const getAdjustmentsForPeriod = (periodId) => adjustments.filter(a => a.periodId === periodId);
    const getAdjustmentsForCompany = (companyId) => adjustments.filter(a => a.companyId === companyId);
    const getPendingAdjustments = () => adjustments.filter(a => a.status === 'pending');

    // ---- AUDIT CHANGE TRACKING ----
    const [auditChanges, setAuditChanges] = useState([
        {
            id: 'CHG-001', entityType: 'account', entityId: '4110', field: 'name',
            oldValue: 'Sales Revenue', newValue: 'Product Sales Revenue',
            auditorId: 'AUDIT-001', auditorName: 'Deloitte Jordan',
            periodId: 'PRD-001', companyId: 'COMP-001',
            createdAt: '2025-02-18', status: 'approved', reviewedAt: '2025-02-19', adminNotes: 'Name updated.'
        },
        {
            id: 'CHG-002', entityType: 'journal_line', entityId: 'JE-2025-002', field: 'debit (line 1)',
            oldValue: '12000', newValue: '13500',
            auditorId: 'AUDIT-001', auditorName: 'Deloitte Jordan',
            periodId: 'PRD-002', companyId: 'COMP-001',
            createdAt: '2025-03-11', status: 'pending', reviewedAt: null, adminNotes: ''
        },
        {
            id: 'CHG-003', entityType: 'journal_entry', entityId: 'JE-2025-003', field: 'description',
            oldValue: 'Office Rent Payment', newValue: 'Office Rent Payment - Q1 2025',
            auditorId: 'AUDIT-001', auditorName: 'Deloitte Jordan',
            periodId: 'PRD-002', companyId: 'COMP-001',
            createdAt: '2025-03-11', status: 'rejected', reviewedAt: '2025-03-12', adminNotes: 'Original description is sufficient.'
        }
    ]);

    const logChange = (change) => {
        const newChange = {
            ...change,
            id: `CHG-${Date.now()}`,
            auditorId: currentAuditor?.id,
            auditorName: currentAuditor?.name || 'Unknown',
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
            reviewedAt: null,
            adminNotes: ''
        };
        setAuditChanges(prev => [newChange, ...prev]);
        return newChange;
    };

    const approveChange = (changeId, notes) => {
        setAuditChanges(prev => prev.map(c =>
            c.id === changeId ? { ...c, status: 'approved', reviewedAt: new Date().toISOString().split('T')[0], adminNotes: notes || 'Approved' } : c
        ));
    };

    const rejectChange = (changeId, notes) => {
        setAuditChanges(prev => prev.map(c =>
            c.id === changeId ? { ...c, status: 'rejected', reviewedAt: new Date().toISOString().split('T')[0], adminNotes: notes || 'Rejected' } : c
        ));
    };

    const getPendingChanges = () => auditChanges.filter(c => c.status === 'pending');
    const getChangesForPeriod = (periodId) => auditChanges.filter(c => c.periodId === periodId);

    return (
        <AuditContext.Provider value={{
            auditFirms,
            auditPeriods,
            currentAuditor,
            AUDIT_STATUSES,
            updateFirm,
            deleteFirm,
            submitForAudit,
            startReview,
            requestRevision,
            approvePeriod,
            sealPeriod,
            createNewVersion,
            isPeriodLocked,
            isMonthLocked,
            canAdminEdit,
            canAuditorEdit,
            getAuditorPeriods,
            getAuditorCompanies,
            clientCompanies,
            adjustments,
            proposeAdjustment,
            approveAdjustment,
            rejectAdjustment,
            getAdjustmentsForPeriod,
            getAdjustmentsForCompany,
            getPendingAdjustments,
            auditChanges,
            logChange,
            approveChange,
            rejectChange,
            getPendingChanges,
            getChangesForPeriod
        }}>
            {children}
        </AuditContext.Provider>
    );
};
