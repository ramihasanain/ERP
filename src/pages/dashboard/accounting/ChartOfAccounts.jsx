import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../../context/AccountingContext';
import { useLanguage } from '../../../context/LanguageContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { exportToCSV } from '../../../utils/exportUtils';
import {
    Plus, Edit3, Trash2, Lock, Shield,
    ChevronRight, ChevronDown, Folder, FileText,
    Search, Filter, Save, X, Monitor, Download,
    RotateCcw, CheckCircle2
} from 'lucide-react';

const ChartOfAccounts = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, openDrawer } = useAccounting();
    const { language } = useLanguage();

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterSource, setFilterSource] = useState('All'); // 'All', 'System', 'Custom'

    const [expandedNodes, setExpandedNodes] = useState(new Set());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Expense',
        parentCode: '',
        description: ''
    });

    const t = useMemo(() => {
        return language === 'ar' ? {
            title: 'شجرة الحسابات',
            subtitle: 'هيكلة وتنظيم الحسابات المالية بدقة.',
            newAccount: 'حساب جديد',
            searchPlaceholder: 'بحث بالاسم أو الكود...',
            export: 'تصدير',
            expandAll: 'توسيع الكل',
            collapseAll: 'طي الكل',
            colCode: 'الكود',
            colName: 'اسم الحساب',
            colType: 'النوع',
            colActions: 'الإجراءات',
            modalAdd: 'إضافة حساب جديد',
            modalEdit: 'تعديل الحساب',
            discard: 'إلغاء',
            save: 'حفظ الحساب',
            allTypes: 'كل الأنواع',
            allSources: 'كل المصادر',
            systemOnly: 'حسابات النظام',
            customOnly: 'حسابات مخصصة',
            reset: 'إعادة ضبط'
        } : {
            title: 'Chart of Accounts',
            subtitle: 'Architect your financial hierarchy with precision.',
            newAccount: 'New Account',
            searchPlaceholder: 'Search by name or code...',
            export: 'Export',
            expandAll: 'Expand All',
            collapseAll: 'Collapse All',
            colCode: 'Code',
            colName: 'Account Name',
            colType: 'Type',
            colActions: 'Actions',
            modalAdd: 'Architect New Account',
            modalEdit: 'Edit Account',
            discard: 'Discard',
            save: 'Save Account',
            allTypes: 'All Types',
            allSources: 'All Sources',
            systemOnly: 'System Accounts',
            customOnly: 'Custom Accounts',
            reset: 'Reset'
        };
    }, [language]);

    // Robust Search & Filter Logic
    const filteredAccountIds = useMemo(() => {
        const matches = new Set();
        const parentsToInclude = new Set();

        accounts.forEach(acc => {
            const matchesSearch = !searchTerm ||
                acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.code.includes(searchTerm);

            const matchesType = filterType === 'All' || acc.type === filterType;
            const matchesSource = filterSource === 'All' ||
                (filterSource === 'System' && acc.isSystem) ||
                (filterSource === 'Custom' && !acc.isSystem);

            if (matchesSearch && matchesType && matchesSource) {
                matches.add(acc.id);

                // Add all ancestors to ensure path visibility
                let current = acc;
                while (current.parentCode) {
                    const parent = accounts.find(a => a.code === current.parentCode);
                    if (parent && !parentsToInclude.has(parent.id)) {
                        parentsToInclude.add(parent.id);
                        current = parent;
                    } else {
                        break;
                    }
                }
            }
        });

        return new Set([...matches, ...parentsToInclude]);
    }, [accounts, searchTerm, filterType, filterSource]);

    // Handlers
    const handleAddClick = () => {
        setEditingAccount(null);
        setFormData({ name: '', type: 'Expense', parentCode: '', description: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (acc) => {
        setEditingAccount(acc);
        setFormData({
            name: acc.name,
            type: acc.type,
            parentCode: acc.parentCode || '',
            description: acc.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            deleteAccount(id);
        }
    };

    const handleSave = () => {
        if (!formData.name) return;
        if (editingAccount) {
            updateAccount(editingAccount.id, formData);
        } else {
            addAccount(formData);
        }
        setIsModalOpen(false);
    };

    const toggleExpand = (code) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedNodes(newExpanded);
    };

    const expandAll = () => {
        const allGroups = accounts.filter(a => a.isGroup).map(a => a.code);
        setExpandedNodes(new Set(allGroups));
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterType('All');
        setFilterSource('All');
        collapseAll();
    };

    // Tree Rendering Logic
    const renderAccountTree = (parentCode = '', level = 0) => {
        const children = accounts
            .filter(acc => (acc.parentCode || '') === parentCode)
            .filter(acc => filteredAccountIds.has(acc.id))
            .sort((a, b) => a.code.localeCompare(b.code));

        return children.map(acc => {
            const isExpanded = expandedNodes.has(acc.code) || !!searchTerm;
            const hasVisibleChildren = accounts.some(a => a.parentCode === acc.code && filteredAccountIds.has(a.id));
            const depth = level;

            const rowStyle = {
                borderBottom: '1px solid var(--color-slate-100)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: level === 0 ? 'rgba(var(--color-primary-rgb), 0.03)' : 'white',
            };

            const nameCardStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingLeft: language === 'ar' ? 0 : `${depth * 2}rem`,
                paddingRight: language === 'ar' ? `${depth * 2}rem` : 0,
                position: 'relative',
                minHeight: '3.5rem'
            };

            // Improved Tree Guide Logic
            const guideLineStyle = level > 0 ? {
                position: 'absolute',
                left: language === 'ar' ? 'auto' : `${(depth - 1) * 2 + 1}rem`,
                right: language === 'ar' ? `${(depth - 1) * 2 + 1}rem` : 'auto',
                top: '-1.75rem',
                bottom: '1.75rem',
                width: '1.5px',
                background: 'var(--color-slate-200)',
                zIndex: 0
            } : {};

            const horizontalGuideStyle = level > 0 ? {
                position: 'absolute',
                left: language === 'ar' ? 'auto' : `${(depth - 1) * 2 + 1}rem`,
                right: language === 'ar' ? `${(depth - 1) * 2 + 1}rem` : 'auto',
                top: '50%',
                width: '0.75rem',
                height: '1.5px',
                background: 'var(--color-slate-200)',
                zIndex: 0
            } : {};

            // Highlight Logic
            const highlightText = (text, highlight) => {
                if (!highlight.trim()) return <span>{text}</span>;
                const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
                return (
                    <span>
                        {parts.map((part, i) =>
                            part.toLowerCase() === highlight.toLowerCase() ? (
                                <mark key={i} style={{ background: 'var(--color-warning)', color: 'white', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
                            ) : (
                                <span key={i}>{part}</span>
                            )
                        )}
                    </span>
                );
            };

            return (
                <React.Fragment key={acc.id}>
                    <tr style={rowStyle} className="group hover:bg-slate-50">
                        <td style={{ padding: '0 1rem', width: '120px' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600,
                                color: 'var(--color-text-muted)', background: 'var(--color-slate-50)',
                                padding: '2px 6px', borderRadius: '4px'
                            }}>
                                {highlightText(acc.code, searchTerm)}
                            </span>
                        </td>
                        <td style={{ padding: '0 1rem' }}>
                            <div style={nameCardStyle}>
                                {level > 0 && <div style={guideLineStyle} />}
                                {level > 0 && <div style={horizontalGuideStyle} />}

                                <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {hasVisibleChildren ? (
                                        <button
                                            onClick={() => toggleExpand(acc.code)}
                                            style={{
                                                background: isExpanded ? 'var(--color-primary-50)' : 'white',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                width: '24px', height: '24px',
                                                cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--color-primary-600)',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : (language === 'ar' ? <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronRight size={14} />)}
                                        </button>
                                    ) : (
                                        <div style={{ width: '24px' }} />
                                    )}

                                    {acc.isGroup ? (
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: level === 0 ? 'var(--color-primary-600)' : 'var(--color-primary-50)',
                                            color: level === 0 ? 'white' : 'var(--color-primary-600)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Folder size={18} fill={level === 0 ? 'rgba(255,255,255,0.2)' : 'none'} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: 'var(--color-slate-50)',
                                            color: 'var(--color-slate-400)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <FileText size={18} />
                                        </div>
                                    )}

                                    <div>
                                        <div style={{
                                            fontWeight: level === 0 ? 700 : level === 1 ? 600 : 500,
                                            fontSize: level === 0 ? '0.9rem' : '0.85rem',
                                            color: level === 0 ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                                            letterSpacing: level === 0 ? '0.02em' : 'normal',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            textTransform: level === 0 ? 'capitalize' : 'none'
                                        }}>
                                            {acc.isSystem && <Lock size={14} color="var(--color-error)" style={{ flexShrink: 0 }} title={language === 'ar' ? 'حساب نظام محمي' : 'System Protected'} />}
                                            <span>{highlightText(acc.name, searchTerm)}</span>
                                        </div>
                                        {acc.description && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>{acc.description}</p>}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '0 1rem' }}>
                            <span style={{
                                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 650,
                                background: level === 0 ? 'var(--color-primary-50)' : 'var(--color-slate-50)',
                                color: level === 0 ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                                border: '1px solid currentColor', opacity: 0.7
                            }}>
                                {acc.type}
                            </span>
                        </td>
                        <td style={{ padding: '0 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <IconButton icon={<Monitor size={16} />} color="var(--color-primary-600)" onClick={() => openDrawer('Account', acc.id)} title="Activity" />
                                <IconButton icon={<Edit3 size={16} />} color="var(--color-slate-600)" onClick={() => handleEditClick(acc)} title="Edit" />
                                {!acc.isSystem && (
                                    <IconButton icon={<Trash2 size={16} />} color="var(--color-danger-600)" onClick={() => handleDeleteClick(acc.id)} title="Delete" />
                                )}
                            </div>
                        </td>
                    </tr>
                    {(isExpanded && hasVisibleChildren) && renderAccountTree(acc.code, level + 1)}
                </React.Fragment>
            );
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-slate-900)' }}>{t.title}</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                        {t.subtitle}
                    </p>
                </div>
                <Button icon={<Plus size={18} />} onClick={handleAddClick} size="lg">{t.newAccount}</Button>
            </div>

            {/* Professional Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Card className="padding-none" style={{ flex: 1, display: 'flex', alignItems: 'center', height: '3.5rem', overflow: 'hidden', border: searchTerm ? '2px solid var(--color-primary-200)' : '1px solid var(--color-border)' }}>
                        <div style={{ padding: '0 1.25rem', color: 'var(--color-slate-400)' }}><Search size={20} /></div>
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1, border: 'none', background: 'transparent', height: '100%',
                                fontSize: '1rem', outline: 'none', fontWeight: 500, direction: language === 'ar' ? 'rtl' : 'ltr'
                            }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ padding: '0 1rem', background: 'none', border: 'none', color: 'var(--color-slate-400)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        )}
                    </Card>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button variant="outline" onClick={() => exportToCSV(accounts, 'CoA')} icon={<Download size={16} />}>{t.export}</Button>
                        <Button variant="ghost" onClick={expandAll} size="sm">{t.expandAll}</Button>
                        <Button variant="ghost" onClick={collapseAll} size="sm">{t.collapseAll}</Button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Type Filter */}
                    <div style={{ display: 'flex', background: 'var(--color-slate-50)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-slate-200)' }}>
                        {['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => (
                            <FilterChip
                                key={type}
                                active={filterType === type}
                                onClick={() => setFilterType(type)}
                                label={type === 'All' ? t.allTypes : type}
                            />
                        ))}
                    </div>

                    {/* Source Filter */}
                    <div style={{ display: 'flex', background: 'var(--color-slate-50)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-slate-200)' }}>
                        <FilterChip active={filterSource === 'All'} onClick={() => setFilterSource('All')} label={t.allSources} />
                        <FilterChip active={filterSource === 'System'} onClick={() => setFilterSource('System')} label={t.systemOnly} icon={<Lock size={12} />} />
                        <FilterChip active={filterSource === 'Custom'} onClick={() => setFilterSource('Custom')} label={t.customOnly} icon={<Shield size={12} />} />
                    </div>

                    {(searchTerm || filterType !== 'All' || filterSource !== 'All') && (
                        <Button variant="ghost" icon={<RotateCcw size={14} />} onClick={resetFilters} size="sm" style={{ color: 'var(--color-danger-600)' }}>
                            {t.reset}
                        </Button>
                    )}
                </div>
            </div>

            {/* Redesigned Table */}
            <Card className="padding-none" style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                        <tr style={{ background: 'white', borderBottom: '2px solid var(--color-slate-100)' }}>
                            <th style={thStyle}>{t.colCode}</th>
                            <th style={thStyle}>{t.colName}</th>
                            <th style={thStyle}>{t.colType}</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>{t.colActions}</th>
                        </tr>
                    </thead>
                    <tbody style={{ background: 'white' }}>
                        {renderAccountTree()}
                        {filteredAccountIds.size === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                    <div style={{ opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Search size={48} />
                                        <p style={{ fontWeight: 600 }}>{language === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No matches found'}</p>
                                        <Button variant="outline" onClick={resetFilters}>{t.reset}</Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <Card className="padding-xl" style={{ width: '550px', maxWidth: '95%', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                {editingAccount ? t.modalEdit : t.modalAdd}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--color-slate-50)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label={language === 'ar' ? 'اسم الحساب' : "Display Name"}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={language === 'ar' ? 'مثال: مبيعات الخدمات' : "e.g. Sales Revenue"}
                                disabled={editingAccount?.isSystem}
                            />

                            {!editingAccount && (
                                <div style={selectWrapperStyle}>
                                    <label style={labelStyle}>{language === 'ar' ? 'تصنيف الحساب' : "Account Category"}</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        style={selectStyle}
                                    >
                                        {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!editingAccount && (
                                <div style={selectWrapperStyle}>
                                    <label style={labelStyle}>{language === 'ar' ? 'الحساب الأب' : "Parent Node"}</label>
                                    <select
                                        value={formData.parentCode}
                                        onChange={e => setFormData({ ...formData, parentCode: e.target.value })}
                                        style={selectStyle}
                                    >
                                        <option value="">{language === 'ar' ? 'حساب رئيسي (بدون أب)' : "Top Level (Root)"}</option>
                                        {accounts
                                            .filter(a => a.type === formData.type && a.isGroup)
                                            .sort((a, b) => a.code.localeCompare(b.code))
                                            .map(a => (
                                                <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <Input
                                label={language === 'ar' ? 'الوصف' : "Strategic Description"}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="..."
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.discard}</Button>
                                <Button icon={<Save size={18} />} onClick={handleSave} size="lg">
                                    {t.save}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

// Sub-components
const FilterChip = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--color-primary-600)' : 'var(--color-slate-500)',
            boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
    >
        {icon}
        {label}
    </button>
);

const thStyle = {
    padding: '1.25rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-slate-400)',
    textAlign: 'left'
};

const IconButton = ({ icon, color, onClick, title }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px', borderRadius: '8px',
            color: color, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        className="hover:bg-white hover:shadow-sm"
    >
        {React.cloneElement(icon, { size: 18, opacity: 0.8 })}
    </button>
);

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
};

const selectWrapperStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-700)' };
const selectStyle = {
    height: '3rem', padding: '0 1rem', borderRadius: '12px',
    border: '1px solid var(--color-slate-200)', appearance: 'none',
    background: 'var(--color-slate-50)', fontWeight: 500
};

export default ChartOfAccounts;
