import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';
import translateApiError from '@/utils/translateApiError';
import { getPermissionsList } from '@/services/auth';
import { ArrowLeft, Save } from 'lucide-react';
import RolePermissionMatrix from './RolePermissionMatrix';
import {
    applyGroupPermToggle,
    applyPermToggle,
    emptyPermsForModules,
    groupModulesByCategory,
    modulesFromPermissionsList,
    modulesListFromPayload,
    permissionsPayloadFromRolePerms,
} from './roleFormUtils';

/**
 * @param {{
 *   embedded?: boolean,
 *   onClose: () => void,
 * }} props
 */
const AddRoleForm = ({ embedded = false, onClose }) => {
    const { t } = useTranslation(['permissions', 'common']);
    const createRole = useCustomPost('/api/roles/', [['permissions', 'roles']]);

    const [roleName, setRoleName] = useState('');
    const [roleDesc, setRoleDesc] = useState('');
    const [rolePerms, setRolePerms] = useState({});

    const permInitTokenRef = useRef(null);

    const permissionsListCatalog = useMemo(() => getPermissionsList(), []);
    const fromPermissionsList = useMemo(
        () => modulesFromPermissionsList(permissionsListCatalog),
        [permissionsListCatalog],
    );
    const usePermissionsListCatalog = fromPermissionsList.modules.length > 0;

    const modulesQuery = useCustomQuery('/api/roles/modules/', ['permissions', 'role-modules'], {
        enabled: !usePermissionsListCatalog,
    });

    const normalizedRoleModules = useMemo(() => {
        if (fromPermissionsList.modules.length > 0) {
            return fromPermissionsList.modules;
        }
        return modulesListFromPayload(modulesQuery.data).map((m) => ({
            id: m.id,
            key: m.key,
            label: m.name,
            category: m.category ?? '',
            order: Number(m.order) || 0,
        }));
    }, [fromPermissionsList.modules, modulesQuery.data]);

    const groupedRoleModules = useMemo(
        () => groupModulesByCategory(normalizedRoleModules),
        [normalizedRoleModules],
    );

    useEffect(() => {
        if (!usePermissionsListCatalog && (modulesQuery.isLoading || modulesQuery.isError)) return;

        const modulesRaw = usePermissionsListCatalog
            ? fromPermissionsList.modules
            : modulesListFromPayload(modulesQuery.data);
        if (modulesRaw.length === 0) return;

        const token = `new:${modulesRaw.map((m) => m.id).join(',')}`;
        if (permInitTokenRef.current === token) return;
        permInitTokenRef.current = token;

        const apiMods = usePermissionsListCatalog
            ? modulesRaw
            : modulesRaw.map((m) => ({
                id: m.id,
                key: m.key,
                label: m.name,
                category: m.category ?? '',
                order: Number(m.order) || 0,
            }));

        queueMicrotask(() => {
            setRolePerms(emptyPermsForModules(apiMods));
        });
    }, [
        usePermissionsListCatalog,
        fromPermissionsList.modules,
        modulesQuery.isLoading,
        modulesQuery.isError,
        modulesQuery.data,
    ]);

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

    const matrixLoading = usePermissionsListCatalog ? false : modulesQuery.isLoading;
    const matrixError = usePermissionsListCatalog ? false : modulesQuery.isError;
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
            toast.error(t('rolePermsUnavailable'));
            return;
        }

        const permissions = permissionsPayloadFromRolePerms(normalizedRoleModules, rolePerms);

        try {
            await createRole.mutateAsync({
                name: roleName.trim(),
                description: roleDesc ?? '',
                permissions,
            });
            toast.success(t('roleCreatedToast'));
            onClose();
        } catch (e) {
            toast.error(translateApiError(e, 'permissions:roleCreateFailed'));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={onClose} />
                    <h2 style={{ fontSize: embedded ? '1.25rem' : '1.5rem', fontWeight: 700, margin: 0 }}>{t('newRole')}</h2>
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
                matrixErrorObj={modulesQuery.error}
                matrixRefetch={() => modulesQuery.refetch()}
                matrixErrorTitle={t('matrix.modulesLoadError')}
                matrixEmptyMessage={t('matrix.noModulesFromServer')}
            />
        </div>
    );
};

export default AddRoleForm;
