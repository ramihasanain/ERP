import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { useCustomPost } from '@/hooks/useMutation';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_EXISTS_MESSAGE = 'This email already exists. Please sign in or use a different email.';

const validateEmail = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Email is required';
    if (trimmed !== trimmed.toLowerCase()) return 'Email must be in lowercase';
    if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address';
    return true;
};

const emailExistsInResponse = (response) => {
    if (response?.exists === true) return true;
    if (response?.data?.exists === true) return true;
    return false;
};

const SignUp = () => {
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

    const onSubmit = async (values) => {
        const email = values.email.trim().toLowerCase();
        clearErrors('email');

        let response;
        try {
            response = await checkEmailMutation.mutateAsync({ email });
        } catch (error) {
            const message = getApiErrorMessage(error, 'Could not verify this email. Please try again.');
            setError('email', { type: 'server', message });
            toast.error(message, errorToastOptions);
            return;
        }

        if (emailExistsInResponse(response)) {
            setError('email', { type: 'server', message: EMAIL_EXISTS_MESSAGE });
            toast.error(EMAIL_EXISTS_MESSAGE, errorToastOptions);
            return;
        }

        toast.success('Great start. Complete onboarding to finish account setup.', successToastOptions);
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
            title="Create an account"
            subtitle="Start your 14-day free trial"
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Controller
                    name="fullName"
                    control={control}
                    rules={{ required: 'Full name is required' }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Full Name"
                            placeholder="John Doe"
                            startIcon={<User size={18} />}
                            error={errors.fullName?.message}
                            required
                        />
                    )}
                />

                <Controller
                    name="companyName"
                    control={control}
                    rules={{ required: 'Company name is required' }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Company Name"
                            placeholder="Your company"
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
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
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
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            startIcon={<Lock size={18} />}
                            endIcon={(
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    Create Account
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Already have an account?{' '}
                <Link to="/auth/signin" className="auth-inline-link" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    Sign in
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
