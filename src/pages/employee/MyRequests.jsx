import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, CheckCircle, Clock, FileText, Download, Eye, X, Printer, Share2 } from 'lucide-react';
import Input from '../../components/common/Input';

const MyRequests = () => {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [requests, setRequests] = useState([
        { id: 1, type: 'Annual Leave', date: 'Mar 10, 2026', dates: 'Mar 20 - Mar 25', status: 'Approved' },
        { id: 2, type: 'Sick Leave', date: 'Jan 15, 2026', dates: 'Jan 15', status: 'Approved' },
        { id: 3, type: 'Salary Certificate', date: 'Dec 01, 2025', dates: '-', status: 'Approved', employee: 'Sarah Connor', ref: 'SC-2025-003' },
    ]);

    const handleSubmitRequest = (e) => {
        e.preventDefault();
        setShowRequestModal(false);
        setRequests([{ id: Date.now(), type: 'New Request', date: 'Today', dates: '-', status: 'Pending' }, ...requests]);
    };

    const handleViewDocument = (req) => {
        setSelectedRequest(req);
        setShowDocumentModal(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Requests</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Track and manage your HR requests.</p>
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

            {/* Document Preview Modal */}
            {showDocumentModal && selectedRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setShowDocumentModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Modal Header Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Button variant="secondary" icon={<Printer size={16} />}>Print</Button>
                            <Button variant="secondary" icon={<Download size={16} />}>Download</Button>
                            <Button variant="ghost" style={{ background: 'white', color: 'var(--color-text-main)' }} icon={<X size={20} />} onClick={() => setShowDocumentModal(false)} />
                        </div>

                        {/* Document Paper */}
                        <Card className="padding-xl" style={{
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            overflowY: 'auto'
                        }}>
                            {/* Letterhead */}
                            <div style={{ borderBottom: '2px solid var(--color-primary-600)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-600)', letterSpacing: '-0.025em' }}>UnifiedCore</div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>HR Department</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    <div>123 Tech Park, Silicon Valley, CA</div>
                                    <div>contact@unifiedcore.com</div>
                                    <div>+1 (555) 123-4567</div>
                                </div>
                            </div>

                            {/* Document Title */}
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: '6px' }}>
                                    Salary Certificate
                                </h2>
                            </div>

                            {/* Content */}
                            <div style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--color-text-main)', marginBottom: '3rem' }}>
                                <p style={{ marginBottom: '1.5rem' }}><strong>Date:</strong> {selectedRequest.date}</p>
                                <p style={{ marginBottom: '1.5rem' }}><strong>Ref:</strong> {selectedRequest.ref || 'REF-GEN-001'}</p>

                                <p style={{ marginBottom: '1.5rem' }}>To Whom It May Concern,</p>

                                <p style={{ marginBottom: '1.5rem' }}>
                                    This is to certify that <strong>{selectedRequest.employee || 'Sarah Connor'}</strong> is currently employed with <strong>UnifiedCore Inc.</strong> as a <strong>Senior Frontend Developer</strong> since <strong>Jan 15, 2024</strong>.
                                </p>

                                <p style={{ marginBottom: '1.5rem' }}>
                                    Her current monthly gross salary is <strong>$3,250.00</strong> (Three Thousand Two Hundred Fifty US Dollars).
                                </p>

                                <p style={{ marginBottom: '1.5rem' }}>
                                    This certificate is issued upon the employee's request for banking purposes without any liability on the company part.
                                </p>
                            </div>

                            {/* Signatures */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '4rem' }}>
                                <div>
                                    <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ fontFamily: 'Cursive', fontSize: '1.5rem', opacity: 0.6 }}>John Smith</div>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--color-text-main)', width: '200px', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                        <div style={{ fontWeight: 700 }}>John Smith</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Head of HR</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{
                                        width: '100px', height: '100px', border: '3px double var(--color-primary-200)', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-300)',
                                        transform: 'rotate(-15deg)', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center',
                                        lineHeight: '1.2'
                                    }}>
                                        UnifiedCore<br />HR Dept.<br />APPROVED
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                UnifiedCore Inc. | Reg No: 123456789 | www.unifiedcore.com
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            <Card className="padding-none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '1rem 1.5rem' }}>Type</th>
                            <th style={{ padding: '1rem 1rem' }}>Date Requested</th>
                            <th style={{ padding: '1rem 1rem' }}>Details/Dates</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
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
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    {req.status === 'Approved' && (req.type === 'Salary Certificate' || req.type === 'Loan Request') && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<Eye size={14} />}
                                                onClick={() => handleViewDocument(req)}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Download size={14} />}
                                                onClick={() => alert(`Downloading document for ${req.type}`)}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                PDF
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default MyRequests;
