import React, { useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Plus, Building2, User, Users, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import { useHR } from '../../../context/HRContext';

const Organization = () => {
    const { departments, jobPositions, employees, addDepartment, updateDepartment, deleteDepartment, addPosition, updatePosition, deletePosition } = useHR();
    const [activeTab, setActiveTab] = useState('departments'); // departments, positions

    // Modal States
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [editingPos, setEditingPos] = useState(null);

    const handleOpenDeptModal = (dept = null) => {
        setEditingDept(dept);
        setIsDeptModalOpen(true);
    };

    const handleOpenPosModal = (pos = null) => {
        setEditingPos(pos);
        setIsPosModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Organization</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage departments, hierarchy, and job positions.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant={activeTab === 'departments' ? 'primary' : 'outline'} onClick={() => setActiveTab('departments')}>Departments</Button>
                    <Button variant={activeTab === 'positions' ? 'primary' : 'outline'} onClick={() => setActiveTab('positions')}>Job Positions</Button>
                </div>
            </div>

            {activeTab === 'departments' ? (
                <DepartmentsView
                    departments={departments}
                    onAdd={() => handleOpenDeptModal(null)}
                    onEdit={handleOpenDeptModal}
                    onDelete={deleteDepartment}
                    employees={employees}
                />
            ) : (
                <PositionsView
                    positions={jobPositions}
                    departments={departments}
                    onAdd={() => handleOpenPosModal(null)}
                    onEdit={handleOpenPosModal}
                    onDelete={deletePosition}
                />
            )}

            {/* Modals */}
            {isDeptModalOpen && (
                <DepartmentModal
                    isOpen={isDeptModalOpen}
                    onClose={() => setIsDeptModalOpen(false)}
                    onSave={editingDept ? updateDepartment : addDepartment}
                    department={editingDept}
                    allDepartments={departments}
                    employees={employees}
                />
            )}

            {isPosModalOpen && (
                <PositionModal
                    isOpen={isPosModalOpen}
                    onClose={() => setIsPosModalOpen(false)}
                    onSave={editingPos ? updatePosition : addPosition}
                    position={editingPos}
                    departments={departments}
                />
            )}
        </div>
    );
};

const DepartmentsView = ({ departments, onAdd, onEdit, onDelete, employees }) => {
    // Basic Tree View Logic
    const rootDepts = departments.filter(d => !d.parentId);

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Department Hierarchy</h2>
                <Button icon={<Plus size={16} />} onClick={onAdd}>Add Department</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rootDepts.map(dept => (
                    <DepartmentNode key={dept.id} dept={dept} allDepts={departments} level={0} onEdit={onEdit} onDelete={onDelete} employees={employees} />
                ))}
            </div>
        </Card>
    );
};

const DepartmentNode = ({ dept, allDepts, level, onEdit, onDelete, employees }) => {
    const children = allDepts.filter(d => d.parentId === dept.id);
    const deptEmployees = employees ? employees.filter(e => e.departmentId === dept.id) : [];

    // Auto-expand if root or has children/employees
    const [expanded, setExpanded] = useState(true);

    // Find Manager Name
    const manager = employees?.find(e => e.id === dept.managerId);
    const managerName = manager ? `${manager.firstName} ${manager.lastName}` : 'Unassigned';

    return (
        <div style={{ marginLeft: `${level * 2}rem` }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--color-slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '0.5rem'
            }}>
                <div
                    onClick={() => setExpanded(!expanded)}
                    style={{ cursor: (children.length || deptEmployees.length) ? 'pointer' : 'default', opacity: (children.length || deptEmployees.length) ? 1 : 0.3 }}
                >
                    <ChevronRight size={18} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--color-primary-100)', borderRadius: '0.5rem', color: 'var(--color-primary-700)' }}>
                    <Building2 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{dept.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} /> Head: {managerName} • {deptEmployees.length} Members
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" icon={<Edit2 size={16} />} onClick={() => onEdit(dept)} />
                    <Button variant="ghost" icon={<Trash2 size={16} />} style={{ color: 'var(--color-error)' }} onClick={() => onDelete(dept.id)} />
                </div>
            </div>

            {expanded && (
                <div>
                    {/* Employees List */}
                    {deptEmployees.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            {deptEmployees.map(emp => (
                                <div key={emp.id} style={{
                                    marginLeft: '2.5rem',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    borderLeft: '2px solid var(--color-border)',
                                    marginBottom: '0.25rem'
                                }}>
                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {emp.firstName[0]}{emp.lastName[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{emp.firstName} {emp.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{emp.positionId}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sub Departments */}
                    {children.map(child => (
                        <DepartmentNode key={child.id} dept={child} allDepts={allDepts} level={level + 1} onEdit={onEdit} onDelete={onDelete} employees={employees} />
                    ))}
                </div>
            )}
        </div>
    );
};

const PositionsView = ({ positions, departments, onAdd, onEdit, onDelete }) => {
    const getDeptName = (id) => departments.find(d => d.id === id)?.name || 'Unknown';

    return (
        <Card className="padding-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Job Positions</h2>
                <Button icon={<Plus size={16} />} onClick={onAdd}>Add Position</Button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Department</th>
                        <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Grade</th>
                        <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                        <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map(pos => (
                        <tr key={pos.id}>
                            <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 500 }}>{pos.title}</td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>{getDeptName(pos.departmentId)}</td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}><span style={{ background: 'var(--color-slate-100)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>Grade {pos.grade}</span></td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                                <span style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>Active</span>
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                                <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => onEdit(pos)} />
                                <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} style={{ color: 'var(--color-error)' }} onClick={() => onDelete(pos.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

// --- Modals ---

const DepartmentModal = ({ isOpen, onClose, onSave, department, allDepartments, employees }) => {
    const [formData, setFormData] = useState(department || {
        name: '',
        parentId: '',
        managerId: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(department ? department.id : null, formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '500px', maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{department ? 'Edit Department' : 'Add Department'}</h2>
                    <Button variant="ghost" icon={<X size={20} />} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Department Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Parent Department</label>
                        <select
                            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            value={formData.parentId || ''}
                            onChange={e => setFormData({ ...formData, parentId: e.target.value || null })}
                        >
                            <option value="">None (Root Level)</option>
                            {allDepartments.filter(d => d.id !== (department ? department.id : null)).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Manager (Optional)</label>
                        <select
                            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            value={formData.managerId}
                            onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                        >
                            <option value="">Select Manager</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit">Save Department</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PositionModal = ({ isOpen, onClose, onSave, position, departments }) => {
    const [formData, setFormData] = useState(position || {
        title: '',
        departmentId: '',
        grade: 1
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(position ? position.id : null, formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '500px', maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{position ? 'Edit Position' : 'Add Position'}</h2>
                    <Button variant="ghost" icon={<X size={20} />} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Job Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Department</label>
                        <select
                            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            value={formData.departmentId}
                            onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Grade Level</label>
                        <Input type="number" min="1" max="20" value={formData.grade} onChange={e => setFormData({ ...formData, grade: parseInt(e.target.value) })} required />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit">Save Position</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Organization;
