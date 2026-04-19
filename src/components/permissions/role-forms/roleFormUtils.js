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
    acc[m.id] = { view: false, edit: false, delete: false };
    return acc;
}, {});

export const normalizePermFlags = (row) => {
    if (!row || typeof row !== 'object') return { view: false, edit: false, delete: false };
    return {
        view: Boolean(row.view ?? row.can_view),
        edit: Boolean(row.edit ?? row.can_edit),
        delete: Boolean(row.delete ?? row.can_delete),
    };
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
        if (Boolean(x.edit) !== Boolean(y.edit)) return false;
        if (Boolean(x.delete) !== Boolean(y.delete)) return false;
    }
    return true;
};
