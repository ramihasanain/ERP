import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';


import Input from '../../components/common/Input';
import { Calendar, FileText, Clock, Plus, CheckCircle, XCircle } from 'lucide-react';

const EmployeeDashboard = () => {
    const [showRequestModal, setShowRequestModal] = React.useState(false);
    const [requests, setRequests] = React.useState([
        { id: 1, type: 'Annual Leave', date: 'Mar 10, 2026', dates: 'Mar 20 - Mar 25', status: 'Approved' }
    ]);

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
