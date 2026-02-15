import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

const SignUp = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            navigate('/onboarding');
        }, 1500);
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Start your 14-day free trial"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    startIcon={<User size={18} />}
                    required
                />

                <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    startIcon={<Mail size={18} />}
                    required
                />

                <Input
                    label="Password"
                    type="password"
                    placeholder="Create a strong password"
                    startIcon={<Lock size={18} />}
                    required
                />

                <Button type="submit" size="lg" isLoading={loading} icon={<ArrowRight size={18} />}>
                    Create Account
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Already have an account?{' '}
                <Link to="/auth/signin" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
