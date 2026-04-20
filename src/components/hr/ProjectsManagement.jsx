import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHR } from '@/context/HRContext';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { get, post, put, remove } from '@/api';
import { Plus, Trash2, Edit3, Search, Users, FolderOpen, X, Save, UserPlus, UserMinus } from 'lucide-react';

const normalizeProjectStatus = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'active') return 'Active';
    if (normalized === 'on_hold' || normalized === 'on hold') return 'On Hold';
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
    return status || 'Active';
};

const normalizeProjects = (response) => {
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

const normalizeEmployees = (response) => {
    const items = Array.isArray(response?.data) ? response.data : [];
    return items.map((employee) => ({
        id: employee?.id || '',
        firstName: employee?.first_name || '',
        lastName: employee?.last_name || '',
        status: normalizeProjectStatus(employee?.status),
    }));
};

const normalizeRoles = (response) => {
    const items = Array.isArray(response?.data) ? response.data : [];
    return items.map((role) => ({
        id: role?.id || '',
        name: role?.name || '',
    }));
};

const mapProjectDetailsToFormData = (project) => ({
    name: project?.name || '',
    client: project?.client || '',
    status: normalizeProjectStatus(project?.status),
    startDate: project?.start_date || project?.startDate || '',
    endDate: project?.end_date || project?.endDate || '',
    description: project?.description || '',
});

const mapStatusToApi = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'on hold') return 'on_hold';
    if (normalized === 'cancelled') return 'cancelled';
    if (normalized === 'completed') return 'completed';
    return 'active';
};

const mapStatusFilterToApi = (status) => {
    if (status === 'All') return '';
    return mapStatusToApi(status);
};

const mapFormToApiPayload = (data) => ({
    name: data?.name || '',
    client: data?.client || '',
    status: mapStatusToApi(data?.status),
    start_date: data?.startDate || null,
    end_date: data?.endDate || null,
    description: data?.description || '',
});

const ProjectsManagement = () => {
    const queryClient = useQueryClient();
    const { employees } = useHR();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [initialEditFormData, setInitialEditFormData] = useState(null);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [expandedProject, setExpandedProject] = useState(null);
    const [assignModal, setAssignModal] = useState(null); // projectId
    const [assignEmpId, setAssignEmpId] = useState('');
    const [assignRole, setAssignRole] = useState('');
    const [formData, setFormData] = useState({
        name: '', client: '', status: 'Active', startDate: '', endDate: '', description: ''
    });
    const apiStatusFilter = useMemo(() => mapStatusFilterToApi(filterStatus), [filterStatus]);
    const projectsUrl = useMemo(() => {
        const params = new URLSearchParams();
        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch) params.set('search', trimmedSearch);
        if (apiStatusFilter) params.set('status', apiStatusFilter);
        const queryString = params.toString();
        return queryString ? `/api/hr/projects/?${queryString}` : '/api/hr/projects/';
    }, [apiStatusFilter, searchTerm]);

    const projectsQuery = useCustomQuery(projectsUrl, ['hr-projects', searchTerm, apiStatusFilter], {
        select: normalizeProjects,
    });
    const assignEmployeesQuery = useCustomQuery('/api/hr/employees/', ['hr-assign-employees'], {
        select: normalizeEmployees,
        enabled: Boolean(assignModal),
    });
    const assignRolesQuery = useCustomQuery('/api/roles/', ['hr-assign-roles'], {
        select: normalizeRoles,
        enabled: Boolean(assignModal),
    });

    const apiProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
    const assignableEmployees = useMemo(
        () => (assignEmployeesQuery.data ?? []).filter((employee) => employee.status === 'Active'),
        [assignEmployeesQuery.data]
    );
    const assignableRoles = useMemo(() => assignRolesQuery.data ?? [], [assignRolesQuery.data]);
    const assignMemberMutation = useMutation({
        mutationFn: ({ projectId, employeeId, role }) =>
            post(`/api/hr/projects/${projectId}/members/`, {
                employee: employeeId,
                role,
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Employee assigned successfully.');
            setAssignModal(null);
            setAssignEmpId('');
            setAssignRole('');
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error?.message || 'Failed to assign employee.';
            toast.error(message);
        },
    });
    const createProjectMutation = useMutation({
        mutationFn: (payload) => post('/api/hr/projects/', payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project created successfully.');
            resetForm();
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error?.message || 'Failed to create project.';
            toast.error(message);
        },
    });
    const updateProjectMutation = useMutation({
        mutationFn: ({ projectId, payload }) => put(`/api/hr/projects/${projectId}/`, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project updated successfully.');
            resetForm();
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error?.message || 'Failed to update project.';
            toast.error(message);
        },
    });
    const removeMemberMutation = useMutation({
        mutationFn: ({ projectId, memberId }) => remove(`/api/hr/projects/${projectId}/members/${memberId}/`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Employee removed from project.');
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error?.message || 'Failed to remove member.';
            toast.error(message);
        },
    });
    const deleteProjectMutation = useMutation({
        mutationFn: (projectId) => remove(`/api/hr/projects/${projectId}/`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project deleted successfully.');
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error?.message || 'Failed to delete project.';
            toast.error(message);
        },
    });

    const isEditUnchanged = Boolean(
        editingProject &&
        initialEditFormData &&
        formData.name === initialEditFormData.name &&
        formData.client === initialEditFormData.client &&
        formData.status === initialEditFormData.status &&
        formData.startDate === initialEditFormData.startDate &&
        formData.endDate === initialEditFormData.endDate &&
        formData.description === initialEditFormData.description
    );

    const handleSubmit = () => {
        if (!formData.name) return;
        const payload = mapFormToApiPayload(formData);
        if (editingProject) {
            updateProjectMutation.mutate({ projectId: editingProject.id, payload });
        } else {
            createProjectMutation.mutate(payload);
        }
    };

    const handleEdit = async (project) => {
        setIsLoadingEdit(true);
        setEditingProject(project);
        try {
            const projectDetails = await get(`/api/hr/projects/${project.id}/`);
            const nextFormData = mapProjectDetailsToFormData(projectDetails);
            setFormData(nextFormData);
            setInitialEditFormData(nextFormData);
        } catch (_error) {
            const nextFormData = {
                name: project.name,
                client: project.client || '',
                status: project.status,
                startDate: project.startDate || '',
                endDate: project.endDate || '',
                description: project.description || '',
            };
            setFormData(nextFormData);
            setInitialEditFormData(nextFormData);
        } finally {
            setIsLoadingEdit(false);
            setShowForm(true);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProject(null);
        setInitialEditFormData(null);
        setFormData({ name: '', client: '', status: 'Active', startDate: '', endDate: '', description: '' });
    };

    const getEmpName = (empId) => {
        const emp = employees.find(e => e.id === empId);
        return emp ? `${emp.firstName} ${emp.lastName}` : empId;
    };

    const statusColors = {
        'Active': { bg: 'var(--color-success-dim)', color: 'var(--color-success)' },
        'On Hold': { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' },
        'Completed': { bg: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))', color: 'var(--color-primary-500)' },
        'Cancelled': { bg: 'color-mix(in srgb, var(--color-error) 16%, var(--color-bg-card))', color: 'var(--color-error)' }
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem',
        background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Projects Management</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Manage projects and assign team members.</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => { resetForm(); setShowForm(true); }}>New Project</Button>
            </div>

            {/* Filters */}
            <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} size={18} />
                    <input type="text" placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }} />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-bg-toggle-track)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['All', 'Active', 'On Hold', 'Completed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} style={{
                            padding: '6px 14px', border: 'none', borderRadius: '6px',
                            background: filterStatus === s ? 'var(--color-bg-surface)' : 'transparent',
                            boxShadow: filterStatus === s ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                            color: filterStatus === s ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                        }}>{s}</button>
                    ))}
                </div>
            </Card>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="padding-lg" style={{ border: '2px solid var(--color-border)', background: 'linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingProject ? 'Edit Project' : 'New Project'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                    </div>
                    {isLoadingEdit && (
                        <p style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Loading project details...
                        </p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <Input label="Project Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. ERP Development" />
                        <Input label="Client" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} placeholder="e.g. TechCo Inc." />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
                            <select style={selectStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <Input label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        <Input label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                        <Button
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={createProjectMutation.isPending || updateProjectMutation.isPending || isLoadingEdit || (editingProject && isEditUnchanged)}
                        >
                            {editingProject ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card className="padding-lg" style={{ width: '420px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Assign Employee</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Employee</label>
                                <select style={selectStyle} value={assignEmpId} onChange={e => setAssignEmpId(e.target.value)}>
                                    <option value="">Select employee...</option>
                                    {assignableEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                                {assignEmployeesQuery.isLoading && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading employees...</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role in Project</label>
                                <select style={selectStyle} value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                                    <option value="">Select role...</option>
                                    {assignableRoles.map(role => (
                                        <option key={role.id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                                {assignRolesQuery.isLoading && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading roles...</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <Button variant="ghost" onClick={() => { setAssignModal(null); setAssignEmpId(''); setAssignRole(''); }}>Cancel</Button>
                            <Button icon={<UserPlus size={16} />} onClick={() => {
                                if (assignEmpId && assignRole) {
                                    assignMemberMutation.mutate({
                                        projectId: assignModal,
                                        employeeId: assignEmpId,
                                        role: assignRole,
                                    });
                                }
                            }} disabled={assignMemberMutation.isPending}>Assign</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Projects List */}
            {projectsQuery.isLoading && <Spinner />}

            {projectsQuery.isError && (
                <Card className="padding-lg" style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                    Failed to load projects from API.
                </Card>
            )}

            {apiProjects.map(project => (
                <Card key={project.id} className="padding-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FolderOpen size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{project.name}</h3>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{project.client || 'No Client'}</span>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                                        background: statusColors[project.status]?.bg || 'var(--color-bg-subtle)',
                                        color: statusColors[project.status]?.color || 'var(--color-text-secondary)'
                                    }}>{project.status}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {project.startDate} → {project.endDate || 'Ongoing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="outline" icon={<UserPlus size={14} />} onClick={() => { setAssignModal(project.id); setAssignEmpId(''); setAssignRole(''); }}>Assign</Button>
                            <button onClick={() => handleEdit(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}><Edit3 size={16} /></button>
                            <button
                                onClick={() => deleteProjectMutation.mutate(project.id)}
                                disabled={deleteProjectMutation.isPending}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {project.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>{project.description}</p>
                    )}

                    {/* Team Members */}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                Team ({project.assignedEmployees.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {project.assignedEmployees.map(ae => (
                                <div key={ae.memberId || ae.employeeId} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '6px 12px', borderRadius: '20px',
                                    background: 'var(--color-bg-subtle)', fontSize: '0.8rem', border: '1px solid var(--color-border)', color: 'var(--color-text-main)',
                                }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{ae.employeeName || getEmpName(ae.employeeId)}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>({ae.role})</span>
                                    <button
                                        onClick={() => {
                                            if (ae.memberId) {
                                                removeMemberMutation.mutate({ projectId: project.id, memberId: ae.memberId });
                                            }
                                        }}
                                        disabled={!ae.memberId || removeMemberMutation.isPending}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: 0, display: 'flex' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {project.assignedEmployees.length === 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No team members assigned yet.</span>
                            )}
                        </div>
                    </div>
                </Card>
            ))}

            {apiProjects.length === 0 && !projectsQuery.isLoading && (
                <Card className="padding-lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No projects found. Create your first project to get started.
                </Card>
            )}
        </div>
    );
};

export default ProjectsManagement;
