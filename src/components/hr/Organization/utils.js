export const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

export const normalizeDepartmentNode = (item) => {
    const id = item?.id || item?.uuid || '';
    return {
        id,
        name: item?.name || '',
        parent: item?.parent || null,
        head: item?.head ?? '',
        headLabel: item?.head_name || item?.headName || '',
        children: normalizeArrayResponse(item?.children).map(normalizeDepartmentNode),
    };
};

export const normalizeDepartmentsTree = (response) => normalizeArrayResponse(response).map(normalizeDepartmentNode);

export const normalizeDepartments = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

export const normalizePositionItem = (item) => ({
    id: item?.id || item?.uuid || '',
    name: item?.name || '',
    description: item?.description || '',
    department: item?.department || item?.department_id || '',
    departmentName: item?.department_name || '',
});

export const normalizePaginatedPositions = (response) => {
    const items = normalizeArrayResponse(response).map(normalizePositionItem);
    const count = Number(response?.count ?? response?.data?.count);

    return {
        items,
        count: Number.isFinite(count) ? count : items.length,
    };
};
