import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { successToastOptions } from '@/utils/toastOptions';

const SignUp = () => {
    const navigate = useNavigate();
    const { isLoading } = useAuth();
    const {
        control,
        handleSubmit,
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
        toast.success('Great start. Complete onboarding to finish account setup.', successToastOptions);
        navigate('/onboarding', {
            state: {
                signupData: {
                    full_name: values.fullName,
                    email: values.email,
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
                    rules={{ required: 'Email is required' }}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            startIcon={<Mail size={18} />}
                            error={errors.email?.message}
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
                            type="password"
                            placeholder="Create a strong password"
                            startIcon={<Lock size={18} />}
                            error={errors.password?.message}
                            required
                        />
                    )}
                />

                <Button type="submit" size="lg" isLoading={isLoading} icon={<ArrowRight size={18} />}>
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
