import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getMaxWidth = () => {
        switch (size) {
            case 'sm': return '400px';
            case 'lg': return '800px';
            case 'xl': return '1000px';
            default: return '600px'; // md
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: getMaxWidth(),
                boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{
                    padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-secondary)',
                    borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)'
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', background: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
