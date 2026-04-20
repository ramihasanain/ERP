export const normalizeProjectStatus = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'active') return 'Active';
    if (normalized === 'on_hold' || normalized === 'on hold') return 'On Hold';
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
    return status || 'Active';
};

export const normalizeProjects = (response) => {
    const items = Array.isArray(response?.data) ? response.data : [];
    return items.map((project) => ({
        id: project?.id || '',
        name: project?.name || '',
        client: project?.client || '',
        status: normalizeProjectStatus(project?.status),
        startDate: project?.start_date || '',
        endDate: project?.end_date || '',
        description: project?.description || '',
        assignedEmployees: Array.isArray(project?.members)
            ? project.members.map((member) => ({
                memberId: member?.id || '',
                employeeId: member?.employee || '',
                employeeName: member?.employee_name || '',
                role: member?.role || 'Member',
            }))
            : [],
    }));
};

export const normalizeEmployees = (response) => {
    const items = Array.isArray(response?.data) ? response.data : [];
    return items.map((employee) => ({
        id: employee?.id || '',
        firstName: employee?.first_name || '',
        lastName: employee?.last_name || '',
        status: normalizeProjectStatus(employee?.status),
    }));
};

export const normalizeRoles = (response) => {
    const items = Array.isArray(response?.data) ? response.data : [];
    return items.map((role) => ({
        id: role?.id || '',
        name: role?.name || '',
    }));
};

export const mapProjectDetailsToFormData = (project) => ({
    name: project?.name || '',
    client: project?.client || '',
    status: normalizeProjectStatus(project?.status),
    startDate: project?.start_date || project?.startDate || '',
    endDate: project?.end_date || project?.endDate || '',
    description: project?.description || '',
});

export const mapStatusToApi = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'on hold') return 'on_hold';
    if (normalized === 'cancelled') return 'cancelled';
    if (normalized === 'completed') return 'completed';
    return 'active';
};

export const mapStatusFilterToApi = (status) => {
    if (status === 'All') return '';
    return mapStatusToApi(status);
};

export const mapFormToApiPayload = (data) => ({
    name: data?.name || '',
    client: data?.client || '',
    status: mapStatusToApi(data?.status),
    start_date: data?.startDate || null,
    end_date: data?.endDate || null,
    description: data?.description || '',
});

export const defaultFormData = {
    name: '',
    client: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    description: '',
};

export const statusColors = {
    Active: { bg: 'var(--color-success-dim)', color: 'var(--color-success)' },
    'On Hold': { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' },
    Completed: {
        bg: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
        color: 'var(--color-primary-500)',
    },
    Cancelled: {
        bg: 'color-mix(in srgb, var(--color-error) 16%, var(--color-bg-card))',
        color: 'var(--color-error)',
    },
};

export const selectStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};
