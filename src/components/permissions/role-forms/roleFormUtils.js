export const PERM_ACTIONS = ['view', 'add', 'edit', 'delete'];

export const NON_VIEW_PERM_ACTIONS = ['add', 'edit', 'delete'];

export const modulesListFromPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

export const formatCategoryLabel = (category) => {
    if (category == null || category === '') return 'Other';
    const s = String(category);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const emptyPermsForModules = (apiMods) => apiMods.reduce((acc, m) => {
    acc[m.id] = { view: false, add: false, edit: false, delete: false };
    return acc;
}, {});

export const normalizePermFlags = (row) => {
    if (!row || typeof row !== 'object') {
        return { view: false, add: false, edit: false, delete: false };
    }
    return {
        view: Boolean(row.view ?? row.can_view),
        add: Boolean(row.add ?? row.can_add),
        edit: Boolean(row.edit ?? row.can_edit),
        delete: Boolean(row.delete ?? row.can_delete),
    };
};

export const parsePermissionEntryId = (id) => {
    const parts = String(id ?? '').split(':');
    return { baseId: parts[0] || '', action: parts[1] || '' };
};

const labelFromPermissionName = (name, fallback) => {
    if (!name) return fallback;
    const stripped = String(name).replace(/^Can (view|add|edit|delete) /i, '').trim();
    return stripped || fallback;
};

/** Flat permissions_list → matrix module rows + initial rolePerms keyed by baseId. */
export const modulesFromPermissionsList = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
        return { modules: [], rolePerms: {} };
    }

    const groups = new Map();
    for (const entry of list) {
        const { baseId, action } = parsePermissionEntryId(entry?.id);
        if (!baseId) continue;
        if (!groups.has(baseId)) {
            groups.set(baseId, { entries: [], viewName: null, module: entry?.module ?? '' });
        }
        const group = groups.get(baseId);
        group.entries.push(entry);
        if (action === 'view' && entry?.name) group.viewName = entry.name;
        if (!group.module && entry?.module) group.module = entry.module;
    }

    const modules = [];
    const rolePerms = {};
    let order = 0;
    for (const [baseId, group] of groups) {
        const label = labelFromPermissionName(group.viewName, group.module || baseId);
        modules.push({
            id: baseId,
            key: group.module || baseId,
            label,
            category: group.module ?? '',
            order: order++,
        });
        rolePerms[baseId] = { view: false, add: false, edit: false, delete: false };
        for (const entry of group.entries) {
            const { action } = parsePermissionEntryId(entry?.id);
            if (PERM_ACTIONS.includes(action)) {
                rolePerms[baseId][action] = Boolean(entry?.has_permission);
            }
        }
    }

    return { modules, rolePerms };
};

export const permissionsPayloadFromRolePerms = (modules, rolePerms) =>
    modules.map((m) => ({
        module_key: m.key,
        can_view: Boolean(rolePerms[m.id]?.view),
        can_add: Boolean(rolePerms[m.id]?.add),
        can_edit: Boolean(rolePerms[m.id]?.edit),
        can_delete: Boolean(rolePerms[m.id]?.delete),
    }));

export const applyPermToggle = (modPerms, permType) => {
    const next = {
        ...modPerms,
        [permType]: !modPerms?.[permType],
    };
    if (permType !== 'view' && !modPerms?.[permType]) {
        next.view = true;
    }
    if (permType === 'view' && modPerms?.view) {
        next.add = false;
        next.edit = false;
        next.delete = false;
    }
    return next;
};

export const applyGroupPermToggle = (mods, prev, permType) => {
    const allEnabled = mods.every((m) => prev[m.id]?.[permType]);
    const next = { ...prev };
    mods.forEach((m) => {
        next[m.id] = { ...next[m.id], [permType]: !allEnabled };
        if (permType !== 'view' && !allEnabled) next[m.id].view = true;
        if (permType === 'view' && allEnabled) {
            next[m.id].add = false;
            next[m.id].edit = false;
            next[m.id].delete = false;
        }
    });
    return next;
};

export const groupModulesByCategory = (normalizedModules) => {
    const sorted = [...normalizedModules].sort((a, b) => {
        const cg = String(a.category).localeCompare(String(b.category));
        if (cg !== 0) return cg;
        return a.order - b.order;
    });
    const acc = {};
    for (const m of sorted) {
        const g = formatCategoryLabel(m.category);
        if (!acc[g]) acc[g] = [];
        acc[g].push(m);
    }
    return acc;
};

export const permsFromDetailRows = (permissions) => {
    const initial = {};
    if (!Array.isArray(permissions)) return initial;
    for (const p of permissions) {
        initial[p.module_id] = normalizePermFlags(p);
    }
    return initial;
};

export const permsEqual = (a, b) => {
    if (!a || !b) return a === b;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        const x = a[k];
        const y = b[k];
        if (!x && !y) continue;
        if (!x || !y) return false;
        if (Boolean(x.view) !== Boolean(y.view)) return false;
        if (Boolean(x.add) !== Boolean(y.add)) return false;
        if (Boolean(x.edit) !== Boolean(y.edit)) return false;
        if (Boolean(x.delete) !== Boolean(y.delete)) return false;
    }
    return true;
};
