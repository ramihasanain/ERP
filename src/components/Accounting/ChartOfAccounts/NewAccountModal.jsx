import React from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, X } from 'lucide-react';

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
};

const selectWrapperStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' };
const selectStyle = {
    height: '3rem',
    padding: '0 1rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
    fontWeight: 500,
};

const NewAccountModal = ({
    open,
    accountTypes,
    parentOptions,
    onAccountTypeChange,
    defaultTypeId,
    onClose,
    onSubmit,
    isSubmitting,
    isParentLoading,
}) => {
    const { t } = useTranslation('accounting');
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            code: '',
            name: '',
            description: '',
            accountTypeId: defaultTypeId || '',
            parentId: '',
            isActive: true,
            order: 0,
        },
    });

    const selectedType = useWatch({
        control,
        name: 'accountTypeId',
    });

    React.useEffect(() => {
        if (open) {
            reset({
                code: '',
                name: '',
                description: '',
                accountTypeId: defaultTypeId || '',
                parentId: '',
                isActive: true,
                order: 0,
            });
        }
    }, [defaultTypeId, open, reset]);

    React.useEffect(() => {
        if (open && onAccountTypeChange) {
            onAccountTypeChange(selectedType || '');
        }
    }, [onAccountTypeChange, open, selectedType]);

    if (!open) return null;

    const submitForm = handleSubmit((values) => {
        onSubmit({
            code: values.code,
            name: values.name,
            description: values.description,
            account_type: values.accountTypeId,
            parent: values.parentId || null,
            is_active: values.isActive,
            order: Number(values.order) || 0,
        });
    });

    return (
        <div style={modalOverlayStyle}>
            <Card
                className="padding-xl"
                style={{
                    width: '550px',
                    maxWidth: '95%',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                        {t('chartOfAccounts.modalAdd')}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-surface))',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                            padding: '8px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Controller
                        name="code"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Input
                                label={t('chartOfAccounts.codeLabel')}
                                placeholder={t('chartOfAccounts.codePlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.code ? t('chartOfAccounts.required') : ''}
                            />
                        )}
                    />

                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Input
                                label={t('chartOfAccounts.displayName')}
                                placeholder={t('chartOfAccounts.displayNamePlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.name ? t('chartOfAccounts.required') : ''}
                            />
                        )}
                    />

                    <Controller
                        name="accountTypeId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <div style={selectWrapperStyle}>
                                <label style={labelStyle}>{t('chartOfAccounts.accountType')}</label>
                                <select {...field} style={selectStyle}>
                                    <option value="">{t('chartOfAccounts.selectType')}</option>
                                    {accountTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    />

                    <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                            <div style={selectWrapperStyle}>
                                <label style={labelStyle}>{t('chartOfAccounts.parentNode')}</label>
                                <select {...field} style={selectStyle} disabled={!selectedType || isParentLoading}>
                                    <option value="">{t('chartOfAccounts.topLevel')}</option>
                                    {parentOptions.map((parent) => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.code} - {parent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <Input
                                label={t('chartOfAccounts.description')}
                                placeholder="..."
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    <Controller
                        name="order"
                        control={control}
                        render={({ field }) => (
                            <Input
                                label={t('chartOfAccounts.order')}
                                type="number"
                                value={String(field.value)}
                                onChange={(event) => field.onChange(event.target.value)}
                            />
                        )}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('chartOfAccounts.discard')}
                        </Button>
                        <Button type="submit" icon={<Save size={18} />} size="lg" disabled={isSubmitting}>
                            {isSubmitting ? t('chartOfAccounts.saving') : t('chartOfAccounts.save')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default NewAccountModal;
