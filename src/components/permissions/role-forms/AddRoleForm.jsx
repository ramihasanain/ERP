import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { ArrowLeft, Save } from 'lucide-react';
import RolePermissionMatrix from './RolePermissionMatrix';
import {
    emptyPermsForModules,
    groupModulesByCategory,
    modulesListFromPayload,
} from './roleFormUtils';

/**
 * @param {{
 *   embedded?: boolean,
 *   onClose: () => void,
 * }} props
 */
const AddRoleForm = ({ embedded = false, onClose }) => {
    const createRole = useCustomPost('/api/roles/', [['permissions', 'roles']]);

    const [roleName, setRoleName] = useState('');
    const [roleDesc, setRoleDesc] = useState('');
    const [rolePerms, setRolePerms] = useState({});

    const permInitTokenRef = useRef(null);

    const modulesQuery = useCustomQuery('/api/roles/modules/', ['permissions', 'role-modules'], {
        enabled: true,
    });

    const normalizedRoleModules = useMemo(
        () => modulesListFromPayload(modulesQuery.data).map((m) => ({
            id: m.id,
            key: m.key,
            label: m.name,
            category: m.category ?? '',
            order: Number(m.order) || 0,
        })),
        [modulesQuery.data],
    );

    const groupedRoleModules = useMemo(
        () => groupModulesByCategory(normalizedRoleModules),
        [normalizedRoleModules],
    );

    useEffect(() => {
        if (modulesQuery.isLoading || modulesQuery.isError) return;
        const modulesRaw = modulesListFromPayload(modulesQuery.data);
        if (modulesRaw.length === 0) return;

        const token = `new:${modulesRaw.map((m) => m.id).join(',')}`;
        if (permInitTokenRef.current === token) return;
        permInitTokenRef.current = token;

        const apiMods = modulesRaw.map((m) => ({
            id: m.id,
            key: m.key,
            label: m.name,
            category: m.category ?? '',
            order: Number(m.order) || 0,
        }));
        queueMicrotask(() => {
            setRolePerms(emptyPermsForModules(apiMods));
        });
    }, [modulesQuery.isLoading, modulesQuery.isError, modulesQuery.data]);

    const togglePerm = useCallback((modId, permType) => {
        setRolePerms((prev) => ({
            ...prev,
            [modId]: {
                ...prev[modId],
                [permType]: !prev[modId]?.[permType],
                ...(permType !== 'view' && !prev[modId]?.[permType] ? { view: true } : {}),
                ...(permType === 'view' && prev[modId]?.view ? { edit: false, delete: false } : {}),
            },
        }));
    }, []);

    const toggleGroupAll = useCallback((group, permType) => {
        const mods = groupedRoleModules[group];
        if (!mods?.length) return;
        setRolePerms((prev) => {
            const allEnabled = mods.every((m) => prev[m.id]?.[permType]);
            const next = { ...prev };
            mods.forEach((m) => {
                next[m.id] = { ...next[m.id], [permType]: !allEnabled };
                if (permType !== 'view' && !allEnabled) next[m.id].view = true;
                if (permType === 'view' && allEnabled) {
                    next[m.id].edit = false;
                    next[m.id].delete = false;
                }
            });
            return next;
        });
    }, [groupedRoleModules]);

    const matrixLoading = modulesQuery.isLoading;
    const matrixError = modulesQuery.isError;
    const canSave = Boolean(
        roleName.trim()
        && normalizedRoleModules.length
        && !matrixLoading
        && !matrixError
        && !createRole.isPending,
    );

    const handleSave = async () => {
        if (!roleName.trim()) return;
        if (!normalizedRoleModules.length) {
            toast.error('Role permissions are still loading or unavailable.');
            return;
        }

        const permissions = normalizedRoleModules.map((m) => ({
            module_key: m.key,
            can_view: Boolean(rolePerms[m.id]?.view),
            can_edit: Boolean(rolePerms[m.id]?.edit),
            can_delete: Boolean(rolePerms[m.id]?.delete),
        }));

        try {
            await createRole.mutateAsync({
                name: roleName.trim(),
                description: roleDesc ?? '',
                permissions,
            });
            toast.success('Role created');
            onClose();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not create role'));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={onClose} />
                    <h2 style={{ fontSize: embedded ? '1.25rem' : '1.5rem', fontWeight: 700, margin: 0 }}>New Role</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        icon={<Save size={16} />}
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        Save Role
                    </Button>
                </div>
            </div>

            <Card className="padding-md">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <Input label="Role Name *" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Finance Manager" />
                    <Input label="Description" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Brief description of this role" />
                </div>
            </Card>

            <RolePermissionMatrix
                groupedRoleModules={groupedRoleModules}
                rolePerms={rolePerms}
                onTogglePerm={togglePerm}
                onToggleGroupAll={toggleGroupAll}
                matrixLoading={matrixLoading}
                matrixError={matrixError}
                matrixErrorObj={modulesQuery.error}
                matrixRefetch={() => modulesQuery.refetch()}
                matrixErrorTitle="Modules could not be loaded"
                matrixEmptyMessage="No modules returned from the server."
            />
        </div>
    );
};

export default AddRoleForm;
