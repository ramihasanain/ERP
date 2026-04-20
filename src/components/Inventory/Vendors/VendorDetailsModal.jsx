import React from 'react';
import Modal from '@/components/Shared/Modal';
import Spinner from '@/core/Spinner';
import { getPaymentTermsLabel } from './utils';

const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--color-border)',
};
const detailLabelStyle = { fontWeight: 600, color: 'var(--color-text-secondary)' };

const VendorDetailsModal = ({ isOpen, isLoading, vendor, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vendor Details" size="md">
            {isLoading ? (
                <Spinner />
            ) : !vendor ? (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Vendor details unavailable.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Name</span>
                        <span>{vendor.name || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Tax ID</span>
                        <span>{vendor.taxId || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Website</span>
                        <span>{vendor.website || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Payment Terms</span>
                        <span>{vendor.paymentTermsDisplay || getPaymentTermsLabel(vendor.paymentTerms)}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Contact Person</span>
                        <span>{vendor.contactPerson || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Phone</span>
                        <span>{vendor.phone || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Email</span>
                        <span>{vendor.email || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Address</span>
                        <span>{vendor.address || '--'}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Status</span>
                        <span>{vendor.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default VendorDetailsModal;
