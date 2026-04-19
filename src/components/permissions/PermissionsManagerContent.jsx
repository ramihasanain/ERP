import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Shared/Button';
import EditRoleForm from '@/components/permissions/role-forms/EditRoleForm';
import AddRoleForm from '@/components/permissions/role-forms/AddRoleForm';
import PermissionsRolesTab from '@/components/permissions/PermissionsRolesTab';
import PermissionsEmployeeAssignmentsTab from '@/components/permissions/PermissionsEmployeeAssignmentsTab';
import {
    ArrowLeft,
    Plus,
    Shield,
    Users,
} from 'lucide-react';

const innerTabs = [
    { id: 'roles', label: 'Roles', icon: <Shield size={18} /> },
    { id: 'assign', label: 'Employee Assignments', icon: <Users size={18} /> },
];

/**
 * Permissions & roles UI. Used from Settings (embedded) and from /admin/permissions (full page).
 * @param {{ embedded?: boolean }} props — embedded: no back-to-settings chrome; fits under Settings tabs.
 */
const PermissionsManagerContent = ({ embedded = false }) => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('roles');

    /** `null` list view; `{ id }` edit; `{ id: null }` new role draft */
    const [editingRole, setEditingRole] = useState(null);

    const handleEditRole = (role) => {
        setEditingRole({
            id: role.id,
            name: role.name,
            description: role.description ?? '',
            isSystem: role.isSystem ?? role.is_system ?? false,
        });
    };

    const handleNewRole = () => {
        setEditingRole({ id: null });
    };

    if (editingRole?.id) {
        return (
            <EditRoleForm
                embedded={embedded}
                roleSummary={editingRole}
                onClose={() => setEditingRole(null)}
            />
        );
    }

    if (editingRole) {
        return (
            <AddRoleForm
                embedded={embedded}
                onClose={() => setEditingRole(null)}
            />
        );
    }

    const titleSize = embedded ? '1.25rem' : '1.5rem';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    {!embedded && (
                        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/settings')} />
                    )}
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: titleSize, fontWeight: 700, margin: 0 }}>Permissions & Roles</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>Manage access control for employees.</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={handleNewRole}>New Role</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', minWidth: 0 }}>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <div
                        role="tablist"
                        aria-label="Permissions sections"
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-end',
                            gap: '0.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            minWidth: 'min-content',
                        }}
                    >
                        {innerTabs.map((tab) => {
                            const selected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    id={`permissions-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls={`permissions-panel-${tab.id}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem 0.625rem',
                                        marginBottom: '-1px',
                                        border: 'none',
                                        borderBottom: selected
                                            ? '3px solid var(--color-primary-500)'
                                            : '3px solid transparent',
                                        background: 'transparent',
                                        color: selected ? 'var(--color-primary-500)' : 'var(--color-text-secondary)',
                                        fontWeight: selected ? 600 : 500,
                                        fontSize: '0.9375rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div
                        role="tabpanel"
                        id="permissions-panel-roles"
                        aria-labelledby="permissions-tab-roles"
                        hidden={activeTab !== 'roles'}
                        style={{ minWidth: 0 }}
                    >
                        <PermissionsRolesTab onEditRole={handleEditRole} />
                    </div>

                    <div
                        role="tabpanel"
                        id="permissions-panel-assign"
                        aria-labelledby="permissions-tab-assign"
                        hidden={activeTab !== 'assign'}
                        style={{ minWidth: 0 }}
                    >
                        <PermissionsEmployeeAssignmentsTab enabled={activeTab === 'assign'} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionsManagerContent;
