import React from 'react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';

const ContractTemplateDeleteModal = ({ templateToDelete, isDeleting, onCancel, onConfirmDelete }) => {
    if (!templateToDelete) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
                padding: '1rem',
            }}
        >
            <Card className="padding-lg" style={{ width: '100%', maxWidth: '460px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    Delete template?
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                    Are you sure you want to delete <strong>{templateToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirmDelete} isLoading={isDeleting}>
                        Delete
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ContractTemplateDeleteModal;
