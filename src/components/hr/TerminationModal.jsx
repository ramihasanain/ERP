import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, FileText } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

const TerminationModal = ({ isOpen, onClose, employee, onConfirm }) => {
    const [formData, setFormData] = useState({
        type: 'Resignation',
        date: new Date().toISOString().split('T')[0],
        reason: '',
        noticePeriod: 30
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', width: '500px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} color="var(--color-warning)" />
                        End Service / Terminate Employee
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="var(--color-text-muted)" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-warning-dim)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--color-warning-dark)' }}>
                        You are about to end the service for <strong>{employee.firstName} {employee.lastName}</strong>.
                        This action will calculate their final settlement.
                    </div>

                    <div>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Termination Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--color-border)', fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        >
                            <option value="Resignation">Resignation (Employee Choice)</option>
                            <option value="Termination">Termination (Company Choice)</option>
                            <option value="End of Contract">End of Contract (Natural Expiry)</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Last Working Day
                            </label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Notice Period (Days)
                            </label>
                            <Input
                                type="number"
                                value={formData.noticePeriod}
                                onChange={(e) => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Reason for Termination
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--color-border)', fontSize: '0.9rem',
                                resize: 'vertical', fontFamily: 'inherit'
                            }}
                            placeholder="Please provide a reason..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="danger">Confirm & Calculate Settlement</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TerminationModal;
