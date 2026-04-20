import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useCustomQuery from '@/hooks/useQuery';
import { post, put, remove } from '@/api';
import { mapStatusFilterToApi, normalizeEmployees, normalizeProjects, normalizeRoles } from './utils';

const useProjectsManagementData = ({ searchTerm, filterStatus, assignModal, onCreateOrUpdateSuccess, onAssignSuccess }) => {
    const queryClient = useQueryClient();
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

    const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
    const assignableEmployees = useMemo(
        () => (assignEmployeesQuery.data ?? []).filter((employee) => employee.status === 'Active'),
        [assignEmployeesQuery.data]
    );
    const assignableRoles = useMemo(() => assignRolesQuery.data ?? [], [assignRolesQuery.data]);

    const assignMemberMutation = useMutation({
        mutationFn: ({ projectId, employeeId, role }) => post(`/api/hr/projects/${projectId}/members/`, { employee: employeeId, role }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Employee assigned successfully.');
            onAssignSuccess();
        },
        onError: (error) => toast.error(error?.response?.data?.detail || error?.message || 'Failed to assign employee.'),
    });
    const createProjectMutation = useMutation({
        mutationFn: (payload) => post('/api/hr/projects/', payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project created successfully.');
            onCreateOrUpdateSuccess();
        },
        onError: (error) => toast.error(error?.response?.data?.detail || error?.message || 'Failed to create project.'),
    });
    const updateProjectMutation = useMutation({
        mutationFn: ({ projectId, payload }) => put(`/api/hr/projects/${projectId}/`, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project updated successfully.');
            onCreateOrUpdateSuccess();
        },
        onError: (error) => toast.error(error?.response?.data?.detail || error?.message || 'Failed to update project.'),
    });
    const removeMemberMutation = useMutation({
        mutationFn: ({ projectId, memberId }) => remove(`/api/hr/projects/${projectId}/members/${memberId}/`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Employee removed from project.');
        },
        onError: (error) => toast.error(error?.response?.data?.detail || error?.message || 'Failed to remove member.'),
    });
    const deleteProjectMutation = useMutation({
        mutationFn: (projectId) => remove(`/api/hr/projects/${projectId}/`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['hr-projects'] });
            toast.success('Project deleted successfully.');
        },
        onError: (error) => toast.error(error?.response?.data?.detail || error?.message || 'Failed to delete project.'),
    });

    return {
        projects,
        assignableEmployees,
        assignableRoles,
        projectsQuery,
        assignEmployeesQuery,
        assignRolesQuery,
        assignMemberMutation,
        createProjectMutation,
        updateProjectMutation,
        removeMemberMutation,
        deleteProjectMutation,
    };
};

export default useProjectsManagementData;
