import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const SignIn = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            navigate('/onboarding'); // Redirect to onboarding for demo flow
        }, 1500);
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    startIcon={<Mail size={18} />}
                    required
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        startIcon={<Lock size={18} />}
                        required
                    />
                    <div style={{ textAlign: 'right' }}>
                        <Link to="/auth/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)' }}>
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" size="lg" isLoading={loading} icon={<ArrowRight size={18} />}>
                    Sign In
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Don't have an account?{' '}
                <Link to="/auth/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    Create account
                </Link>
            </div>
        </AuthLayout>
    );
};

export default SignIn;
