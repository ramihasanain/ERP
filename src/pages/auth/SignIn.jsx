import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '@/components/Shared/Input';
import Button from '@/components/Shared/Button';
import { Mail, Lock, ArrowRight, Shield, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';

const trackStyle = {
    display: 'flex',
    background: 'var(--color-bg-toggle-track)',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
};

const tabBase = {
    flex: 1,
    padding: '0.75rem',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
};

const SignIn = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: '',
            password: '',
            role: 'admin',
        },
    });

    const onSubmit = async (values) => {
        try {
            const user = await login(values.email, values.password, values.role);
            toast.success(`Welcome back, ${user?.name || 'User'}!`, successToastOptions);
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/employee/dashboard');
            }
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                'Sign in failed. Please verify your credentials.';
            toast.error(message, errorToastOptions);
        }
    };

    const role = watch('role');
    const adminActive = role === 'admin';
    const employeeActive = role === 'employee';

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={trackStyle}>
                    <button
                        type="button"
                        onClick={() => setValue('role', 'admin')}
                        className={`auth-role-tab ${adminActive ? 'active' : ''}`}
                        style={{
                            ...tabBase,
                            background: adminActive ? 'var(--color-primary-600)' : 'transparent',
                            color: adminActive ? 'white' : 'var(--color-text-secondary)',
                            boxShadow: adminActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                        }}
                    >
                        <Shield size={18} /> Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setValue('role', 'employee')}
                        className={`auth-role-tab ${employeeActive ? 'active' : ''}`}
                        style={{
                            ...tabBase,
                            background: employeeActive ? 'var(--color-primary-600)' : 'transparent',
                            color: employeeActive ? 'white' : 'var(--color-text-secondary)',
                            boxShadow: employeeActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                        }}
                    >
                        <User size={18} /> Employee
                    </button>
                </div>

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: 'Password is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
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
                    <div style={{ textAlign: 'right' }}>
                        <Link to="/auth/forgot-password" className="auth-inline-link" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)' }}>
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" size="lg" isLoading={isLoading} icon={<ArrowRight size={18} />}>
                    Sign In as {role === 'admin' ? 'Admin' : 'Employee'}
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Don&apos;t have an account?{' '}
                <Link to="/auth/signup" className="auth-inline-link" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    Create account
                </Link>
            </div>

            <div style={{
                marginTop: '1rem',
                textAlign: 'center',
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))',
                border: '1px solid var(--color-border)',
            }}
            >
                <Link
                    to="/auditor/login"
                    className="auditor-link"
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-primary-500)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                    }}
                >
                    <Shield size={16} /> Auditor Portal — External Auditor Login
                </Link>
            </div>
            <style>{`
                .auth-role-tab:hover {
                    transform: translateY(-1px);
                }

                .auth-role-tab.active:hover {
                    transform: translateY(-1px) scale(1.01);
                }

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

                .auditor-link {
                    transition: transform 0.2s ease, color 0.2s ease;
                }

                .auditor-link:hover {
                    transform: translateY(-1px);
                    color: var(--color-primary-600);
                }
            `}</style>
        </AuthLayout>
    );
};

export default SignIn;
