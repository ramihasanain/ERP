import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAudit } from '../../context/AuditContext';
import { useAccounting } from '../../context/AccountingContext';
import {
    Shield, LogOut, Clock, CheckCircle, AlertTriangle, FileText, Lock,
    Eye, ThumbsUp, ThumbsDown, Download, Stamp, Edit3, RotateCcw, Building2,
    List, BookOpen, DollarSign, BarChart3, Users, CreditCard, ArrowLeft,
    Briefcase, MapPin, Phone, Mail, Globe, Hash, FileCheck, Paperclip, PieChart,
    Plus, Trash2, Save
} from 'lucide-react';

const AuditorDashboard = () => {
    const navigate = useNavigate();
    const { currentAuditor, logoutAuditor, getAuditorPeriods, getAuditorCompanies, clientCompanies, startReview, requestRevision, approvePeriod, sealPeriod, createNewVersion, AUDIT_STATUSES, proposeAdjustment, getAdjustmentsForPeriod, logChange, getChangesForPeriod, auditChanges } = useAudit();
    const { accounts, entries, getAccountBalance, invoices, bankAccounts, customers, vendors, addEntry, updateEntry, addAccount, updateAccount, deleteAccount, setInvoices, setCustomers } = useAccounting();

    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [activeAccountingTab, setActiveAccountingTab] = useState('summary');
    const [selectedCompanyId, setSelectedCompanyId] = useState('all');
    const [selectedCompanyView, setSelectedCompanyView] = useState(null);
    const [companyProfileTab, setCompanyProfileTab] = useState('overview');
    const [showNewAdjForm, setShowNewAdjForm] = useState(false);
    const [newAdjTitle, setNewAdjTitle] = useState('');
    const [newAdjDescription, setNewAdjDescription] = useState('');
    const [newAdjLines, setNewAdjLines] = useState([{ account: '', accountName: '', debit: 0, credit: 0 }]);
    const [editModal, setEditModal] = useState(null); // { title, fields: [{key,label,type,value}], onSave }

    if (!currentAuditor) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card className="padding-lg" style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Shield size={48} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
                    <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Please login through the auditor portal.</p>
                    <Button onClick={() => navigate('/auditor/login')}>Go to Auditor Login</Button>
                </Card>
            </div>
        );
    }

    const allPeriods = getAuditorPeriods(currentAuditor.id);
    const auditorCompanies = getAuditorCompanies(currentAuditor.id);
    const periods = selectedCompanyId === 'all' ? allPeriods : allPeriods.filter(p => p.companyId === selectedCompanyId);
    const getCompanyName = (companyId) => clientCompanies.find(c => c.id === companyId)?.name || 'Unknown';
    const getCompany = (companyId) => clientCompanies.find(c => c.id === companyId);

    const statusConfig = {
        [AUDIT_STATUSES.SUBMITTED]: { label: 'Awaiting Review', color: 'var(--color-warning)', bg: 'var(--color-warning-dim)', icon: <Clock size={14} /> },
        [AUDIT_STATUSES.IN_REVIEW]: { label: 'In Review', color: 'var(--color-primary-600)', bg: 'var(--color-primary-50)', icon: <Eye size={14} /> },
        [AUDIT_STATUSES.REVISION]: { label: 'Revision Requested', color: 'var(--color-error)', bg: 'var(--color-error-dim)', icon: <RotateCcw size={14} /> },
        [AUDIT_STATUSES.APPROVED]: { label: 'Approved', color: 'var(--color-success)', bg: 'var(--color-success-dim)', icon: <CheckCircle size={14} /> },
        [AUDIT_STATUSES.SEALED]: { label: 'Sealed', color: '#7c3aed', bg: '#f5f3ff', icon: <Lock size={14} /> },
    };

    const handleLogout = () => { logoutAuditor(); navigate('/auditor/login'); };

    const handleStartReview = (period) => {
        startReview(period.id);
        setSelectedPeriod({ ...period, status: AUDIT_STATUSES.IN_REVIEW });
        setViewMode('review');
        setActiveAccountingTab('summary');
    };

    const handleApprove = () => {
        approvePeriod(selectedPeriod.id, reviewNotes || 'Approved by auditor.');
        setViewMode('list'); setSelectedPeriod(null); setReviewNotes('');
    };

    const handleReject = () => {
        if (!reviewNotes.trim()) return;
        requestRevision(selectedPeriod.id, reviewNotes);
        setViewMode('list'); setSelectedPeriod(null); setReviewNotes('');
    };

    const handleSeal = (periodId) => sealPeriod(periodId);

    const handleNewVersion = (period) => {
        setSelectedPeriod(period); setViewMode('review'); setReviewNotes(''); setActiveAccountingTab('summary');
    };

    const handleSaveNewVersion = () => {
        createNewVersion(selectedPeriod.id, reviewNotes || 'Revised version.');
        setViewMode('list'); setSelectedPeriod(null); setReviewNotes('');
    };

    const downloadSealedStatement = (period) => {
        const content = `
═══════════════════════════════════════════════════════
       ELECTRONICALLY SEALED FINANCIAL STATEMENT
═══════════════════════════════════════════════════════
Period:        ${period.label}
Seal Number:   ${period.sealNumber}
Version:       ${period.version}
Sealed Date:   ${period.sealedAt}
Status:        ${period.status === AUDIT_STATUSES.SEALED ? 'SEALED' : 'APPROVED'}
───────────────────────────────────────────────────────
AUDITING FIRM
───────────────────────────────────────────────────────
Firm:          ${currentAuditor.name}
License:       ${currentAuditor.licenseNumber}
Contact:       ${currentAuditor.contactPerson}
───────────────────────────────────────────────────────
AUDITOR'S OPINION
───────────────────────────────────────────────────────
${period.auditorNotes || 'No additional notes.'}
───────────────────────────────────────────────────────
VERSION HISTORY
───────────────────────────────────────────────────────
${period.versions.map(v => `  v${v.version} | ${v.sealedAt} | ${v.sealNumber} | ${v.notes}`).join('\n')}
═══════════════════════════════════════════════════════
This document is electronically sealed and certified.
Digital Seal: ${period.sealNumber}
═══════════════════════════════════════════════════════`.trim();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `sealed_${period.label.replace(/\s/g, '_')}_v${period.version}.txt`; a.click();
        URL.revokeObjectURL(url);
    };

    // --- REAL ACCOUNTING DATA ---
    const postedEntries = entries.filter(e => e.status === 'Posted');
    const leafAccounts = accounts.filter(a => !a.isGroup);

    const totalRevenue = leafAccounts.filter(a => a.type === 'Revenue').reduce((s, a) => s + getAccountBalance(a.id), 0);
    const totalExpenses = leafAccounts.filter(a => a.type === 'Expense' || a.type === 'COGS').reduce((s, a) => s + getAccountBalance(a.id), 0);
    const totalAssets = leafAccounts.filter(a => a.type === 'Asset').reduce((s, a) => s + getAccountBalance(a.id), 0);
    const totalLiabilities = leafAccounts.filter(a => a.type === 'Liability').reduce((s, a) => s + getAccountBalance(a.id), 0);
    const totalEquity = leafAccounts.filter(a => a.type === 'Equity').reduce((s, a) => s + getAccountBalance(a.id), 0);
    const netIncome = totalRevenue - totalExpenses;

    const accountingTabs = [
        { id: 'summary', label: 'Summary', icon: <BarChart3 size={14} /> },
        { id: 'coa', label: 'Chart of Accounts', icon: <List size={14} /> },
        { id: 'journal', label: 'Journal Entries', icon: <BookOpen size={14} /> },
        { id: 'trial', label: 'Trial Balance', icon: <DollarSign size={14} /> },
        { id: 'invoices', label: 'Invoices', icon: <FileText size={14} /> },
        { id: 'bank', label: 'Bank Accounts', icon: <CreditCard size={14} /> },
        { id: 'customers', label: 'Customers & Vendors', icon: <Users size={14} /> },
        { id: 'adjustments', label: 'Adjustments', icon: <Edit3 size={14} /> },
    ];

    const handleOpenCompanyProfile = (company) => {
        setSelectedCompanyView(company);
        setCompanyProfileTab('overview');
        setViewMode('company');
    };

    const companyProfileTabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 size={14} /> },
        { id: 'tax', label: 'Tax & Registration', icon: <FileCheck size={14} /> },
        { id: 'bank', label: 'Bank Accounts', icon: <CreditCard size={14} /> },
        { id: 'shareholders', label: 'Shareholders', icon: <PieChart size={14} /> },
        { id: 'attachments', label: 'Attachments', icon: <Paperclip size={14} /> },
        { id: 'periods', label: 'Audit Periods', icon: <FileText size={14} /> },
    ];

    // ---- COMPANY PROFILE MODE ----
    if (viewMode === 'company' && selectedCompanyView) {
        const co = selectedCompanyView;
        const companyPeriods = allPeriods.filter(p => p.companyId === co.id);
        const totalBankBalance = co.bankAccounts?.reduce((s, b) => s + b.balance, 0) || 0;
        const catColors = { Legal: '#2563eb', Tax: '#d97706', Financial: '#059669', Corporate: '#7c3aed' };

        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-slate-50)', padding: '2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => { setViewMode('list'); setSelectedCompanyView(null); }} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500
                            }}><ArrowLeft size={18} /> Back to Dashboard</button>
                        </div>
                    </div>

                    {/* Company Header Card */}
                    <Card className="padding-lg" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '4rem', height: '4rem', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    {co.logo}
                                </div>
                                <div>
                                    <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{co.name}</h1>
                                    <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{co.industry} • {co.legalForm} • Founded {co.foundedYear}</p>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>CEO: {co.ceo} &nbsp;|&nbsp; Reg: {co.registrationNumber}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>{co.status.toUpperCase()}</span>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>{co.employees} employees</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {[
                                { label: 'Capital', value: `${co.capital?.toLocaleString()} ${co.currency}` },
                                { label: 'Annual Revenue', value: `${co.annualRevenue?.toLocaleString()} ${co.currency}` },
                                { label: 'Bank Balance', value: `${totalBankBalance.toLocaleString()} ${co.currency}` },
                                { label: 'Audit Periods', value: companyPeriods.length }
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                        {companyProfileTabs.map(tab => (
                            <button key={tab.id} onClick={() => setCompanyProfileTab(tab.id)} style={{
                                padding: '0.65rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer',
                                borderBottom: companyProfileTab === tab.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                                color: companyProfileTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                marginBottom: '-2px', whiteSpace: 'nowrap'
                            }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: Overview */}
                    {companyProfileTab === 'overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Card className="padding-lg">
                                <h4 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16} /> Company Information</h4>
                                {[
                                    { icon: <Briefcase size={14} />, label: 'Industry', value: co.industry },
                                    { icon: <Hash size={14} />, label: 'Registration', value: co.registrationNumber },
                                    { icon: <Hash size={14} />, label: 'Legal Form', value: co.legalForm },
                                    { icon: <MapPin size={14} />, label: 'Address', value: co.address },
                                    { icon: <Globe size={14} />, label: 'Website', value: co.website },
                                ].map((row, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{row.icon} {row.label}</span>
                                        <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                                    </div>
                                ))}
                            </Card>
                            <Card className="padding-lg">
                                <h4 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} /> Contact Details</h4>
                                {[
                                    { icon: <Users size={14} />, label: 'CEO', value: co.ceo },
                                    { icon: <Users size={14} />, label: 'Contact Person', value: `${co.contactPerson} (${co.contactRole})` },
                                    { icon: <Phone size={14} />, label: 'Phone', value: co.phone },
                                    { icon: <Phone size={14} />, label: 'Fax', value: co.fax },
                                    { icon: <Mail size={14} />, label: 'Email', value: co.email },
                                ].map((row, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{row.icon} {row.label}</span>
                                        <span style={{ fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    )}

                    {/* TAB: Tax & Registration */}
                    {companyProfileTab === 'tax' && (
                        <Card className="padding-lg">
                            <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileCheck size={16} /> Tax & Registration Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h5 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--color-primary-600)' }}>Tax Numbers</h5>
                                    {[
                                        { label: 'Tax Number', value: co.taxInfo?.taxNumber },
                                        { label: 'Sales Tax Number', value: co.taxInfo?.salesTaxNumber },
                                        { label: 'Income Tax ID', value: co.taxInfo?.incomeTaxId },
                                        { label: 'Tax Office', value: co.taxInfo?.taxOffice },
                                    ].map((row, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                                            <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h5 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--color-primary-600)' }}>VAT & Status</h5>
                                    {[
                                        { label: 'VAT Registered', value: co.taxInfo?.vatRegistered ? '✅ Yes' : '❌ No' },
                                        { label: 'VAT Rate', value: `${co.taxInfo?.vatRate}%` },
                                        { label: 'Last Tax Filing', value: co.taxInfo?.lastTaxFiling },
                                        { label: 'Tax Status', value: co.taxInfo?.taxStatus },
                                    ].map((row, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                                            <span style={{
                                                fontWeight: 600,
                                                color: row.label === 'Tax Status'
                                                    ? (row.value === 'Compliant' ? 'var(--color-success)' : 'var(--color-warning)')
                                                    : 'inherit'
                                            }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* TAB: Bank Accounts */}
                    {companyProfileTab === 'bank' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                {(co.bankAccounts || []).map((bank, i) => (
                                    <Card key={i} className="padding-lg" style={{ border: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{bank.bankName}</h4>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-slate-100)', color: 'var(--color-text-secondary)' }}>{bank.type}</span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: '#dbeafe', color: '#2563eb', fontWeight: 600 }}>{bank.currency}</span>
                                        </div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-600)', margin: '0.75rem 0' }}>
                                            {bank.balance.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{bank.currency}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>Account: <strong style={{ fontFamily: 'monospace' }}>{bank.accountNumber}</strong></div>
                                            <div>IBAN: <strong style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{bank.iban}</strong></div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <Card className="padding-md" style={{ background: 'var(--color-primary-50)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Total Balance Across All Accounts</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-600)' }}>{totalBankBalance.toLocaleString()} {co.currency}</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB: Shareholders */}
                    {companyProfileTab === 'shareholders' && (
                        <Card className="padding-lg">
                            <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PieChart size={16} /> Ownership Structure</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(co.shareholders || []).map((sh, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                            background: `hsl(${i * 90}, 60%, 50%)`, color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.9rem'
                                        }}>{sh.share}%</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sh.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sh.role}</div>
                                        </div>
                                        {/* Visual Bar */}
                                        <div style={{ width: '200px', height: '8px', borderRadius: '4px', background: 'var(--color-slate-100)', overflow: 'hidden' }}>
                                            <div style={{ width: `${sh.share}%`, height: '100%', borderRadius: '4px', background: `hsl(${i * 90}, 60%, 50%)` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* TAB: Attachments */}
                    {companyProfileTab === 'attachments' && (
                        <Card className="padding-none">
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ fontWeight: 700 }}>Documents & Attachments ({co.attachments?.length || 0})</h4>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-slate-50)' }}>
                                        <th style={{ padding: '8px 14px', textAlign: 'left' }}>Document Name</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'left' }}>Category</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'left' }}>Size</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(co.attachments || []).map(att => (
                                        <tr key={att.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '8px 14px', fontWeight: 500 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Paperclip size={14} style={{ color: 'var(--color-text-muted)' }} /> {att.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 14px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                                                    background: `${catColors[att.category]}15`, color: catColors[att.category]
                                                }}>{att.category}</span>
                                            </td>
                                            <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{att.type}</td>
                                            <td style={{ padding: '8px 14px', color: 'var(--color-text-muted)' }}>{att.size}</td>
                                            <td style={{ padding: '8px 14px', color: 'var(--color-text-muted)' }}>{att.date}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                                <button style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                    fontSize: '0.75rem', fontWeight: 600, margin: '0 auto'
                                                }}><Download size={13} /> Download</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    )}

                    {/* TAB: Audit Periods */}
                    {companyProfileTab === 'periods' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {companyPeriods.length === 0 ? (
                                <Card className="padding-lg" style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--color-text-muted)' }}>No audit periods for this company.</p>
                                </Card>
                            ) : companyPeriods.map(period => {
                                const sc = statusConfig[period.status];
                                return (
                                    <Card key={period.id} className="padding-md">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: sc?.bg, color: sc?.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {sc?.icon}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{period.label}</h4>
                                                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: sc?.bg, color: sc?.color }}>{sc?.label}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {period.status === AUDIT_STATUSES.SUBMITTED && <Button size="sm" icon={<Eye size={14} />} onClick={() => handleStartReview(period)}>Start Review</Button>}
                                                {period.status === AUDIT_STATUSES.IN_REVIEW && <Button size="sm" icon={<Eye size={14} />} onClick={() => { setSelectedPeriod(period); setViewMode('review'); }}>Continue</Button>}
                                                {period.sealNumber && <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={() => downloadSealedStatement(period)}>Download</Button>}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ---- REVIEW MODE ----
    if (viewMode === 'review' && selectedPeriod) {
        const isNewVersion = [AUDIT_STATUSES.APPROVED, AUDIT_STATUSES.SEALED].includes(selectedPeriod.status);
        return (
            <>
                <div style={{ minHeight: '100vh', background: 'var(--color-slate-50)', padding: '2rem' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {isNewVersion ? 'Revise' : 'Review'}: {selectedPeriod.label}
                                </h1>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{currentAuditor.name} — Full Accounting Review</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedPeriod(null); }}>Back to List</Button>
                            </div>
                        </div>

                        {/* Accounting Tabs */}
                        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                            {accountingTabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveAccountingTab(tab.id)} style={{
                                    padding: '0.65rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer',
                                    borderBottom: activeAccountingTab === tab.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                                    color: activeAccountingTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                                    fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    marginBottom: '-2px', whiteSpace: 'nowrap'
                                }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* TAB: Summary */}
                        {activeAccountingTab === 'summary' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[
                                        { label: 'Total Revenue', value: totalRevenue, color: 'var(--color-success)', bg: 'var(--color-success-dim)' },
                                        { label: 'Total Expenses', value: totalExpenses, color: 'var(--color-error)', bg: 'var(--color-error-dim)' },
                                        { label: 'Net Income', value: netIncome, color: 'var(--color-primary-600)', bg: 'var(--color-primary-50)' }
                                    ].map((item, i) => (
                                        <Card key={i} className="padding-md" style={{ background: item.bg }}>
                                            <div style={{ fontSize: '0.75rem', color: item.color, fontWeight: 500 }}>{item.label}</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{item.value.toLocaleString()} JOD</div>
                                        </Card>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[
                                        { label: 'Total Assets', value: totalAssets },
                                        { label: 'Total Liabilities', value: totalLiabilities },
                                        { label: 'Total Equity', value: totalEquity }
                                    ].map((item, i) => (
                                        <Card key={i} className="padding-md">
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{item.label}</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value.toLocaleString()} JOD</div>
                                        </Card>
                                    ))}
                                </div>
                                <Card className="padding-md">
                                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Quick Stats</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Accounts:</span> <strong>{accounts.length}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Journal Entries:</span> <strong>{postedEntries.length}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Invoices:</span> <strong>{invoices?.length || 0}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Bank Accounts:</span> <strong>{bankAccounts?.length || 0}</strong></div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* TAB: Chart of Accounts */}
                        {activeAccountingTab === 'coa' && (
                            <Card className="padding-none">
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontWeight: 700 }}>Chart of Accounts ({accounts.length})</h4>
                                    <Button size="sm" icon={<Plus size={14} />} onClick={() => {
                                        setEditModal({
                                            title: 'Add New Account',
                                            fields: [
                                                { key: 'code', label: 'Account Code', value: '', type: 'text' },
                                                { key: 'name', label: 'Account Name', value: '', type: 'text' },
                                                { key: 'type', label: 'Type (Asset/Liability/Equity/Revenue/Expense/COGS)', value: '', type: 'text' }
                                            ],
                                            onSave: (vals) => {
                                                if (vals.code && vals.name && vals.type) {
                                                    addAccount({ code: vals.code, name: vals.name, type: vals.type, id: vals.code, isGroup: false });
                                                    logChange({ entityType: 'account', entityId: vals.code, field: 'new account', oldValue: '—', newValue: `${vals.code} - ${vals.name}`, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                }
                                            }
                                        });
                                    }}>Add Account</Button>
                                </div>
                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-slate-50)', position: 'sticky', top: 0 }}>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Code</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Name</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Balance</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accounts.map(acc => {
                                                const balance = acc.isGroup ? null : getAccountBalance(acc.id);
                                                return (
                                                    <tr key={acc.id} style={{
                                                        borderBottom: '1px solid var(--color-border)',
                                                        background: acc.isGroup ? 'var(--color-slate-50)' : 'white'
                                                    }}>
                                                        <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontWeight: acc.isGroup ? 700 : 400, fontSize: '0.75rem' }}>
                                                            {acc.code}
                                                        </td>
                                                        <td style={{
                                                            padding: '6px 12px',
                                                            paddingLeft: acc.parentCode ? '2rem' : '12px',
                                                            fontWeight: acc.isGroup ? 700 : 400,
                                                            fontSize: acc.isGroup ? '0.82rem' : '0.8rem'
                                                        }}>
                                                            {acc.name}
                                                        </td>
                                                        <td style={{ padding: '6px 12px' }}>
                                                            <span style={{
                                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                                                background: acc.type === 'Asset' ? '#dbeafe' : acc.type === 'Liability' ? '#fee2e2' : acc.type === 'Revenue' ? '#d1fae5' : acc.type === 'Expense' ? '#fef3c7' : '#f1f5f9',
                                                                color: acc.type === 'Asset' ? '#2563eb' : acc.type === 'Liability' ? '#dc2626' : acc.type === 'Revenue' ? '#059669' : acc.type === 'Expense' ? '#d97706' : '#475569'
                                                            }}>
                                                                {acc.type}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                                            {balance !== null ? `${balance.toLocaleString()}` : '—'}
                                                        </td>
                                                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                            {!acc.isGroup && (
                                                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                                    <button onClick={() => {
                                                                        setEditModal({
                                                                            title: `Edit Account: ${acc.code}`,
                                                                            fields: [{ key: 'name', label: 'Account Name', value: acc.name, oldValue: acc.name, type: 'text' }],
                                                                            onSave: (vals) => {
                                                                                if (vals.name && vals.name !== acc.name) {
                                                                                    logChange({ entityType: 'account', entityId: acc.id, field: 'name', oldValue: acc.name, newValue: vals.name, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                                }
                                                                            }
                                                                        });
                                                                    }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', padding: '2px' }} title="Edit"><Edit3 size={13} /></button>
                                                                    <button onClick={() => { if (confirm(`Delete ${acc.code} - ${acc.name}?`)) deleteAccount(acc.id); }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '2px' }} title="Delete"><Trash2 size={13} /></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* TAB: Journal Entries */}
                        {activeAccountingTab === 'journal' && (
                            <Card className="padding-none">
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontWeight: 700 }}>Journal Entries ({postedEntries.length} posted)</h4>
                                    <Button size="sm" icon={<Plus size={14} />} onClick={() => {
                                        const desc = prompt('Entry Description:');
                                        const acc1 = prompt('Debit Account Code (e.g. 6150):');
                                        const acc2 = prompt('Credit Account Code (e.g. 1111):');
                                        const amount = parseFloat(prompt('Amount:'));
                                        if (desc && acc1 && acc2 && amount > 0) {
                                            addEntry({ date: new Date().toISOString().split('T')[0], reference: `ADT-${Date.now().toString().slice(-6)}`, description: `[Auditor] ${desc}`, status: 'Posted', isAutomatic: false, sourceType: 'Auditor Adjustment', lines: [{ id: 1, account: acc1, description: desc, debit: amount, credit: 0, costCenter: '' }, { id: 2, account: acc2, description: desc, debit: 0, credit: amount, costCenter: '' }] });
                                        }
                                    }}>Add Entry</Button>
                                </div>
                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {postedEntries.map(entry => (
                                        <div key={entry.id} style={{ borderBottom: '1px solid var(--color-border)', padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{entry.id}</span>
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{entry.date}</span>
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{entry.reference}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {entry.sourceType === 'Auditor Adjustment' && (
                                                        <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>AUDITOR</span>
                                                    )}
                                                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-success-dim)', color: 'var(--color-success)', fontWeight: 600 }}>Posted</span>
                                                    <button onClick={() => {
                                                        setEditModal({
                                                            title: `Edit Entry: ${entry.id}`,
                                                            fields: [
                                                                { key: 'description', label: 'Description', value: entry.description, oldValue: entry.description, type: 'text' },
                                                                ...entry.lines.map((line, i) => ({ key: `debit_${i}`, label: `${line.account} - Debit`, value: line.debit, oldValue: String(line.debit), type: 'number' })),
                                                                ...entry.lines.map((line, i) => ({ key: `credit_${i}`, label: `${line.account} - Credit`, value: line.credit, oldValue: String(line.credit), type: 'number' }))
                                                            ],
                                                            onSave: (vals) => {
                                                                if (vals.description !== entry.description) {
                                                                    logChange({ entityType: 'journal_entry', entityId: entry.id, field: 'description', oldValue: entry.description, newValue: vals.description, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                }
                                                                entry.lines.forEach((line, i) => {
                                                                    const newDebit = parseFloat(vals[`debit_${i}`]) || 0;
                                                                    const newCredit = parseFloat(vals[`credit_${i}`]) || 0;
                                                                    if (newDebit !== line.debit) logChange({ entityType: 'journal_line', entityId: entry.id, field: `debit (${line.account})`, oldValue: String(line.debit), newValue: String(newDebit), periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                    if (newCredit !== line.credit) logChange({ entityType: 'journal_line', entityId: entry.id, field: `credit (${line.account})`, oldValue: String(line.credit), newValue: String(newCredit), periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                });
                                                            }
                                                        });
                                                    }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }} title="Edit"><Edit3 size={13} /></button>
                                                    <button onClick={() => { if (confirm(`Delete entry ${entry.id}?`)) logChange({ entityType: 'journal_entry', entityId: entry.id, field: 'deleted', oldValue: entry.description, newValue: '— (deleted)', periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId }); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} title="Delete"><Trash2 size={13} /></button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{entry.description}</p>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--color-slate-50)' }}>
                                                        <th style={{ padding: '4px 8px', textAlign: 'left' }}>Account</th>
                                                        <th style={{ padding: '4px 8px', textAlign: 'left' }}>Description</th>
                                                        <th style={{ padding: '4px 8px', textAlign: 'right' }}>Debit</th>
                                                        <th style={{ padding: '4px 8px', textAlign: 'right' }}>Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entry.lines.map((line, i) => (
                                                        <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                            <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{line.account}</td>
                                                            <td style={{ padding: '4px 8px' }}>{line.description}</td>
                                                            <td style={{ padding: '4px 8px', textAlign: 'right', color: line.debit > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                                                {line.debit > 0 ? line.debit.toLocaleString() : '—'}
                                                            </td>
                                                            <td style={{ padding: '4px 8px', textAlign: 'right', color: line.credit > 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                                                                {line.credit > 0 ? line.credit.toLocaleString() : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* TAB: Trial Balance */}
                        {activeAccountingTab === 'trial' && (
                            <Card className="padding-none">
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontWeight: 700 }}>Trial Balance</h4>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-slate-50)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Code</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Account</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Debit</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            let totalDebit = 0, totalCredit = 0;
                                            const rows = leafAccounts.map(acc => {
                                                const balance = getAccountBalance(acc.id);
                                                if (balance === 0) return null;
                                                const isDebitNormal = ['Asset', 'Expense', 'COGS'].includes(acc.type);
                                                const debit = (isDebitNormal && balance > 0) || (!isDebitNormal && balance < 0) ? Math.abs(balance) : 0;
                                                const credit = (!isDebitNormal && balance > 0) || (isDebitNormal && balance < 0) ? Math.abs(balance) : 0;
                                                totalDebit += debit;
                                                totalCredit += credit;
                                                return (
                                                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{acc.code}</td>
                                                        <td style={{ padding: '6px 12px' }}>{acc.name}</td>
                                                        <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{debit > 0 ? debit.toLocaleString() : '—'}</td>
                                                        <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{credit > 0 ? credit.toLocaleString() : '—'}</td>
                                                    </tr>
                                                );
                                            }).filter(Boolean);
                                            return (
                                                <>
                                                    {rows}
                                                    <tr style={{ background: 'var(--color-primary-50)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                        <td colSpan={2} style={{ padding: '10px 12px' }}>Total</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{totalDebit.toLocaleString()}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{totalCredit.toLocaleString()}</td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {/* TAB: Invoices */}
                        {activeAccountingTab === 'invoices' && (
                            <Card className="padding-none">
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontWeight: 700 }}>Invoices ({invoices?.length || 0})</h4>
                                    <Button size="sm" icon={<Plus size={14} />} onClick={() => {
                                        setEditModal({
                                            title: 'Add New Invoice',
                                            fields: [
                                                { key: 'invoiceNumber', label: 'Invoice Number', value: '', type: 'text' },
                                                { key: 'customerName', label: 'Customer Name', value: '', type: 'text' },
                                                { key: 'date', label: 'Date', value: new Date().toISOString().split('T')[0], type: 'text' },
                                                { key: 'total', label: 'Total Amount', value: '', type: 'number' },
                                                { key: 'status', label: 'Status (Draft/Sent/Paid)', value: 'Draft', type: 'text' }
                                            ],
                                            onSave: (vals) => {
                                                if (vals.invoiceNumber && vals.total) {
                                                    const newInv = { id: `INV-${Date.now()}`, invoiceNumber: vals.invoiceNumber, customerName: vals.customerName, date: vals.date, total: parseFloat(vals.total) || 0, status: vals.status || 'Draft' };
                                                    setInvoices(prev => [...(prev || []), newInv]);
                                                    logChange({ entityType: 'invoice', entityId: newInv.id, field: 'new invoice', oldValue: '\u2014', newValue: `${vals.invoiceNumber} - ${vals.customerName} - ${vals.total}`, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                }
                                            }
                                        });
                                    }}>Add Invoice</Button>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-slate-50)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Invoice #</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Customer</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(invoices || []).map(inv => (
                                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '6px 12px', fontWeight: 600 }}>{inv.invoiceNumber || inv.id}</td>
                                                <td style={{ padding: '6px 12px' }}>{inv.customerName || 'N/A'}</td>
                                                <td style={{ padding: '6px 12px', color: 'var(--color-text-muted)' }}>{inv.date}</td>
                                                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>{(inv.total || 0).toLocaleString()}</td>
                                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 600,
                                                        background: inv.status === 'Paid' ? 'var(--color-success-dim)' : inv.status === 'Sent' ? 'var(--color-warning-dim)' : 'var(--color-slate-100)',
                                                        color: inv.status === 'Paid' ? 'var(--color-success)' : inv.status === 'Sent' ? 'var(--color-warning)' : 'var(--color-text-secondary)'
                                                    }}>{inv.status}</span>
                                                </td>
                                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                        <button onClick={() => {
                                                            setEditModal({
                                                                title: `Edit Invoice: ${inv.invoiceNumber || inv.id}`,
                                                                fields: [
                                                                    { key: 'customerName', label: 'Customer Name', value: inv.customerName || '', oldValue: inv.customerName || '', type: 'text' },
                                                                    { key: 'date', label: 'Date', value: inv.date || '', oldValue: inv.date || '', type: 'text' },
                                                                    { key: 'total', label: 'Total Amount', value: inv.total || 0, oldValue: String(inv.total || 0), type: 'number' },
                                                                    { key: 'status', label: 'Status (Draft/Sent/Paid)', value: inv.status || '', oldValue: inv.status || '', type: 'text' }
                                                                ],
                                                                onSave: (vals) => {
                                                                    const newTotal = parseFloat(vals.total) || 0;
                                                                    if (vals.customerName !== inv.customerName) logChange({ entityType: 'invoice', entityId: inv.id, field: 'customer', oldValue: inv.customerName || '', newValue: vals.customerName, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                    if (newTotal !== (inv.total || 0)) logChange({ entityType: 'invoice', entityId: inv.id, field: 'total', oldValue: String(inv.total || 0), newValue: String(newTotal), periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                    if (vals.status !== inv.status) logChange({ entityType: 'invoice', entityId: inv.id, field: 'status', oldValue: inv.status || '', newValue: vals.status, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                    if (vals.date !== inv.date) logChange({ entityType: 'invoice', entityId: inv.id, field: 'date', oldValue: inv.date || '', newValue: vals.date, periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                                }
                                                            });
                                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', padding: '2px' }} title="Edit"><Edit3 size={13} /></button>
                                                        <button onClick={() => {
                                                            if (confirm(`Delete invoice ${inv.invoiceNumber || inv.id}?`)) {
                                                                logChange({ entityType: 'invoice', entityId: inv.id, field: 'deleted', oldValue: `${inv.invoiceNumber} - ${inv.total}`, newValue: '\u2014 (deleted)', periodId: selectedPeriod?.id, companyId: selectedPeriod?.companyId });
                                                            }
                                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '2px' }} title="Delete"><Trash2 size={13} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!invoices || invoices.length === 0) && (
                                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No invoices found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {/* TAB: Bank */}
                        {activeAccountingTab === 'bank' && (
                            <Card className="padding-none">
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontWeight: 700 }}>Bank Accounts ({bankAccounts?.length || 0})</h4>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
                                    {(bankAccounts || []).map(bank => (
                                        <div key={bank.id} style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{bank.bankName}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{bank.accountNumber}</p>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                                                {(bank.balance || 0).toLocaleString()} {bank.currency || 'JOD'}
                                            </div>
                                        </div>
                                    ))}
                                    {(!bankAccounts || bankAccounts.length === 0) && (
                                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No bank accounts found.</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* TAB: Customers & Vendors */}
                        {activeAccountingTab === 'customers' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Card className="padding-none">
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <h4 style={{ fontWeight: 700 }}>Customers ({customers?.length || 0})</h4>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {(customers || []).map(c => (
                                            <div key={c.id} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{c.email} • {c.phone || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card className="padding-none">
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <h4 style={{ fontWeight: 700 }}>Vendors ({vendors?.length || 0})</h4>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {(vendors || []).map(v => (
                                            <div key={v.id} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                                <div style={{ fontWeight: 600 }}>{v.name}</div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{v.email} • {v.phone || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* TAB: Adjustments */}
                        {activeAccountingTab === 'adjustments' && (() => {
                            const periodAdjs = getAdjustmentsForPeriod(selectedPeriod.id);
                            const adjStatusConfig = {
                                pending: { label: 'Pending Approval', bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' },
                                approved: { label: 'Approved', bg: 'var(--color-success-dim)', color: 'var(--color-success)' },
                                rejected: { label: 'Rejected', bg: 'var(--color-error-dim)', color: 'var(--color-error)' }
                            };

                            const handleSubmitAdj = () => {
                                if (!newAdjTitle.trim() || !newAdjDescription.trim()) return;
                                const validLines = newAdjLines.filter(l => l.accountName && (l.debit > 0 || l.credit > 0));
                                if (validLines.length === 0) return;
                                proposeAdjustment({
                                    periodId: selectedPeriod.id,
                                    companyId: selectedPeriod.companyId,
                                    type: 'journal_entry',
                                    title: newAdjTitle,
                                    description: newAdjDescription,
                                    changes: {
                                        entryId: `JE-ADJ-${Date.now()}`,
                                        lines: validLines
                                    }
                                });
                                setNewAdjTitle(''); setNewAdjDescription('');
                                setNewAdjLines([{ account: '', accountName: '', debit: 0, credit: 0 }]);
                                setShowNewAdjForm(false);
                            };

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Proposed Adjustments</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                Propose accounting adjustments that require admin approval.
                                            </p>
                                        </div>
                                        <Button icon={<Edit3 size={14} />} onClick={() => setShowNewAdjForm(!showNewAdjForm)}>
                                            {showNewAdjForm ? 'Cancel' : 'New Adjustment'}
                                        </Button>
                                    </div>

                                    {/* New Adjustment Form */}
                                    {showNewAdjForm && (
                                        <Card className="padding-lg" style={{ border: '2px solid var(--color-primary-600)', background: 'var(--color-primary-50)' }}>
                                            <h4 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Edit3 size={16} /> Propose New Adjustment
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Title</label>
                                                    <input value={newAdjTitle} onChange={e => setNewAdjTitle(e.target.value)}
                                                        placeholder="e.g. Revenue Recognition Correction"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Type</label>
                                                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                                                        <option>Journal Entry Adjustment</option>
                                                        <option>Account Reclassification</option>
                                                        <option>Accrual Adjustment</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Justification / Description</label>
                                                <textarea value={newAdjDescription} onChange={e => setNewAdjDescription(e.target.value)}
                                                    placeholder="Explain the reason for this adjustment per applicable standards (IFRS, local GAAP)..."
                                                    style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>Journal Entry Lines</label>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                                    <thead>
                                                        <tr style={{ background: 'white' }}>
                                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Account Code</th>
                                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Account Name</th>
                                                            <th style={{ padding: '6px 8px', textAlign: 'right', width: '120px' }}>Debit</th>
                                                            <th style={{ padding: '6px 8px', textAlign: 'right', width: '120px' }}>Credit</th>
                                                            <th style={{ padding: '6px 8px', width: '40px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {newAdjLines.map((line, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <input value={line.account} onChange={e => { const lines = [...newAdjLines]; lines[idx].account = e.target.value; setNewAdjLines(lines); }}
                                                                        placeholder="e.g. 4110" style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                                                                </td>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <input value={line.accountName} onChange={e => { const lines = [...newAdjLines]; lines[idx].accountName = e.target.value; setNewAdjLines(lines); }}
                                                                        placeholder="e.g. Sales Revenue" style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
                                                                </td>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <input type="number" value={line.debit || ''} onChange={e => { const lines = [...newAdjLines]; lines[idx].debit = parseFloat(e.target.value) || 0; setNewAdjLines(lines); }}
                                                                        placeholder="0" style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', textAlign: 'right', fontSize: '0.8rem' }} />
                                                                </td>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <input type="number" value={line.credit || ''} onChange={e => { const lines = [...newAdjLines]; lines[idx].credit = parseFloat(e.target.value) || 0; setNewAdjLines(lines); }}
                                                                        placeholder="0" style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', textAlign: 'right', fontSize: '0.8rem' }} />
                                                                </td>
                                                                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                                                    {newAdjLines.length > 1 && (
                                                                        <button onClick={() => setNewAdjLines(newAdjLines.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    <button onClick={() => setNewAdjLines([...newAdjLines, { account: '', accountName: '', debit: 0, credit: 0 }])}
                                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Add Line</button>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Total Debit: <strong>{newAdjLines.reduce((s, l) => s + (l.debit || 0), 0).toLocaleString()}</strong> &nbsp;|&nbsp;
                                                        Total Credit: <strong>{newAdjLines.reduce((s, l) => s + (l.credit || 0), 0).toLocaleString()}</strong>
                                                        {newAdjLines.reduce((s, l) => s + (l.debit || 0), 0) !== newAdjLines.reduce((s, l) => s + (l.credit || 0), 0) &&
                                                            <span style={{ color: 'var(--color-error)', marginLeft: '0.5rem' }}>⚠ Unbalanced</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button variant="ghost" onClick={() => setShowNewAdjForm(false)}>Cancel</Button>
                                                <Button icon={<CheckCircle size={14} />} onClick={handleSubmitAdj}
                                                    style={{ background: 'var(--color-primary-600)' }}>Submit for Admin Approval</Button>
                                            </div>
                                        </Card>
                                    )}

                                    {/* Existing Adjustments */}
                                    {periodAdjs.length === 0 && !showNewAdjForm ? (
                                        <Card className="padding-lg" style={{ textAlign: 'center' }}>
                                            <Edit3 size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
                                            <p style={{ fontWeight: 500 }}>No adjustments proposed yet</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Click "New Adjustment" to propose an accounting change.</p>
                                        </Card>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {periodAdjs.map(adj => {
                                                const sc = adjStatusConfig[adj.status];
                                                return (
                                                    <Card key={adj.id} className="padding-md" style={{ borderLeft: `4px solid ${sc.color}` }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                            <div>
                                                                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{adj.title}</h4>
                                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{adj.description}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{adj.createdAt}</span>
                                                            </div>
                                                        </div>

                                                        {/* Journal Lines */}
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                                                            <thead>
                                                                <tr style={{ background: 'var(--color-slate-50)' }}>
                                                                    <th style={{ padding: '5px 10px', textAlign: 'left' }}>Account</th>
                                                                    <th style={{ padding: '5px 10px', textAlign: 'left' }}>Name</th>
                                                                    <th style={{ padding: '5px 10px', textAlign: 'right' }}>Debit</th>
                                                                    <th style={{ padding: '5px 10px', textAlign: 'right' }}>Credit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {adj.changes.lines.map((line, i) => (
                                                                    <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                                        <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{line.account}</td>
                                                                        <td style={{ padding: '5px 10px' }}>{line.accountName}</td>
                                                                        <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: line.debit > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                                                            {line.debit > 0 ? line.debit.toLocaleString() : '—'}
                                                                        </td>
                                                                        <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: line.credit > 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                                                                            {line.credit > 0 ? line.credit.toLocaleString() : '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>

                                                        {/* Admin Response */}
                                                        {adj.adminNotes && (
                                                            <div style={{
                                                                padding: '0.5rem 0.75rem', borderRadius: '6px',
                                                                background: adj.status === 'approved' ? 'var(--color-success-dim)' : adj.status === 'rejected' ? 'var(--color-error-dim)' : 'var(--color-slate-50)',
                                                                fontSize: '0.78rem'
                                                            }}>
                                                                <strong>Admin Response:</strong> {adj.adminNotes}
                                                                {adj.reviewedAt && <span style={{ float: 'right', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Reviewed: {adj.reviewedAt}</span>}
                                                            </div>
                                                        )}
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        {/* ===== MY CHANGES & ADMIN FEEDBACK ===== */}
                        {(() => {
                            const myChanges = auditChanges.filter(c => c.companyId === selectedPeriod?.companyId);
                            if (myChanges.length === 0) return null;
                            const pendingCount = myChanges.filter(c => c.status === 'pending').length;
                            const approvedCount = myChanges.filter(c => c.status === 'approved').length;
                            const rejectedCount = myChanges.filter(c => c.status === 'rejected').length;
                            return (
                                <Card className="padding-none" style={{ marginTop: '1.5rem', border: '2px solid var(--color-primary-200)' }}>
                                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                                        <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Edit3 size={18} /> My Changes & Admin Feedback
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                            {pendingCount > 0 && <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--color-warning-dim)', color: 'var(--color-warning)', fontWeight: 600 }}>⏳ {pendingCount} Pending</span>}
                                            {approvedCount > 0 && <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--color-success-dim)', color: 'var(--color-success)', fontWeight: 600 }}>✅ {approvedCount} Approved</span>}
                                            {rejectedCount > 0 && <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--color-error-dim)', color: 'var(--color-error)', fontWeight: 600 }}>❌ {rejectedCount} Rejected</span>}
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {myChanges.map(change => {
                                            const statusStyle = change.status === 'approved'
                                                ? { bg: 'var(--color-success-dim)', color: 'var(--color-success)', icon: '✅', label: 'Approved' }
                                                : change.status === 'rejected'
                                                    ? { bg: 'var(--color-error-dim)', color: 'var(--color-error)', icon: '❌', label: 'Rejected' }
                                                    : { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)', icon: '⏳', label: 'Pending' };
                                            return (
                                                <div key={change.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: change.status === 'rejected' ? '#fff5f5' : change.status === 'approved' ? '#f0fdf4' : 'white' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{change.field}</span>
                                                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
                                                                {statusStyle.icon} {statusStyle.label}
                                                            </span>
                                                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 600, background: '#e0e7ff', color: '#4338ca' }}>
                                                                {change.entityType}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{change.createdAt}</span>
                                                    </div>
                                                    {/* Old → New comparison */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontFamily: 'monospace', textDecoration: 'line-through', fontSize: '0.78rem' }}>{change.oldValue}</span>
                                                        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                                                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#d1fae5', color: '#064e3b', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem' }}>{change.newValue}</span>
                                                    </div>
                                                    {/* Admin notes */}
                                                    {change.adminNotes && change.status !== 'pending' && (
                                                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: change.status === 'approved' ? '#d1fae5' : '#fee2e2', fontSize: '0.78rem', marginBottom: '0.5rem', border: `1px solid ${change.status === 'approved' ? '#a7f3d0' : '#fecaca'}` }}>
                                                            <strong>Admin:</strong> {change.adminNotes}
                                                            {change.reviewedAt && <span style={{ float: 'right', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{change.reviewedAt}</span>}
                                                        </div>
                                                    )}
                                                    {/* Resubmit button for rejected */}
                                                    {change.status === 'rejected' && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <Button size="sm" variant="outline" icon={<Edit3 size={12} />} onClick={() => {
                                                                setEditModal({
                                                                    title: `Resubmit: ${change.field}`,
                                                                    fields: [{
                                                                        key: 'newValue',
                                                                        label: `New Value for "${change.field}"`,
                                                                        value: change.newValue,
                                                                        oldValue: `Rejected: ${change.newValue}`,
                                                                        type: typeof change.newValue === 'number' || !isNaN(Number(change.newValue)) ? 'number' : 'text'
                                                                    }],
                                                                    onSave: (vals) => {
                                                                        logChange({
                                                                            entityType: change.entityType,
                                                                            entityId: change.entityId,
                                                                            field: change.field,
                                                                            oldValue: change.oldValue,
                                                                            newValue: vals.newValue,
                                                                            periodId: change.periodId,
                                                                            companyId: change.companyId
                                                                        });
                                                                    }
                                                                });
                                                            }}>
                                                                Edit & Resubmit
                                                            </Button>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Submit a new revision for admin review</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })()}

                        {/* Auditor Notes & Actions */}
                        <Card className="padding-lg" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Auditor's Notes & Opinion</h3>
                            <textarea
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                placeholder="Enter your professional opinion, observations, and recommendations..."
                                style={{
                                    width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '8px',
                                    border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: 'inherit',
                                    resize: 'vertical', marginBottom: '1rem'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                {isNewVersion ? (
                                    <Button icon={<Stamp size={16} />} onClick={handleSaveNewVersion}>Save New Version & Seal</Button>
                                ) : (
                                    <>
                                        <Button variant="outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                            icon={<ThumbsDown size={16} />} onClick={handleReject}>
                                            Request Revision
                                        </Button>
                                        <Button style={{ background: 'var(--color-success)' }} icon={<ThumbsUp size={16} />} onClick={handleApprove}>
                                            Approve & Seal
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ---- EDIT MODAL ---- */}
                {editModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
                        onClick={() => setEditModal(null)}>
                        <div style={{ background: 'white', borderRadius: '16px', width: '520px', maxWidth: '95vw', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', flexShrink: 0 }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit3 size={18} /> {editModal.title}
                                </h3>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); const vals = {}; editModal.fields.forEach(f => { vals[f.key] = document.getElementById(`modal-${f.key}`).value; }); editModal.onSave(vals); setEditModal(null); }}
                                style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                                {editModal.fields.map(f => (
                                    <div key={f.key} style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                                        <input id={`modal-${f.key}`} type={f.type || 'text'} defaultValue={f.value} step={f.type === 'number' ? '0.01' : undefined}
                                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: f.type === 'number' ? 'monospace' : 'inherit', boxSizing: 'border-box' }}
                                            autoFocus={editModal.fields.indexOf(f) === 0} />
                                        {f.oldValue !== undefined && (
                                            <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                Current: <strong>{f.oldValue}</strong>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <Button variant="outline" type="button" onClick={() => setEditModal(null)}>Cancel</Button>
                                    <Button type="submit" icon={<Save size={14} />}>Save Changes</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ---- MAIN DASHBOARD ----
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-slate-50)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                color: 'white', padding: '1.5rem 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Shield size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Auditor Portal</h1>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            <Building2 size={12} style={{ verticalAlign: 'middle' }} /> {currentAuditor.name} — {currentAuditor.contactPerson}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} icon={<LogOut size={16} />} onClick={handleLogout}>
                    Sign Out
                </Button>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pending Review', count: periods.filter(p => p.status === AUDIT_STATUSES.SUBMITTED).length, color: 'var(--color-warning)' },
                        { label: 'In Review', count: periods.filter(p => p.status === AUDIT_STATUSES.IN_REVIEW).length, color: 'var(--color-primary-600)' },
                        { label: 'Approved', count: periods.filter(p => p.status === AUDIT_STATUSES.APPROVED).length, color: 'var(--color-success)' },
                        { label: 'Sealed', count: periods.filter(p => p.status === AUDIT_STATUSES.SEALED).length, color: '#7c3aed' }
                    ].map((s, i) => (
                        <Card key={i} className="padding-md">
                            <div style={{ fontSize: '0.75rem', color: s.color, fontWeight: 500 }}>{s.label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{s.count}</div>
                        </Card>
                    ))}
                </div>

                {/* Firm Profile */}
                <Card className="padding-md" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, var(--color-primary-50), white)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{currentAuditor.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                License: {currentAuditor.licenseNumber} • {currentAuditor.specialization} • {currentAuditor.email}
                            </p>
                        </div>
                        <span style={{
                            padding: '4px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
                            background: 'var(--color-success-dim)', color: 'var(--color-success)'
                        }}>ACTIVE</span>
                    </div>
                </Card>

                {/* Client Companies */}
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>Client Companies</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {auditorCompanies.map(company => {
                        const companyPeriods = allPeriods.filter(p => p.companyId === company.id);
                        const isSelected = selectedCompanyId === company.id;
                        return (
                            <Card key={company.id} className="padding-md hoverable" style={{
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--color-primary-600)' : '1px solid var(--color-border)',
                                background: isSelected ? 'var(--color-primary-50)' : 'white',
                                transition: 'all 0.2s'
                            }} onClick={() => handleOpenCompanyProfile(company)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #0f172a, #334155)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.25rem'
                                        }}>
                                            {company.logo}
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{company.name}</h4>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                {company.industry} • {company.registrationNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                                        background: 'var(--color-success-dim)', color: 'var(--color-success)'
                                    }}>{company.status}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Contact: <strong>{company.contactPerson}</strong></span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Periods: <strong>{companyPeriods.length}</strong></span>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Tip */}
                <Card className="padding-md" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <Building2 size={20} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>Click on any company card above to view its full profile, accounts, tax info, attachments, and audit periods.</p>
                </Card>
            </div>
        </div>
    );
};

export default AuditorDashboard;
