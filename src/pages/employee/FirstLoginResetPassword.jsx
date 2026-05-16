import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { useAuth } from '@/context/AuthContext';
import { useCustomPost } from '@/hooks/useMutation';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { translateApiError } from '@/utils/translateApiError';

const FirstLoginResetPassword = () => {
    const { t } = useTranslation(['employee', 'common']);
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const changePasswordMutation = useCustomPost('/api/change-password-first-login/');
    const [showPassword, setShowPassword] = useState({
        current: false,
        next: false,
        confirm: false,
    });
    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            current_password: '',
            new_password: '',
            confirm_password: '',
        },
    });

    const newPassword = watch('new_password');
    const toggleVisibility = (field) => {
        setShowPassword((currentState) => ({
            ...currentState,
            [field]: !currentState[field],
        }));
    };

    const onSubmit = async (values) => {
        try {
            await changePasswordMutation.mutateAsync(values);
            updateUser({ reset_password_required: false });
            toast.success(t('employee:resetPassword.success'), successToastOptions);
            navigate('/employee/dashboard', { replace: true });
        } catch (err) {
            toast.error(
                translateApiError(err, 'employee:resetPassword.failed'),
                errorToastOptions,
            );
        }
    };

    return (
        <AuthLayout
            title={t('employee:resetPassword.title')}
            subtitle={t('employee:resetPassword.subtitle')}
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Controller
                    name="current_password"
                    control={control}
                    rules={{ required: t('employee:resetPassword.validation.currentRequired') }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('employee:resetPassword.currentPassword')}
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder={t('employee:resetPassword.currentPasswordPlaceholder')}
                            startIcon={<Lock size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('current')}
                                    aria-label={
                                        showPassword.current
                                            ? t('employee:resetPassword.hideCurrentPassword')
                                            : t('employee:resetPassword.showCurrentPassword')
                                    }
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                            endIconInteractive
                            error={errors.current_password?.message}
                            required
                        />
                    )}
                />

                <Controller
                    name="new_password"
                    control={control}
                    rules={{
                        required: t('employee:resetPassword.validation.newRequired'),
                        minLength: {
                            value: 8,
                            message: t('employee:resetPassword.validation.minLength'),
                        },
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('employee:resetPassword.newPassword')}
                            type={showPassword.next ? 'text' : 'password'}
                            placeholder={t('employee:resetPassword.newPasswordPlaceholder')}
                            startIcon={<KeyRound size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('next')}
                                    aria-label={
                                        showPassword.next
                                            ? t('employee:resetPassword.hideNewPassword')
                                            : t('employee:resetPassword.showNewPassword')
                                    }
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword.next ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                            endIconInteractive
                            error={errors.new_password?.message}
                            required
                        />
                    )}
                />

                <Controller
                    name="confirm_password"
                    control={control}
                    rules={{
                        required: t('employee:resetPassword.validation.confirmRequired'),
                        validate: (value) =>
                            value === newPassword || t('employee:resetPassword.validation.mismatch'),
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('employee:resetPassword.confirmPassword')}
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder={t('employee:resetPassword.confirmPasswordPlaceholder')}
                            startIcon={<ShieldCheck size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('confirm')}
                                    aria-label={
                                        showPassword.confirm
                                            ? t('employee:resetPassword.hideConfirmPassword')
                                            : t('employee:resetPassword.showConfirmPassword')
                                    }
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                            endIconInteractive
                            error={errors.confirm_password?.message}
                            required
                        />
                    )}
                />

                <Button type="submit" size="lg" isLoading={changePasswordMutation.isPending}>
                    {t('employee:resetPassword.changePassword')}
                </Button>
            </form>
        </AuthLayout>
    );
};

export default FirstLoginResetPassword;
