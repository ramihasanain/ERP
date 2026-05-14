import React from 'react';
import { Edit3, Eye, FileText, Star, Trash2 } from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import { useBasePath } from '@/hooks/useBasePath';

const ContractTemplatesGrid = ({ templates, navigate, onDeleteClick }) => {
    const basePath = useBasePath();
    return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {templates.length === 0 && (
            <Card className="padding-lg" style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    No contract templates found.
                </p>
            </Card>
        )}
        {templates.map((template) => (
            <Card
                key={template.id}
                className="padding-lg"
                style={{
                    border: template.isDefault ? '2px solid var(--color-primary-300)' : undefined,
                    background: template.isDefault
                        ? 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))'
                        : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '3rem',
                                    height: '3rem',
                                    borderRadius: '12px',
                                    background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                                    color: 'var(--color-primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FileText size={22} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{template.name}</h3>
                                    {template.isDefault && <Star size={14} style={{ color: 'var(--color-warning)' }} fill="var(--color-warning)" />}
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: 'var(--color-bg-subtle)',
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: 500,
                                    }}
                                >
                                    {template.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Last modified:{' '}
                        <span dir="ltr" style={{ unicodeBidi: 'isolate', display: 'inline-block', textAlign: 'left' }}>
                            {template.lastModified}
                        </span>
                    </div>

                    <div
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'var(--color-bg-secondary)',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            maxHeight: '100px',
                            overflow: 'hidden',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5,
                            marginBottom: '1rem',
                            position: 'relative',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {(template.content || '').substring(0, 200)}...
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '40px',
                                background: 'linear-gradient(transparent, var(--color-bg-secondary))',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<Eye size={14} />}
                        onClick={() => navigate(`${basePath}/hr/contract-templates/${template.id}/preview`)}
                        style={{ flex: 1 }}
                    >
                        Preview
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<Edit3 size={14} />}
                        onClick={() => navigate(`${basePath}/hr/contract-templates/${template.id}/edit`)}
                        style={{ flex: 1 }}
                    >
                        Edit
                    </Button>
                    {!template.isDefault && (
                        <button
                            onClick={() => onDeleteClick(template)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '0 8px' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </Card>
        ))}
    </div>
    );
};

export default ContractTemplatesGrid;
