import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Calendar, FileText, Clock, Plus, CheckCircle, Play, Square, Timer, FolderOpen } from 'lucide-react';
import { useHR } from '../../context/HRContext';

const EmployeeDashboard = () => {
    const { projects, getEmployeeProjects, getActiveTimer, startTimer, stopTimer, timeLogs } = useHR();
    const currentEmployeeId = 'EMP-002'; // Simulating logged-in employee

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requests, setRequests] = useState([
        { id: 1, type: 'Annual Leave', date: 'Mar 10, 2026', dates: 'Mar 20 - Mar 25', status: 'Approved' }
    ]);

    // Timer state
    const [selectedProject, setSelectedProject] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const activeTimer = getActiveTimer(currentEmployeeId);
    const myProjects = getEmployeeProjects(currentEmployeeId);
    const myLogs = timeLogs.filter(l => l.employeeId === currentEmployeeId && l.endTime).slice(0, 5);

    // Live ticker
    useEffect(() => {
        let interval;
        if (activeTimer) {
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleStart = () => {
        if (!selectedProject) return;
        startTimer(currentEmployeeId, selectedProject, taskDescription);
        setTaskDescription('');
    };

    const handleStop = () => {
        if (activeTimer) stopTimer(activeTimer.id);
    };

    const getProjectName = (projectId) => {
        const p = projects.find(pr => pr.id === projectId);
        return p ? p.name : projectId;
    };

    const handleSubmitRequest = (e) => {
        e.preventDefault();
        setShowRequestModal(false);
        setRequests([{ id: Date.now(), type: 'Salary Slip', date: 'Today', dates: '-', status: 'Pending' }, ...requests]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Good Morning, Sarah</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>You have 2 pending tasks and 1 approval request.</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => setShowRequestModal(true)}>New Request</Button>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card className="padding-lg" style={{ width: '400px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Submit Request</h3>
                        <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Request Type</label>
                                <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <option>Annual Leave</option>
                                    <option>Sick Leave</option>
                                    <option>Salary Certificate</option>
                                    <option>Loan Request</option>
                                </select>
                            </div>
                            <Input label="Description / Reason" placeholder="Details..." />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="From Date" type="date" />
                                <Input label="To Date" type="date" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <Button variant="ghost" onClick={() => setShowRequestModal(false)} type="button">Cancel</Button>
                                <Button type="submit">Submit Request</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* ── TIME TRACKER WIDGET ── */}
            <Card className="padding-lg" style={{
                border: activeTimer ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                background: activeTimer ? 'linear-gradient(to right, #f0fdf4, white)' : undefined
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                        padding: '0.5rem', borderRadius: 'var(--radius-md)',
                        background: activeTimer ? 'var(--color-success)' : 'var(--color-primary-50)',
                        color: activeTimer ? 'white' : 'var(--color-primary-600)'
                    }}>
                        <Timer size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Time Tracker</h3>
                    {activeTimer && (
                        <span style={{
                            marginLeft: 'auto', fontSize: '2rem', fontWeight: 700,
                            fontFamily: 'monospace', color: 'var(--color-success)',
                            letterSpacing: '2px'
                        }}>
                            {formatDuration(elapsedTime)}
                        </span>
                    )}
                </div>

                {activeTimer ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '10px', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{getProjectName(activeTimer.projectId)}</div>
                                {activeTimer.description && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{activeTimer.description}</div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Started at {new Date(activeTimer.startTime).toLocaleTimeString()}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', gap: '0.5rem' }}
                                onClick={handleStop}
                            >
                                <Square size={16} fill="var(--color-error)" /> Stop
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Project</label>
                            <select
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                            >
                                <option value="">Select project...</option>
                                {myProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>What are you working on?</label>
                            <input
                                type="text"
                                value={taskDescription}
                                onChange={e => setTaskDescription(e.target.value)}
                                placeholder="e.g. Building login page..."
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <Button
                            onClick={handleStart}
                            disabled={!selectedProject}
                            style={{
                                gap: '0.5rem', height: '2.5rem',
                                background: selectedProject ? 'var(--color-success)' : 'var(--color-slate-300)',
                                borderColor: selectedProject ? 'var(--color-success)' : 'var(--color-slate-300)'
                            }}
                        >
                            <Play size={16} fill="white" /> Start
                        </Button>
                    </div>
                )}

                {/* Recent Time Logs */}
                {myLogs.length > 0 && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Recent Activity</div>
                        {myLogs.map(log => (
                            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{getProjectName(log.projectId)}</div>
                                    {log.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.description}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{formatDuration(log.duration)}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(log.startTime).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <Card className="padding-lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', borderRadius: 'var(--radius-md)' }}><Clock size={20} /></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Leave Balance</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Annual Leave</span>
                        <span style={{ fontWeight: 700 }}>14 Days</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--color-slate-100)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '60%', height: '100%', background: 'var(--color-primary-500)' }} />
                    </div>
                </Card>

                <Card className="padding-lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-md)' }}><FileText size={20} /></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Payslips</h3>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$3,250.00</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Last payment on Feb 28, 2025</div>
                    </div>
                    <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={() => alert("Downloading Payslip for Feb 2025...")}>Download PDF</Button>
                </Card>

                <Card className="padding-lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--color-warning)', color: 'white', borderRadius: 'var(--radius-md)' }}><Calendar size={20} /></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Upcoming Holidays</h3>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span>Eid Al-Fitr</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>Apr 09</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                            <span>Labor Day</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>May 01</span>
                        </li>
                    </ul>
                </Card>
            </div>

            {/* My Projects */}
            {myProjects.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>My Projects</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {myProjects.map(p => (
                            <Card key={p.id} className="padding-md hoverable" style={{ cursor: 'default' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FolderOpen size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.client || 'Internal'} • {p.assignedEmployees.length} members</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>My Requests</h3>
                <Card className="padding-none">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '0.75rem 1.5rem' }}>Type</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Date Requested</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Dates</th>
                                <th style={{ padding: '0.75rem 1.5rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{req.type}</td>
                                    <td style={{ padding: '1rem 1rem', color: 'var(--color-text-secondary)' }}>{req.date}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{req.dates}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                                            background: req.status === 'Approved' ? 'var(--color-success-dim)' : 'var(--color-warning-dim)',
                                            color: req.status === 'Approved' ? 'var(--color-success)' : 'var(--color-warning)'
                                        }}>
                                            {req.status === 'Approved' ? <CheckCircle size={14} /> : <Clock size={14} />} {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
