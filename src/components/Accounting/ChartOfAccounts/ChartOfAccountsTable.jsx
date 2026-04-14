import React, { useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ChevronDown, ChevronRight, FileText, Folder, Lock, Search } from 'lucide-react';

const thStyle = {
    padding: '1.25rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-muted)',
    textAlign: 'left',
};

const highlightText = (text, highlight) => {
    const rawText = text || '';
    if (!highlight.trim()) return <span>{rawText}</span>;
    const parts = rawText.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark
                        key={`${part}-${index}`}
                        style={{
                            background: 'var(--color-warning)',
                            color: 'white',
                            borderRadius: '2px',
                            padding: '0 2px',
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                )
            )}
        </span>
    );
};

const ChartOfAccountsTable = ({
    t,
    language,
    nodes,
    searchTerm,
    expandedNodes,
    onToggleExpand,
    filteredAccountIds,
    isLoading,
    onResetFilters,
}) => {
    const [hoveredAccountId, setHoveredAccountId] = useState(null);

    const renderTree = (treeNodes, level = 0) => {
        return treeNodes
            .filter((node) => filteredAccountIds.has(node.id))
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((node) => {
                const hasVisibleChildren = node.children?.some((child) => filteredAccountIds.has(child.id));
                const isExpanded = expandedNodes.has(node.id) || Boolean(searchTerm);
                const depth = level;

                const rowBaseBg =
                    level === 0
                        ? 'color-mix(in srgb, var(--color-primary-600) 8%, var(--color-bg-card))'
                        : 'var(--color-bg-card)';

                const nameCardStyle = {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    paddingLeft: language === 'ar' ? 0 : `${depth * 2}rem`,
                    paddingRight: language === 'ar' ? `${depth * 2}rem` : 0,
                    position: 'relative',
                    minHeight: '3.5rem',
                };

                return (
                    <React.Fragment key={node.id}>
                        <tr
                            style={{
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'background 0.2s ease',
                                background:
                                    hoveredAccountId === node.id
                                        ? 'color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-card))'
                                        : rowBaseBg,
                            }}
                            onMouseEnter={() => setHoveredAccountId(node.id)}
                            onMouseLeave={() => setHoveredAccountId(null)}
                        >
                            <td style={{ padding: '0 1rem', width: '140px' }}>
                                <span
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--color-text-muted)',
                                        background: 'color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-card))',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {highlightText(node.code, searchTerm)}
                                </span>
                            </td>
                            <td style={{ padding: '0 1rem' }}>
                                <div style={nameCardStyle}>
                                    <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {hasVisibleChildren ? (
                                            <button
                                                onClick={() => onToggleExpand(node.id)}
                                                style={{
                                                    background: isExpanded
                                                        ? 'color-mix(in srgb, var(--color-primary-600) 20%, var(--color-bg-card))'
                                                        : 'var(--color-bg-surface)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px',
                                                    width: '24px',
                                                    height: '24px',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-primary-600)',
                                                }}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown size={14} />
                                                ) : language === 'ar' ? (
                                                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                                                ) : (
                                                    <ChevronRight size={14} />
                                                )}
                                            </button>
                                        ) : (
                                            <div style={{ width: '24px' }} />
                                        )}

                                        {node.isGroup ? (
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background:
                                                        level === 0
                                                            ? 'var(--color-primary-600)'
                                                            : 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-card))',
                                                    color: level === 0 ? '#fff' : 'var(--color-primary-500)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Folder size={18} />
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: 'color-mix(in srgb, var(--color-text-main) 10%, var(--color-bg-card))',
                                                    color: 'var(--color-text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <FileText size={18} />
                                            </div>
                                        )}

                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: level === 0 ? 700 : 600,
                                                    fontSize: level === 0 ? '0.9rem' : '0.85rem',
                                                    color: 'var(--color-text-main)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}
                                            >
                                                {node.isSystem && <Lock size={14} color="var(--color-error)" style={{ flexShrink: 0 }} />}
                                                <span>{highlightText(node.name, searchTerm)}</span>
                                            </div>
                                            {node.description ? (
                                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                    {node.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '0 1rem' }}>
                                <span
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.7rem',
                                        fontWeight: 650,
                                        background: 'color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-card))',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid currentColor',
                                        opacity: 0.7,
                                    }}
                                >
                                    {node.accountTypeLabel}
                                </span>
                            </td>
                        </tr>
                        {isExpanded && hasVisibleChildren ? renderTree(node.children, level + 1) : null}
                    </React.Fragment>
                );
            });
    };

    return (
        <Card className="padding-none" style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                    <tr style={{ background: 'var(--color-bg-card)', borderBottom: '2px solid var(--color-border)' }}>
                        <th style={thStyle}>{t.colCode}</th>
                        <th style={thStyle}>{t.colName}</th>
                        <th style={thStyle}>{t.colType}</th>
                    </tr>
                </thead>
                <tbody style={{ background: 'var(--color-bg-card)' }}>
                    {isLoading ? (
                        <tr>
                            <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                Loading accounts...
                            </td>
                        </tr>
                    ) : (
                        renderTree(nodes)
                    )}
                    {!isLoading && filteredAccountIds.size === 0 ? (
                        <tr>
                            <td colSpan="3" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Search size={48} />
                                    <p style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                        {language === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No matches found'}
                                    </p>
                                    <Button variant="outline" onClick={onResetFilters}>
                                        {t.reset}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </Card>
    );
};

export default ChartOfAccountsTable;
