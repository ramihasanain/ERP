import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useHR } from '@/context/HRContext';
import { get } from '@/api';
import AssignEmployeeModal from './AssignEmployeeModal';
import ProjectFormCard from './ProjectFormCard';
import ProjectsHeaderFilters from './ProjectsHeaderFilters';
import ProjectsList from './ProjectsList';
import {
    defaultFormData,
    mapFormToApiPayload,
    mapProjectDetailsToFormData,
} from './utils';
import useProjectsManagementData from './useProjectsManagementData';

const ProjectsManagement = () => {
    const { t } = useTranslation(['hr', 'common']);

    const { employees } = useHR();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [initialEditFormData, setInitialEditFormData] = useState(null);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [assignModal, setAssignModal] = useState(null);
    const [assignEmpId, setAssignEmpId] = useState('');
    const [assignRole, setAssignRole] = useState('');
    const [formData, setFormData] = useState(defaultFormData);

    const clearAssignModal = () => {
        setAssignModal(null);
        setAssignEmpId('');
        setAssignRole('');
    };

    const resetForm = () => {

        setShowForm(false);
        setEditingProject(null);
        setInitialEditFormData(null);
        setFormData(defaultFormData);
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find((item) => item.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
    };

    const {
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
    } = useProjectsManagementData({
        searchTerm,
        filterStatus,
        assignModal,
        onCreateOrUpdateSuccess: resetForm,
        onAssignSuccess: clearAssignModal,
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

        if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
            toast.error(t('projects.fillRequired'));
            return;
        }

        if (formData.startDate >= formData.endDate) {
            toast.error(t('projects.dateOrder'));
            return;
        }

        const payload = mapFormToApiPayload(formData);
        if (editingProject) {
            updateProjectMutation.mutate({ projectId: editingProject.id, payload });
            return;
        }
        createProjectMutation.mutate(payload);
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
            const fallbackFormData = {
                name: project.name,
                client: project.client || '',
                status: project.status,
                startDate: project.startDate || '',
                endDate: project.endDate || '',
                description: project.description || '',
            };
            setFormData(fallbackFormData);
            setInitialEditFormData(fallbackFormData);
        } finally {
            setIsLoadingEdit(false);
            setShowForm(true);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProjectsHeaderFilters
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                onCreateProject={() => {
                    resetForm();
                    setShowForm(true);
                }}
            />

            <ProjectFormCard
                showForm={showForm}
                editingProject={editingProject}
                formData={formData}
                isLoadingEdit={isLoadingEdit}
                isSubmitting={createProjectMutation.isPending || updateProjectMutation.isPending}
                isEditUnchanged={isEditUnchanged}
                onFormChange={(next) => setFormData((prev) => ({ ...prev, ...next }))}
                onCancel={resetForm}
                onSubmit={handleSubmit}
            />

            <AssignEmployeeModal
                projectId={assignModal}
                assignEmpId={assignEmpId}
                assignRole={assignRole}
                assignableEmployees={assignableEmployees}
                assignableRoles={assignableRoles}
                isAssigning={assignMemberMutation.isPending}
                isEmployeesLoading={assignEmployeesQuery.isLoading}
                isRolesLoading={assignRolesQuery.isLoading}
                onEmpChange={setAssignEmpId}
                onRoleChange={setAssignRole}
                onClose={clearAssignModal}
                onAssign={() => {
                    if (assignEmpId && assignRole) {
                        assignMemberMutation.mutate({ projectId: assignModal, employeeId: assignEmpId, role: assignRole });
                    }
                }}
            />

            <ProjectsList
                projects={projects}
                isLoading={projectsQuery.isLoading}
                isError={projectsQuery.isError}
                isDeleting={deleteProjectMutation.isPending}
                isRemovingMember={removeMemberMutation.isPending}
                onEdit={handleEdit}
                onDelete={deleteProjectMutation.mutate}
                onOpenAssignModal={(projectId) => {
                    setAssignModal(projectId);
                    setAssignEmpId('');
                    setAssignRole('');
                }}
                onRemoveMember={(projectId, memberId) => {
                    if (memberId) removeMemberMutation.mutate({ projectId, memberId });
                }}
                getEmployeeName={getEmployeeName}
            />
        </div>
    );
};

export default ProjectsManagement;
