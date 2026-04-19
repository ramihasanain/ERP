import React, { useMemo, useState } from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { usePermissions } from '@/context/PermissionsContext';
import useCustomQuery from '@/hooks/useQuery';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import Pagination from '@/core/Pagination';
import { Shield, Edit3, Trash2, Users, Eye, Pencil, Trash } from 'lucide-react';

const PAGE_SIZE = 15;

const rolesListFromPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

/** When GET /api/roles/ returns `permissions` as an array of { module_key, can_* }. */
const statsFromPermissionArray = (permissions) => {
    if (!Array.isArray(permissions)) return null;
    let view = 0;
    let edit = 0;
    let del = 0;
    for (const p of permissions) {
        if (p?.can_view) view += 1;
        if (p?.can_edit) edit += 1;
        if (p?.can_delete) del += 1;
    }
    return {
        view,
        edit,
        delete: del,
        totalFlags: view + edit + del,
        moduleCount: permissions.length,
    };
};

/**
 * @param {{ onEditRole: (role: object) => void }} props
 */
const PermissionsRolesTab = ({ onEditRole }) => {
    const { systemModules, deleteRole, getEmployeesWithRole } = usePermissions();
    const rolesQuery = useCustomQuery('/api/roles/', ['permissions', 'roles']);
    const apiRoles = useMemo(() => rolesListFromPayload(rolesQuery.data), [rolesQuery.data]);
    const [rolesPage, setRolesPage] = useState(1);

    const rolesTotalPages = Math.max(1, Math.ceil(apiRoles.length / PAGE_SIZE));
    const rolesCurrentPage = Math.min(rolesPage, rolesTotalPages);
    const paginatedRoles = useMemo(() => {
        const start = (rolesCurrentPage - 1) * PAGE_SIZE;
        return apiRoles.slice(start, start + PAGE_SIZE);
    }, [apiRoles, rolesCurrentPage]);

    const permColor = { view: 'var(--color-primary-600)', edit: 'var(--color-warning)', delete: 'var(--color-error)' };
    const permTintBg = {
        view: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))',
        edit: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))',
        delete: 'color-mix(in srgb, var(--color-error) 18%, var(--color-bg-card))',
    };
    const permIcon = { view: <Eye size={12} />, edit: <Pencil size={12} />, delete: <Trash size={12} /> };

    if (rolesQuery.isLoading) {
        return <Spinner />;
    }

    if (rolesQuery.isError) {
        return (
            <ResourceLoadError
                error={rolesQuery.error}
                title="Roles could not be loaded"
                onRefresh={() => rolesQuery.refetch()}
                refreshLabel="Try again"
            />
        );
    }

    if (apiRoles.length === 0) {
        return (
            <Card className="padding-lg" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                No roles returned from the server.
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
                {paginatedRoles.map((role) => {
                    const isSystem = Boolean(role.is_system);
                    const counts = role.counts;
                    const arrStats = statsFromPermissionArray(role.permissions);
                    const assignedCount = typeof role.users_count === 'number'
                        ? role.users_count
                        : getEmployeesWithRole(role.id).length;
                    const totalPerms = counts
                        ? (Number(counts.view) || 0) + (Number(counts.edit) || 0) + (Number(counts.delete) || 0)
                        : arrStats
                            ? arrStats.totalFlags
                            : systemModules.reduce((sum, m) => (
                                sum
                                + (role.permissions?.[m.id]?.view ? 1 : 0)
                                + (role.permissions?.[m.id]?.edit ? 1 : 0)
                                + (role.permissions?.[m.id]?.delete ? 1 : 0)
                            ), 0);
                    const maxPerms = counts?.total != null
                        ? Number(counts.total) || 1
                        : arrStats
                            ? Math.max(1, arrStats.moduleCount * 3)
                            : systemModules.length * 3;
                    const pct = maxPerms > 0 ? (totalPerms / maxPerms) * 100 : 0;

                    return (
                        <Card
                            key={role.id}
                            className="padding-lg"
                            style={{
                                border: isSystem ? '2px solid var(--color-primary-300)' : undefined,
                                background: isSystem ? 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))' : undefined,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                minHeight: '100%',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '2.75rem',
                                            height: '2.75rem',
                                            borderRadius: '12px',
                                            background: isSystem ? 'var(--color-primary-600)' : 'var(--color-bg-subtle)',
                                            color: isSystem ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        >
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{role.name}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>{role.description}</p>
                                        </div>
                                    </div>
                                    {isSystem && (
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '8px', background: 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))', color: 'var(--color-primary-600)', fontWeight: 600, height: 'fit-content' }}>SYSTEM</span>
                                    )}
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                        <span>Permissions</span>
                                        <span>{totalPerms}/{maxPerms}</span>
                                    </div>
                                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: '3px', background: 'var(--color-primary-500)', width: `${pct}%`, transition: 'width 0.3s' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {['view', 'edit', 'delete'].map((p) => {
                                        const count = counts
                                            ? (Number(counts[p]) || 0)
                                            : arrStats
                                                ? arrStats[p]
                                                : systemModules.filter(m => role.permissions?.[m.id]?.[p]).length;
                                        return (
                                            <span key={p} style={{
                                                fontSize: '0.7rem',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: count > 0 ? permTintBg[p] : 'var(--color-bg-subtle)',
                                                color: count > 0 ? permColor[p] : 'var(--color-text-muted)',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                            }}
                                            >
                                                {permIcon[p]} {p}: {count}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{
                                marginTop: 'auto',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--color-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                            }}
                            >
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                    {assignedCount} employee{assignedCount !== 1 ? 's' : ''}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        icon={<Edit3 size={14} />}
                                        onClick={() => onEditRole(role)}
                                        disabled={isSystem}
                                        title={isSystem ? 'System roles cannot be edited' : undefined}
                                    >
                                        Edit
                                    </Button>
                                    {!isSystem && (
                                        <button type="button" onClick={() => deleteRole(role.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <Pagination
                currentPage={rolesCurrentPage}
                count={apiRoles.length}
                onPageChange={setRolesPage}
                pageSize={PAGE_SIZE}
            />
        </div>
    );
};

export default PermissionsRolesTab;
