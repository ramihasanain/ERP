import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { put } from '@/api';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import useCustomQuery from '@/hooks/useQuery';
import { ArrowLeft, Save } from 'lucide-react';
import translateApiError from '@/utils/translateApiError';
import RolePermissionMatrix from './RolePermissionMatrix';
import {
    applyGroupPermToggle,
    applyPermToggle,
    groupModulesByCategory,
    permsEqual,
    permsFromDetailRows,
    permissionsPayloadFromRolePerms,
} from './roleFormUtils';

/**
 * @param {{
 *   embedded?: boolean,
 *   roleSummary: { id: string, name?: string, description?: string, isSystem?: boolean },
 *   onClose: () => void,
 * }} props
 */
const EditRoleForm = ({ embedded = false, roleSummary, onClose }) => {
    const { t } = useTranslation(['permissions', 'common']);
    const queryClient = useQueryClient();
    const roleId = roleSummary.id;

    const [roleName, setRoleName] = useState(() => roleSummary.name ?? '');
    const [roleDesc, setRoleDesc] = useState(() => roleSummary.description ?? '');
    const [rolePerms, setRolePerms] = useState({});
    const [serverSnapshot, setServerSnapshot] = useState(null);

    const permInitTokenRef = useRef(null);

    const roleDetailQuery = useCustomQuery(
        `/api/roles/${roleId}/`,
        ['permissions', 'role-detail', roleId],
        { enabled: Boolean(roleId) },
    );

    const normalizedRoleModules = useMemo(() => {
        const perms = roleDetailQuery.data?.permissions;
        if (!Array.isArray(perms)) return [];
        return perms.map((p, idx) => ({
            id: p.module_id,
            key: p.module_key,
            label: p.module_name,
            category: p.category ?? '',
            order: idx,
        }));
    }, [roleDetailQuery.data]);

    const groupedRoleModules = useMemo(
        () => groupModulesByCategory(normalizedRoleModules),
        [normalizedRoleModules],
    );

    const saveRolePut = useMutation({
        mutationFn: ({ id, name, description, permissions }) => put(`/api/roles/${id}/`, { name, description, permissions }),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['permissions', 'roles'] });
            if (variables?.id) {
                await queryClient.invalidateQueries({ queryKey: ['permissions', 'role-detail', variables.id] });
            }
        },
    });

    useEffect(() => {
        permInitTokenRef.current = null;
    }, [roleId]);

    useEffect(() => {
        if (roleDetailQuery.isLoading || roleDetailQuery.isError) return;
        const perms = roleDetailQuery.data?.permissions;
        if (!Array.isArray(perms) || perms.length === 0) return;

        const token = `edit:${roleId}:${perms.map((p) => p.module_id).join(',')}`;
        if (permInitTokenRef.current === token) return;
        permInitTokenRef.current = token;

        const initial = permsFromDetailRows(perms);
        const d = roleDetailQuery.data;
        queueMicrotask(() => {
            setRolePerms(initial);
            setRoleName(d.name ?? '');
            setRoleDesc(d.description ?? '');
            setServerSnapshot({
                name: (d.name || '').trim(),
                description: d.description ?? '',
                perms: JSON.parse(JSON.stringify(initial)),
            });
        });
    }, [roleId, roleDetailQuery.isLoading, roleDetailQuery.isError, roleDetailQuery.data]);

    const togglePerm = useCallback((modId, permType) => {
        setRolePerms((prev) => ({
            ...prev,
            [modId]: applyPermToggle(prev[modId], permType),
        }));
    }, []);

    const toggleGroupAll = useCallback((group, permType) => {
        const mods = groupedRoleModules[group];
        if (!mods?.length) return;
        setRolePerms((prev) => applyGroupPermToggle(mods, prev, permType));
    }, [groupedRoleModules]);

    const isDirty = useMemo(() => {
        if (!serverSnapshot) return false;
        if (roleName.trim() !== serverSnapshot.name) return true;
        if ((roleDesc ?? '') !== serverSnapshot.description) return true;
        if (!permsEqual(rolePerms, serverSnapshot.perms)) return true;
        return false;
    }, [serverSnapshot, roleName, roleDesc, rolePerms]);

    const matrixLoading = roleDetailQuery.isLoading;
    const matrixError = roleDetailQuery.isError;
    const canSave = Boolean(
        roleName.trim()
        && normalizedRoleModules.length
        && !matrixLoading
        && !matrixError
        && isDirty
        && !saveRolePut.isPending,
    );

    const handleSave = async () => {
        if (!roleName.trim()) return;
        if (!normalizedRoleModules.length) {
            toast.error(t('rolePermsUnavailable'));
            return;
        }
        if (!isDirty) return;

        const permissions = permissionsPayloadFromRolePerms(normalizedRoleModules, rolePerms);
        try {
            await saveRolePut.mutateAsync({
                id: roleId,
                name: roleName.trim(),
                description: roleDesc,
                permissions,
            });
            toast.success(t('roleSavedToast'));
            onClose();
        } catch (e) {
            toast.error(translateApiError(e, 'permissions:roleSaveFailed'));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={onClose} />
                    <h2 style={{ fontSize: embedded ? '1.25rem' : '1.5rem', fontWeight: 700, margin: 0 }}>{t('editRole')}</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="ghost" onClick={onClose}>{t('common:actions.cancel')}</Button>
                    <Button
                        icon={<Save size={16} />}
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {t('saveRole')}
                    </Button>
                </div>
            </div>

            <Card className="padding-md">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <Input label={t('roleNameRequired')} value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder={t('roleNamePlaceholder')} />
                    <Input label={t('description')} value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder={t('descriptionPlaceholder')} />
                </div>
            </Card>

            <RolePermissionMatrix
                groupedRoleModules={groupedRoleModules}
                rolePerms={rolePerms}
                onTogglePerm={togglePerm}
                onToggleGroupAll={toggleGroupAll}
                matrixLoading={matrixLoading}
                matrixError={matrixError}
                matrixErrorObj={roleDetailQuery.error}
                matrixRefetch={() => roleDetailQuery.refetch()}
                matrixErrorTitle={t('matrix.roleLoadError')}
                matrixEmptyMessage={t('matrix.noPermissionRows')}
            />
        </div>
    );
};

export default EditRoleForm;
