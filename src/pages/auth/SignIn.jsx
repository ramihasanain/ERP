import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Input from '../../components/Shared/Input';
import Button from '../../components/Shared/Button';
import { Mail, Lock, ArrowRight, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = await login(email, password, role);
        if (user.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            navigate('/employee/dashboard');
        }
    };

    const adminActive = role === 'admin';
    const employeeActive = role === 'employee';

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={trackStyle}>
                    <button
                        type="button"
                        onClick={() => setRole('admin')}
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
                        onClick={() => setRole('employee')}
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

                <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    startIcon={<Mail size={18} />}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        startIcon={<Lock size={18} />}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <div style={{ textAlign: 'right' }}>
                        <Link to="/auth/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)' }}>
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" size="lg" isLoading={isLoading} icon={<ArrowRight size={18} />}>
                    Sign In as {role === 'admin' ? 'Admin' : 'Employee'}
                </Button>

                <div style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                }}
                >
                    Demo mode — enter any email/password to login
                </div>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Don&apos;t have an account?{' '}
                <Link to="/auth/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
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
        </AuthLayout>
    );
};

export default SignIn;
