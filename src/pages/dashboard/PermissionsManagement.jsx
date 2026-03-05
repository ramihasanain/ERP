import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { usePermissions } from '../../context/PermissionsContext';
import { useHR } from '../../context/HRContext';
import { ArrowLeft, Plus, Shield, Edit3, Trash2, Save, X, Users, Eye, Pencil, Trash, Check, UserPlus } from 'lucide-react';

const PermissionsManagement = () => {
    const navigate = useNavigate();
    const { roles, systemModules, addRole, updateRole, deleteRole, assignRole, removeRole, employeeRoles, getEmployeesWithRole } = usePermissions();
    const { employees } = useHR();

    const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'assign'
    const [editingRole, setEditingRole] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [roleDesc, setRoleDesc] = useState('');
    const [rolePerms, setRolePerms] = useState({});

    // Group modules by group
    const groupedModules = systemModules.reduce((acc, mod) => {
        if (!acc[mod.group]) acc[mod.group] = [];
        acc[mod.group].push(mod);
        return acc;
    }, {});

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleName(role.name);
        setRoleDesc(role.description);
        setRolePerms(JSON.parse(JSON.stringify(role.permissions)));
    };

    const handleNewRole = () => {
        setEditingRole({ id: null });
        setRoleName('');
        setRoleDesc('');
        setRolePerms(systemModules.reduce((acc, mod) => {
            acc[mod.id] = { view: false, edit: false, delete: false };
            return acc;
        }, {}));
    };

    const handleSaveRole = () => {
        if (!roleName.trim()) return;
        if (editingRole?.id) {
            updateRole(editingRole.id, { name: roleName, description: roleDesc, permissions: rolePerms });
        } else {
            addRole({ name: roleName, description: roleDesc, permissions: rolePerms });
        }
        setEditingRole(null);
    };

    const togglePerm = (modId, permType) => {
        setRolePerms(prev => ({
            ...prev,
            [modId]: {
                ...prev[modId],
                [permType]: !prev[modId]?.[permType],
                // If enabling edit/delete, auto-enable view
                ...(permType !== 'view' && !prev[modId]?.[permType] ? { view: true } : {}),
                // If disabling view, disable all
                ...(permType === 'view' && prev[modId]?.view ? { edit: false, delete: false } : {})
            }
        }));
    };

    const toggleGroupAll = (group, permType) => {
        const mods = groupedModules[group];
        const allEnabled = mods.every(m => rolePerms[m.id]?.[permType]);
        setRolePerms(prev => {
            const next = { ...prev };
            mods.forEach(m => {
                next[m.id] = { ...next[m.id], [permType]: !allEnabled };
                if (permType !== 'view' && !allEnabled) next[m.id].view = true;
                if (permType === 'view' && allEnabled) { next[m.id].edit = false; next[m.id].delete = false; }
            });
            return next;
        });
    };

    const checkboxStyle = (checked) => ({
        width: '1.25rem', height: '1.25rem', borderRadius: '4px', cursor: 'pointer',
        border: checked ? 'none' : '2px solid var(--color-border)',
        background: checked ? 'var(--color-primary-600)' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    });

    const permColor = { view: 'var(--color-primary-600)', edit: 'var(--color-warning)', delete: 'var(--color-error)' };
    const permIcon = { view: <Eye size={12} />, edit: <Pencil size={12} />, delete: <Trash size={12} /> };

    // ---- ROLE EDITOR ----
    if (editingRole) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => setEditingRole(null)} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingRole.id ? 'Edit Role' : 'New Role'}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button variant="ghost" onClick={() => setEditingRole(null)}>Cancel</Button>
                        <Button icon={<Save size={16} />} onClick={handleSaveRole}>Save Role</Button>
                    </div>
                </div>

                <Card className="padding-md">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <Input label="Role Name *" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Finance Manager" />
                        <Input label="Description" value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Brief description of this role" />
                    </div>
                </Card>

                {/* Permission Matrix */}
                <Card className="padding-none">
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700 }}>Permission Matrix</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                            {['view', 'edit', 'delete'].map(p => (
                                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: permColor[p] }}>
                                    {permIcon[p]} <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-slate-50)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '10px 1.5rem', textAlign: 'left', width: '40%' }}>Module</th>
                                <th style={{ padding: '10px 1rem', textAlign: 'center', width: '20%' }}>View</th>
                                <th style={{ padding: '10px 1rem', textAlign: 'center', width: '20%' }}>Edit</th>
                                <th style={{ padding: '10px 1rem', textAlign: 'center', width: '20%' }}>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedModules).map(([group, mods]) => (
                                <React.Fragment key={group}>
                                    <tr style={{ background: 'var(--color-primary-50)' }}>
                                        <td style={{ padding: '8px 1.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-700)' }}>
                                            {group}
                                        </td>
                                        {['view', 'edit', 'delete'].map(p => {
                                            const allChecked = mods.every(m => rolePerms[m.id]?.[p]);
                                            return (
                                                <td key={p} style={{ padding: '8px 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <div onClick={() => toggleGroupAll(group, p)} style={checkboxStyle(allChecked)}>
                                                            {allChecked && <Check size={14} color="white" />}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {mods.map(mod => (
                                        <tr key={mod.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '8px 1.5rem 8px 2.5rem', fontSize: '0.85rem' }}>{mod.label}</td>
                                            {['view', 'edit', 'delete'].map(p => (
                                                <td key={p} style={{ padding: '8px 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <div onClick={() => togglePerm(mod.id, p)} style={checkboxStyle(rolePerms[mod.id]?.[p])}>
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
                </Card>
            </div>
        );
    }

    // ---- MAIN VIEW ----
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/settings')} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Permissions & Roles</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Manage access control for employees.</p>
                    </div>
                </div>
                <Button icon={<Plus size={18} />} onClick={handleNewRole}>New Role</Button>
            </div>

            {/* Tab Switches */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)' }}>
                {[{ id: 'roles', label: 'Roles', icon: <Shield size={16} /> }, { id: 'assign', label: 'Employee Assignments', icon: <Users size={16} /> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer',
                        borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                        color: activeTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                        fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '-2px'
                    }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {roles.map(role => {
                        const assignedCount = getEmployeesWithRole(role.id).length;
                        const totalPerms = systemModules.reduce((sum, m) => {
                            return sum + (role.permissions[m.id]?.view ? 1 : 0) + (role.permissions[m.id]?.edit ? 1 : 0) + (role.permissions[m.id]?.delete ? 1 : 0);
                        }, 0);
                        const maxPerms = systemModules.length * 3;

                        return (
                            <Card key={role.id} className="padding-lg" style={{
                                border: role.isSystem ? '2px solid var(--color-primary-300)' : undefined,
                                background: role.isSystem ? 'linear-gradient(to bottom right, white, var(--color-primary-50))' : undefined
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                                            background: role.isSystem ? 'var(--color-primary-600)' : 'var(--color-slate-100)',
                                            color: role.isSystem ? 'white' : 'var(--color-slate-600)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{role.name}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{role.description}</p>
                                        </div>
                                    </div>
                                    {role.isSystem && (
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '8px', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', fontWeight: 600, height: 'fit-content' }}>SYSTEM</span>
                                    )}
                                </div>

                                {/* Permission bar */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                        <span>Permissions</span>
                                        <span>{totalPerms}/{maxPerms}</span>
                                    </div>
                                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-slate-100)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: '3px', background: 'var(--color-primary-500)', width: `${(totalPerms / maxPerms) * 100}%`, transition: 'width 0.3s' }} />
                                    </div>
                                </div>

                                {/* Quick summary */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    {['view', 'edit', 'delete'].map(p => {
                                        const count = systemModules.filter(m => role.permissions[m.id]?.[p]).length;
                                        return (
                                            <span key={p} style={{
                                                fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px',
                                                background: count > 0 ? `${permColor[p]}15` : 'var(--color-slate-50)',
                                                color: count > 0 ? permColor[p] : 'var(--color-text-muted)',
                                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem'
                                            }}>
                                                {permIcon[p]} {p}: {count}
                                            </span>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                        {assignedCount} employee{assignedCount !== 1 ? 's' : ''}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button size="sm" variant="outline" icon={<Edit3 size={14} />} onClick={() => handleEditRole(role)}>Edit</Button>
                                        {!role.isSystem && (
                                            <button onClick={() => deleteRole(role.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ASSIGN TAB */}
            {activeTab === 'assign' && (
                <Card className="padding-none">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-slate-50)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '12px 1.5rem', textAlign: 'left' }}>Employee</th>
                                <th style={{ padding: '12px 1rem', textAlign: 'left' }}>Department</th>
                                <th style={{ padding: '12px 1rem', textAlign: 'left' }}>Current Role</th>
                                <th style={{ padding: '12px 1.5rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.filter(e => e.status === 'Active').map(emp => {
                                const currentRoleId = employeeRoles[emp.id];
                                const currentRole = roles.find(r => r.id === currentRoleId);
                                return (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '2rem', height: '2rem', borderRadius: '50%',
                                                    background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 600, fontSize: '0.75rem'
                                                }}>
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.firstName} {emp.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{emp.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {emp.departmentId || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 1rem' }}>
                                            <select
                                                value={currentRoleId || ''}
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        assignRole(emp.id, e.target.value);
                                                    } else {
                                                        removeRole(emp.id);
                                                    }
                                                }}
                                                style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                                    fontSize: '0.85rem', fontWeight: currentRoleId ? 600 : 400,
                                                    color: currentRoleId ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                                                    background: currentRoleId ? 'var(--color-primary-50)' : 'white',
                                                    width: '200px'
                                                }}
                                            >
                                                <option value="">No role assigned</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px 1.5rem', textAlign: 'right' }}>
                                            {currentRole && (
                                                <span style={{
                                                    fontSize: '0.7rem', padding: '3px 10px', borderRadius: '10px',
                                                    background: currentRole.isSystem ? 'var(--color-primary-100)' : 'var(--color-slate-100)',
                                                    color: currentRole.isSystem ? 'var(--color-primary-700)' : 'var(--color-slate-600)',
                                                    fontWeight: 600
                                                }}>
                                                    {Object.values(currentRole.permissions).filter(p => p.view).length} modules
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

export default PermissionsManagement;
