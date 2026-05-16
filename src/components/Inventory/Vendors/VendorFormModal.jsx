import React from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import Modal from '@/components/Shared/Modal';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';

const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 500,
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
};
const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};
const errorStyle = { marginTop: '0.35rem', marginBottom: 0, color: 'var(--color-error)', fontSize: '0.8rem' };

const VendorFormModal = ({
    isOpen,
    isEditing,
    isLoadingDetails,
    onClose,
    onSubmit,
    register,
    handleSubmit,
    control,
    errors,
    isDirty,
    isSubmitting,
}) => {
    const { t } = useTranslation(['inventory', 'common']);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('vendors.editTitle') : t('vendors.addTitle')} size="md">
            {isEditing && isLoadingDetails ? (
                <Spinner />
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="vendor-form-grid">
                        <div>
                            <label style={labelStyle}>Vendor Name</label>
                            <input
                                {...register('name', { required: 'Vendor name is required.' })}
                                style={inputStyle}
                                placeholder="Updated Office Supplies Co."
                            />
                            {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Tax ID</label>
                            <input
                                {...register('tax_id')}
                                style={inputStyle}
                                placeholder="TAX-123456"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Website</label>
                            <input
                                {...register('website')}
                                style={inputStyle}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Contact Person</label>
                            <input
                                {...register('contact_person', { required: 'Contact person is required.' })}
                                style={inputStyle}
                                placeholder="Sarah Jenkins"
                            />
                            {errors.contact_person && <p style={errorStyle}>{errors.contact_person.message}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required.',
                                    pattern: {
                                        value: /^\S+@\S+\.\S+$/,
                                        message: 'Enter a valid email.',
                                    },
                                })}
                                style={inputStyle}
                                placeholder="orders@example.com"
                            />
                            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input
                                {...register('phone', { required: 'Phone number is required.' })}
                                style={inputStyle}
                                placeholder="+1 (555) 123-4567"
                            />
                            {errors.phone && <p style={errorStyle}>{errors.phone.message}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Address</label>
                            <input
                                {...register('address')}
                                style={inputStyle}
                                placeholder="Street, City, Country"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Payment Terms</label>
                            <Controller
                                name="payment_terms"
                                control={control}
                                rules={{ required: 'Payment terms are required.' }}
                                render={({ field }) => (
                                    <select {...field} style={inputStyle}>
                                        <option value="net_15">Net 15</option>
                                        <option value="net_30">Net 30</option>
                                        <option value="net_45">Net 45</option>
                                        <option value="net_60">Net 60</option>
                                    </select>
                                )}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Status</label>
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        value={field.value ? 'true' : 'false'}
                                        onChange={(event) => field.onChange(event.target.value === 'true')}
                                        style={inputStyle}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                )}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={onClose}>{t('actions.cancel', { ns: 'common' })}</Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            disabled={isEditing && !isDirty}
                        >
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            )}
            <style>{`
                .vendor-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 1rem;
                }

                @media (max-width: 768px) {
                    .vendor-form-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default VendorFormModal;
