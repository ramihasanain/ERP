export const normalizeTreeResponse = (response) => {
    const source = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
            ? response.results
            : Array.isArray(response?.data)
                ? response.data
                : [];

    return source.map((node) => normalizeNode(node, null, 0));
};

const normalizeNode = (node, parent, level) => {
    const rawType = node?.account_type;
    const accountTypeId = typeof rawType === 'string' ? rawType : rawType?.id || '';
    const childSource = Array.isArray(node?.children)
        ? node.children
        : Array.isArray(node?.accounts)
            ? node.accounts
            : [];
    const accountTypeLabel =
        (typeof rawType === 'object' && (rawType?.name || rawType?.title)) ||
        (typeof rawType === 'string' ? rawType : '') ||
        node?.account_type_name ||
        node?.type ||
        'Unknown';

    const normalized = {
        id: node?.id || node?.uuid || `${node?.code || 'account'}-${level}`,
        code: String(node?.code || ''),
        name: node?.name || '',
        description: node?.description || '',
        isGroup: Boolean(node?.is_group ?? node?.isGroup ?? childSource.length > 0),
        isSystem: Boolean(node?.is_system_account ?? node?.isSystem ?? false),
        accountTypeId,
        accountTypeLabel,
        parentId: parent?.id || null,
        parentCode: parent?.code || '',
        children: [],
        level,
    };

    normalized.children = childSource.map((child) =>
        normalizeNode(child, normalized, level + 1)
    );

    return normalized;
};

export const flattenAccounts = (nodes) => {
    const flat = [];
    const walk = (items) => {
        items.forEach((item) => {
            flat.push(item);
            if (item.children?.length) {
                walk(item.children);
            }
        });
    };
    walk(nodes);
    return flat;
};

export const collectParentIds = (id, accountById) => {
    const parents = [];
    let current = accountById.get(id);
    while (current?.parentId) {
        parents.push(current.parentId);
        current = accountById.get(current.parentId);
    }
    return parents;
};
