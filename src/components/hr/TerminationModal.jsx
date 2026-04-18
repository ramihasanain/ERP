import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { useCustomPost } from '@/hooks/useMutation';

const TerminationModal = ({ isOpen, onClose, employeeId, employee, onConfirm }) => {
    const [formData, setFormData] = useState({
        termination_type: 'resignation',
        last_working_day: new Date().toISOString().split('T')[0],
        reason: '',
        notice_period_days: 30,
    });

    const calculateMutation = useCustomPost(
        `/api/hr/employees/${employeeId || ''}/termination/calculate/`,
        [['hr-employee', employeeId]]
    );

    if (!isOpen) return null;

    if (!employeeId) {
        return null;
    }

    const displayName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'this employee';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            termination_type: formData.termination_type,
            last_working_day: formData.last_working_day,
            notice_period_days: Number(formData.notice_period_days) || 0,
            reason: formData.reason?.trim() || '',
        };

        try {
            const response = await calculateMutation.mutateAsync(payload);
            onConfirm(response);
            onClose();
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not calculate termination.';
            toast.error(typeof message === 'string' ? message : 'Could not calculate termination.');
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    width: '500px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} color="var(--color-warning)" />
                        End Service / Terminate Employee
                    </h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="var(--color-text-muted)" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div
                        style={{
                            padding: '0.75rem',
                            backgroundColor: 'var(--color-warning-dim)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: 'var(--color-warning-dark)',
                        }}
                    >
                        You are about to end the service for <strong>{displayName}</strong>. This action will calculate their final settlement.
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Termination Type
                        </label>
                        <select
                            value={formData.termination_type}
                            onChange={(e) => setFormData({ ...formData, termination_type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                outline: 'none',
                            }}
                        >
                            <option value="resignation">Resignation (Employee Choice)</option>
                            <option value="termination">Termination (Company Choice)</option>
                            <option value="end_of_contract">End of Contract (Natural Expiry)</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Last Working Day
                            </label>
                            <Input
                                type="date"
                                value={formData.last_working_day}
                                onChange={(e) => setFormData({ ...formData, last_working_day: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Notice Period (Days)
                            </label>
                            <Input
                                type="number"
                                value={formData.notice_period_days}
                                onChange={(e) =>
                                    setFormData({ ...formData, notice_period_days: parseInt(e.target.value, 10) || 0 })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Reason for Termination
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                            placeholder="Please provide a reason..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={calculateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="danger" isLoading={calculateMutation.isPending}>
                            Confirm & Calculate Settlement
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TerminationModal;
