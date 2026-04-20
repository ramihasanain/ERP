import React from 'react';
import { Plus, Search } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';

const FILTERS = ['All', 'Active', 'On Hold', 'Completed'];

const ProjectsHeaderFilters = ({
    searchTerm,
    onSearchTermChange,
    filterStatus,
    onFilterStatusChange,
    onCreateProject,
}) => (
    <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Projects Management</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Manage projects and assign team members.
                </p>
            </div>
            <Button icon={<Plus size={18} />} onClick={onCreateProject}>
                New Project
            </Button>
        </div>

        <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search
                    style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-slate-400)',
                    }}
                    size={18}
                />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.9rem',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)',
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    background: 'var(--color-bg-toggle-track)',
                    padding: '4px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                }}
            >
                {FILTERS.map((status) => (
                    <button
                        key={status}
                        onClick={() => onFilterStatusChange(status)}
                        style={{
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '6px',
                            background: filterStatus === status ? 'var(--color-bg-surface)' : 'transparent',
                            boxShadow: filterStatus === status ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                            color: filterStatus === status ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </Card>
    </>
);

export default ProjectsHeaderFilters;
