import React from 'react';
import { UserPlus } from 'lucide-react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { selectStyle } from './utils';

const AssignEmployeeModal = ({
    projectId,
    assignEmpId,
    assignRole,
    assignableEmployees,
    assignableRoles,
    isAssigning,
    isEmployeesLoading,
    isRolesLoading,
    onEmpChange,
    onRoleChange,
    onClose,
    onAssign,
}) => {
    if (!projectId) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <Card className="padding-lg" style={{ width: '420px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Assign Employee</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Employee</label>
                        <select style={selectStyle} value={assignEmpId} onChange={(event) => onEmpChange(event.target.value)}>
                            <option value="">Select employee...</option>
                            {assignableEmployees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.firstName} {employee.lastName}
                                </option>
                            ))}
                        </select>
                        {isEmployeesLoading && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading employees...</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role in Project</label>
                        <select style={selectStyle} value={assignRole} onChange={(event) => onRoleChange(event.target.value)}>
                            <option value="">Select role...</option>
                            {assignableRoles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        {isRolesLoading && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading roles...</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button icon={<UserPlus size={16} />} onClick={onAssign} disabled={isAssigning}>
                        Assign
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AssignEmployeeModal;
