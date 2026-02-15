import React, { useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAttendance } from '../../../context/AttendanceContext';
import { useHR } from '../../../context/HRContext';

const LeaveRequests = () => {
    const { leaveRequests, addLeaveRequest, updateLeaveStatus } = useAttendance();
    const { employees } = useHR();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Helper to get employee name
    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : id;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Leave Requests</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage employee leave applications.</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>New Request</Button>
            </div>

            <Card className="padding-lg">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Employee</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Dates</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Reason</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.map(req => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{getEmployeeName(req.employeeId)}</td>
                                <td style={{ padding: '1rem' }}>{req.type}</td>
                                <td style={{ padding: '1rem' }}>{req.startDate} to {req.endDate}</td>
                                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{req.reason}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <StatusBadge status={req.status} />
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {req.status === 'Pending' && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <Button variant="ghost" size="sm" icon={<CheckCircle size={16} />} style={{ color: 'var(--color-success)' }} onClick={() => updateLeaveStatus(req.id, 'Approved')} />
                                            <Button variant="ghost" size="sm" icon={<XCircle size={16} />} style={{ color: 'var(--color-error)' }} onClick={() => updateLeaveStatus(req.id, 'Rejected')} />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {leaveRequests.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No leave requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {isModalOpen && (
                <RequestModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={addLeaveRequest}
                    employees={employees}
                />
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Approved: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
        Pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
        Rejected: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
    };
    const style = styles[status] || styles.Pending;

    return (
        <span style={{
            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem',
            background: style.bg, color: style.color, fontWeight: 500
        }}>
            {status}
        </span>
    );
};

const RequestModal = ({ isOpen, onClose, onSave, employees }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'Annual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '500px', maxWidth: '90%' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>New Leave Request</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Employee</label>
                        <select
                            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Leave Type</label>
                        <select
                            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Annual Leave</option>
                            <option>Sick Leave</option>
                            <option>Unpaid Leave</option>
                            <option>Compassionate Leave</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                        <Input label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
                    </div>

                    <Input label="Reason" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Why are you taking leave?" />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit">Submit Request</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveRequests;
