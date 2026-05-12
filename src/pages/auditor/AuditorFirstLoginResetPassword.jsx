import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';

const PUBLIC_API_URL = import.meta.env.VITE_API_BASE_URL;

const AuditorFirstLoginResetPassword = () => {
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
            toast.success(
                'Password changed successfully. Please sign in with your new password.',
                successToastOptions,
            );
            navigate('/auditor/login', { replace: true });
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                'Failed to change password. Please try again.';
            toast.error(message, errorToastOptions);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Set your new password"
            subtitle="For security, you need to change your temporary password before continuing."
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Controller
                    name="current_password"
                    control={control}
                    rules={{ required: 'Current password is required' }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Current Password"
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder="Enter current password"
                            startIcon={<Lock size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('current')}
                                    aria-label={showPassword.current ? 'Hide current password' : 'Show current password'}
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
                        required: 'New password is required',
                        minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                        },
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="New Password"
                            type={showPassword.next ? 'text' : 'password'}
                            placeholder="Enter new password"
                            startIcon={<KeyRound size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('next')}
                                    aria-label={showPassword.next ? 'Hide new password' : 'Show new password'}
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
                        required: 'Please confirm your new password',
                        validate: (value) => value === newPassword || 'Passwords do not match',
                    }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Confirm New Password"
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder="Re-enter new password"
                            startIcon={<ShieldCheck size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility('confirm')}
                                    aria-label={showPassword.confirm ? 'Hide confirm password' : 'Show confirm password'}
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
                    Change Password
                </Button>
            </form>
        </AuthLayout>
    );
};

export default AuditorFirstLoginResetPassword;
