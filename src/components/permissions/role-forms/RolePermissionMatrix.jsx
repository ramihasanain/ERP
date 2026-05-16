import React from 'react';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import { Eye, Pencil, Trash, Check, Plus } from 'lucide-react';
import { PERM_ACTIONS } from './roleFormUtils';

const permColor = {
    view: 'var(--color-primary-600)',
    add: 'var(--color-success)',
    edit: 'var(--color-warning)',
    delete: 'var(--color-error)',
};
const permIcon = {
    view: <Eye size={12} />,
    add: <Plus size={12} />,
    edit: <Pencil size={12} />,
    delete: <Trash size={12} />,
};

const checkboxStyle = (checked) => ({
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '4px',
    cursor: 'pointer',
    border: checked ? 'none' : '2px solid var(--color-border)',
    background: checked ? 'var(--color-primary-600)' : 'var(--color-bg-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
});

/**
 * @param {{
 *   groupedRoleModules: Record<string, Array<{ id: string, label: string }>>,
 *   rolePerms: Record<string, { view?: boolean, add?: boolean, edit?: boolean, delete?: boolean }>,
 *   onTogglePerm: (modId: string, permType: 'view'|'add'|'edit'|'delete') => void,
 *   onToggleGroupAll: (group: string, permType: 'view'|'add'|'edit'|'delete') => void,
 *   matrixLoading: boolean,
 *   matrixError: boolean,
 *   matrixErrorObj: unknown,
 *   matrixRefetch: () => void,
 *   matrixErrorTitle: string,
 *   matrixEmptyMessage: string,
 * }} props
 */
const RolePermissionMatrix = ({
    groupedRoleModules,
    rolePerms,
    onTogglePerm,
    onToggleGroupAll,
    matrixLoading,
    matrixError,
    matrixErrorObj,
    matrixRefetch,
    matrixErrorTitle,
    matrixEmptyMessage,
}) => {
    const normalizedRoleModules = Object.values(groupedRoleModules).flat();
    const hasRows = normalizedRoleModules.length > 0;

    return (
        <Card className="padding-none">
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontWeight: 700, margin: 0 }}>Permission Matrix</h3>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                    {PERM_ACTIONS.map((p) => (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: permColor[p] }}>
                            {permIcon[p]} <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                {matrixLoading && (
                    <div style={{ padding: '2rem' }}>
                        <Spinner />
                    </div>
                )}
                {matrixError && !matrixLoading && (
                    <div style={{ padding: '1rem 1.5rem' }}>
                        <ResourceLoadError
                            error={matrixErrorObj}
                            title={matrixErrorTitle}
                            onRefresh={() => matrixRefetch()}
                            refreshLabel="Try again"
                        />
                    </div>
                )}
                {!matrixLoading && !matrixError && !hasRows && (
                    <div style={{ padding: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {matrixEmptyMessage}
                    </div>
                )}
                {!matrixLoading && !matrixError && hasRows && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-table-header)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '10px 1.5rem', textAlign: 'left', width: '40%' }}>Module</th>
                                {PERM_ACTIONS.map((p) => (
                                    <th key={p} style={{ padding: '10px 1rem', textAlign: 'center', width: '15%' }}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedRoleModules).map(([group, mods]) => (
                                <React.Fragment key={group}>
                                    <tr style={{ background: 'color-mix(in srgb, var(--color-primary-600) 10%, var(--color-bg-subtle))' }}>
                                        <td style={{ padding: '8px 1.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-600)' }}>
                                            {group}
                                        </td>
                                        {PERM_ACTIONS.map((p) => {
                                            const allChecked = mods.every((m) => rolePerms[m.id]?.[p]);
                                            return (
                                                <td key={p} style={{ padding: '8px 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <div onClick={() => onToggleGroupAll(group, p)} style={checkboxStyle(allChecked)} role="presentation">
                                                            {allChecked && <Check size={14} color="white" />}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {mods.map((mod) => (
                                        <tr key={mod.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '8px 1.5rem 8px 2.5rem', fontSize: '0.85rem' }}>{mod.label}</td>
                                            {PERM_ACTIONS.map((p) => (
                                                <td key={p} style={{ padding: '8px 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <div onClick={() => onTogglePerm(mod.id, p)} style={checkboxStyle(rolePerms[mod.id]?.[p])} role="presentation">
                                                            {rolePerms[mod.id]?.[p] && <Check size={14} color="white" />}
                                                        </div>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Card>
    );
};

export default RolePermissionMatrix;
