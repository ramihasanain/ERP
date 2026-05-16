import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { translateApiError } from '@/utils/translateApiError';

const PUBLIC_API_URL = import.meta.env.VITE_API_BASE_URL;

const AuditorFirstLoginResetPassword = () => {
    const { t } = useTranslation(['auditor', 'common']);
    const navigate = useNavigate();
    const location = useLocation();
    const accessToken = location.state?.accessToken;
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!accessToken) {
        return <Navigate to="/auditor/login" replace />;
    }

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            await axios.post(
                `${PUBLIC_API_URL}/change-password-first-login/`,
                values,
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            toast.success(t('auditor:resetPassword.success'), successToastOptions);
            navigate('/auditor/login', { replace: true });
        } catch (err) {
            toast.error(
                translateApiError(err, 'auditor:resetPassword.failed'),
                errorToastOptions,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title={t('auditor:resetPassword.title')}
            subtitle={t('auditor:resetPassword.subtitle')}
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Controller
                    name="current_password"
                    control={control}
                    rules={{ required: t('auditor:resetPassword.currentPasswordRequired') }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('auditor:resetPassword.currentPassword')}
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder={t('auditor:resetPassword.currentPasswordPlaceholder')}
                            startIcon={<Lock size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('current')}
                                    aria-label={showPassword.current ? t('auditor:resetPassword.hideCurrentPassword') : t('auditor:resetPassword.showCurrentPassword')}
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
                        required: t('auditor:resetPassword.newPasswordRequired'),
                        minLength: {
                            value: 8,
                            message: t('auditor:resetPassword.passwordMinLength'),
                        },
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('auditor:resetPassword.newPassword')}
                            type={showPassword.next ? 'text' : 'password'}
                            placeholder={t('auditor:resetPassword.newPasswordPlaceholder')}
                            startIcon={<KeyRound size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('next')}
                                    aria-label={showPassword.next ? t('auditor:resetPassword.hideNewPassword') : t('auditor:resetPassword.showNewPassword')}
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
                        required: t('auditor:resetPassword.confirmPasswordRequired'),
                        validate: (value) => value === newPassword || t('auditor:resetPassword.passwordsMismatch'),
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('auditor:resetPassword.confirmPassword')}
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder={t('auditor:resetPassword.confirmPasswordPlaceholder')}
                            startIcon={<ShieldCheck size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('confirm')}
                                    aria-label={showPassword.confirm ? t('auditor:resetPassword.hideConfirmPassword') : t('auditor:resetPassword.showConfirmPassword')}
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

                <Button type="submit" size="lg" isLoading={isSubmitting}>
                    {t('auditor:resetPassword.submit')}
                </Button>
            </form>
        </AuthLayout>
    );
};

export default AuditorFirstLoginResetPassword;
