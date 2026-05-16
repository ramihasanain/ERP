import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3, FolderOpen, Trash2, UserPlus, Users, X } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import { statusColors } from './utils';

const ProjectsList = ({
    projects,
    isLoading,
    isError,
    isDeleting,
    isRemovingMember,
    onEdit,
    onDelete,
    onOpenAssignModal,
    onRemoveMember,
    getEmployeeName,
}) => {
    const { t } = useTranslation(['hr', 'common']);

    if (isLoading) return <Spinner />;

    if (isError) {
        return (
            <Card className="padding-lg" style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                Failed to load projects from API.
            </Card>
        );
    }

    if (projects.length === 0) {
        return (
            <Card className="padding-lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No projects found. Create your first project to get started.
            </Card>
        );
    }

    return (
        <>
            {projects.map((project) => (
                <Card key={project.id} className="padding-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                                <FolderOpen size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{project.name}</h3>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{project.client || 'No Client'}</span>
                                    <span
                                        style={{
                                            padding: '2px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: statusColors[project.status]?.bg || 'var(--color-bg-subtle)',
                                            color: statusColors[project.status]?.color || 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {project.status}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {project.startDate} → {project.endDate || 'Ongoing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="outline" icon={<UserPlus size={14} />} onClick={() => onOpenAssignModal(project.id)}>
                                Assign
                            </Button>
                            <button onClick={() => onEdit(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}>
                                <Edit3 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(project.id)}
                                disabled={isDeleting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {project.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>{project.description}</p>
                    )}

                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                Team ({project.assignedEmployees.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {project.assignedEmployees.map((assigned) => (
                                <div
                                    key={assigned.memberId || assigned.employeeId}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        background: 'var(--color-bg-subtle)',
                                        fontSize: '0.8rem',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                        {assigned.employeeName || getEmployeeName(assigned.employeeId)}
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>({assigned.role})</span>
                                    <button
                                        onClick={() => onRemoveMember(project.id, assigned.memberId)}
                                        disabled={!assigned.memberId || isRemovingMember}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-error)',
                                            padding: 0,
                                            display: 'flex',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {project.assignedEmployees.length === 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    No team members assigned yet.
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </>
    );
};

export default ProjectsList;
