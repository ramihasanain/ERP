import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { useCustomPost } from '@/hooks/useMutation';
import { translateApiError } from '@/utils/translateApiError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailExistsInResponse = (response) => {
    if (response?.exists === true) return true;
    if (response?.data?.exists === true) return true;
    return false;
};

const SignUp = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const checkEmailMutation = useCustomPost('/register/check-email/');
    const [showPassword, setShowPassword] = useState(false);
    const {
        control,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm({
        defaultValues: {
            fullName: '',
            companyName: '',
            email: '',
            password: '',
        },
    });

    const validateEmail = useCallback((value) => {
        const trimmed = (value || '').trim();
        if (!trimmed) return t('signUp.emailRequired');
        if (trimmed !== trimmed.toLowerCase()) return t('signUp.emailLowercase');
        if (!EMAIL_PATTERN.test(trimmed)) return t('signUp.emailInvalid');
        return true;
    }, [t]);

    const onSubmit = async (values) => {
        const email = values.email.trim().toLowerCase();
        clearErrors('email');

        let response;
        try {
            response = await checkEmailMutation.mutateAsync({ email });
        } catch (error) {
            const message = translateApiError(error, 'auth:signUp.emailVerifyFailed');
            setError('email', { type: 'server', message });
            toast.error(message, errorToastOptions);
            return;
        }

        if (emailExistsInResponse(response)) {
            const message = t('signUp.emailExists');
            setError('email', { type: 'server', message });
            toast.error(message, errorToastOptions);
            return;
        }

        toast.success(t('signUp.successToast'), successToastOptions);
        navigate('/onboarding', {
            state: {
                signupData: {
                    full_name: values.fullName,
                    email,
                    password: values.password,
                    company_name: values.companyName || values.fullName,
                },
            },
        });
    };

    return (
        <AuthLayout
            title={t('signUp.title')}
            subtitle={t('signUp.subtitle')}
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Controller
                    name="fullName"
                    control={control}
                    rules={{ required: t('signUp.fullNameRequired') }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('signUp.fullName')}
                            placeholder={t('signUp.fullNamePlaceholder')}
                            startIcon={<User size={18} />}
                            error={errors.fullName?.message}
                            required
                        />
                    )}
                />

                <Controller
                    name="companyName"
                    control={control}
                    rules={{ required: t('signUp.companyNameRequired') }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('signUp.companyName')}
                            placeholder={t('signUp.companyNamePlaceholder')}
                            startIcon={<User size={18} />}
                            error={errors.companyName?.message}
                            required
                        />
                    )}
                />

                <Controller
                    name="email"
                    control={control}
                    rules={{ validate: validateEmail }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('signUp.email')}
                            type="email"
                            placeholder={t('signUp.emailPlaceholder')}
                            startIcon={<Mail size={18} />}
                            error={errors.email?.message}
                            onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                            required
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    rules={{ required: t('signUp.passwordRequired') }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={t('signUp.password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('signUp.passwordPlaceholder')}
                            startIcon={<Lock size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? t('signUp.hidePassword') : t('signUp.showPassword')}
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
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                            endIconInteractive
                            error={errors.password?.message}
                            required
                        />
                    )}
                />

                <Button type="submit" size="lg" isLoading={checkEmailMutation.isPending} icon={<ArrowRight size={18} />}>
                    {t('signUp.submit')}
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                {t('signUp.hasAccount')}{' '}
                <Link to="/auth/signin" className="auth-inline-link" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    {t('signUp.signIn')}
                </Link>
            </div>
            <style>{`
                .auth-inline-link {
                    text-decoration: none;
                    transition: color 0.2s ease, opacity 0.2s ease;
                }

                .auth-inline-link:hover {
                    color: var(--color-primary-700);
                    opacity: 0.9;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
            `}</style>
        </AuthLayout>
    );
};

export default SignUp;
