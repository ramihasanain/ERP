import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import ContractTemplatesGrid from './ContractTemplatesGrid';
import ContractTemplateDeleteModal from './ContractTemplateDeleteModal';
import { selectStyle } from './utils';

const ContractTemplatesListView = ({
    navigate,
    previewEmployee,
    onPreviewEmployeeChange,
    employeesQuery,
    activeEmployees,
    templatesQuery,
    templatesFromApi,
    templateToDelete,
    onDeleteClick,
    onCloseDeleteModal,
    onConfirmDelete,
    isDeletingTemplate,
}) => {
    const basePath = useBasePath();
    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/hr`)} />
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Contract Templates</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Create and manage employment contract formats.</p>
                </div>
            </div>
            <Button icon={<Plus size={18} />} onClick={() => navigate(`${basePath}/hr/contract-templates/new`)}>
                New Template
            </Button>
        </div>

        <Card className="padding-md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Preview for:</span>
            <select
                style={{ ...selectStyle, maxWidth: '400px' }}
                value={previewEmployee}
                onChange={(event) => onPreviewEmployeeChange(event.target.value)}
                disabled={employeesQuery.isLoading || !activeEmployees.length}
            >
                {!activeEmployees.length && <option value="">No active employees</option>}
                {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} ({employee.position_name || 'No Position'} - {employee.department_name || 'No Department'})
                    </option>
                ))}
            </select>
        </Card>

        {templatesQuery.isLoading ? (
            <Spinner />
        ) : templatesQuery.isError ? (
            <ResourceLoadError
                error={templatesQuery.error}
                title="Could not load contract templates"
                onGoBack={() => navigate(-1)}
                onRefresh={() => templatesQuery.refetch()}
            />
        ) : (
            <ContractTemplatesGrid templates={templatesFromApi} navigate={navigate} onDeleteClick={onDeleteClick} />
        )}

        <ContractTemplateDeleteModal
            templateToDelete={templateToDelete}
            isDeleting={isDeletingTemplate}
            onCancel={onCloseDeleteModal}
            onConfirmDelete={onConfirmDelete}
        />
    </div>
    );
};

export default ContractTemplatesListView;
