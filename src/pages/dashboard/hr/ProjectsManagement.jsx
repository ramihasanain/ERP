import React, { useState } from 'react';
import { useHR } from '../../../context/HRContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Plus, Trash2, Edit3, Search, Users, FolderOpen, X, Save, UserPlus, UserMinus } from 'lucide-react';

const ProjectsManagement = () => {
    const { projects, addProject, updateProject, deleteProject, employees, assignEmployeeToProject, removeEmployeeFromProject } = useHR();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [expandedProject, setExpandedProject] = useState(null);
    const [assignModal, setAssignModal] = useState(null); // projectId
    const [assignEmpId, setAssignEmpId] = useState('');
    const [assignRole, setAssignRole] = useState('Member');
    const [formData, setFormData] = useState({
        name: '', client: '', status: 'Active', startDate: '', endDate: '', description: ''
    });

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.client?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = () => {
        if (!formData.name) return;
        if (editingProject) {
            updateProject(editingProject.id, formData);
        } else {
            addProject(formData);
        }
        resetForm();
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({ name: project.name, client: project.client || '', status: project.status, startDate: project.startDate || '', endDate: project.endDate || '', description: project.description || '' });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProject(null);
        setFormData({ name: '', client: '', status: 'Active', startDate: '', endDate: '', description: '' });
    };

    const getEmpName = (empId) => {
        const emp = employees.find(e => e.id === empId);
        return emp ? `${emp.firstName} ${emp.lastName}` : empId;
    };

    const statusColors = {
        'Active': { bg: 'var(--color-success-dim)', color: 'var(--color-success)' },
        'On Hold': { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' },
        'Completed': { bg: 'var(--color-primary-50)', color: 'var(--color-primary-600)' },
        'Cancelled': { bg: '#fef2f2', color: 'var(--color-error)' }
    };

    const selectStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--color-border)', fontSize: '0.9rem',
        background: 'white'
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
                        style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }} />
                </div>
                <div style={{ display: 'flex', background: 'var(--color-slate-100)', padding: '4px', borderRadius: '8px' }}>
                    {['All', 'Active', 'On Hold', 'Completed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} style={{
                            padding: '6px 14px', border: 'none', borderRadius: '6px',
                            background: filterStatus === s ? 'white' : 'transparent',
                            boxShadow: filterStatus === s ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            color: filterStatus === s ? 'var(--color-primary-600)' : 'var(--color-slate-600)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                        }}>{s}</button>
                    ))}
                </div>
            </Card>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="padding-lg" style={{ border: '2px solid var(--color-primary-200)', background: 'linear-gradient(to bottom right, white, var(--color-primary-50))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingProject ? 'Edit Project' : 'New Project'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)' }}><X size={20} /></button>
                    </div>
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
                        <Button icon={<Save size={16} />} onClick={handleSubmit}>{editingProject ? 'Update' : 'Create'}</Button>
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
                                    {employees.filter(e => e.status === 'Active').map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role in Project</label>
                                <select style={selectStyle} value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                                    <option value="Member">Member</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Lead Developer">Lead Developer</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Designer">Designer</option>
                                    <option value="QA Engineer">QA Engineer</option>
                                    <option value="Consultant">Consultant</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <Button variant="ghost" onClick={() => { setAssignModal(null); setAssignEmpId(''); }}>Cancel</Button>
                            <Button icon={<UserPlus size={16} />} onClick={() => {
                                if (assignEmpId) {
                                    assignEmployeeToProject(assignModal, assignEmpId, assignRole);
                                    setAssignModal(null);
                                    setAssignEmpId('');
                                    setAssignRole('Member');
                                }
                            }}>Assign</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Projects List */}
            {filteredProjects.map(project => (
                <Card key={project.id} className="padding-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FolderOpen size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{project.name}</h3>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{project.client || 'No Client'}</span>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                                        background: statusColors[project.status]?.bg || '#f1f5f9',
                                        color: statusColors[project.status]?.color || '#64748b'
                                    }}>{project.status}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {project.startDate} → {project.endDate || 'Ongoing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="outline" icon={<UserPlus size={14} />} onClick={() => setAssignModal(project.id)}>Assign</Button>
                            <button onClick={() => handleEdit(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)' }}><Edit3 size={16} /></button>
                            <button onClick={() => deleteProject(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={16} /></button>
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
                                <div key={ae.employeeId} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '6px 12px', borderRadius: '20px',
                                    background: 'var(--color-slate-100)', fontSize: '0.8rem'
                                }}>
                                    <span style={{ fontWeight: 600 }}>{getEmpName(ae.employeeId)}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>({ae.role})</span>
                                    <button
                                        onClick={() => removeEmployeeFromProject(project.id, ae.employeeId)}
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

            {filteredProjects.length === 0 && (
                <Card className="padding-lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No projects found. Create your first project to get started.
                </Card>
            )}
        </div>
    );
};

export default ProjectsManagement;
