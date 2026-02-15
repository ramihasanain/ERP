import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} color="var(--color-error)" />;
            case 'success': return <CheckCircle size={24} color="var(--color-success)" />;
            case 'info': return <Info size={24} color="var(--color-primary)" />;
            default: return <AlertTriangle size={24} color="var(--color-warning)" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'danger': return 'var(--color-error-50)';
            case 'success': return 'var(--color-success-50)';
            case 'info': return 'var(--color-primary-50)';
            default: return 'var(--color-warning-50)';
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: 'white', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '500px',
                boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{
                    padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', background: getHeaderColor()
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getIcon()}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{title}</h3>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {message}
                </div>

                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-slate-50)' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                            background: 'white', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
                            background: type === 'danger' ? 'var(--color-error)' : 'var(--color-primary)',
                            color: 'white', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
