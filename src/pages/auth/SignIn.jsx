import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, ArrowRight, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Role Toggle */}
                <div style={{ display: 'flex', background: 'var(--color-slate-100)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        type="button"
                        onClick={() => setRole('admin')}
                        style={{
                            flex: 1, padding: '0.75rem', border: 'none', borderRadius: '10px',
                            background: role === 'admin' ? 'var(--color-primary-600)' : 'transparent',
                            color: role === 'admin' ? 'white' : 'var(--color-slate-600)',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: role === 'admin' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                        }}
                    >
                        <Shield size={18} /> Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('employee')}
                        style={{
                            flex: 1, padding: '0.75rem', border: 'none', borderRadius: '10px',
                            background: role === 'employee' ? 'var(--color-primary-600)' : 'transparent',
                            color: role === 'employee' ? 'white' : 'var(--color-slate-600)',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: role === 'employee' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
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
                    padding: '0.75rem', borderRadius: '8px', background: 'var(--color-slate-50)',
                    fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center'
                }}>
                    💡 Demo mode — enter any email/password to login
                </div>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                Don't have an account?{' '}
                <Link to="/auth/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    Create account
                </Link>
            </div>

            <div style={{
                marginTop: '1rem', textAlign: 'center', padding: '0.75rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f172a08, #1e3a5f12)',
                border: '1px solid #1e3a5f20'
            }}>
                <Link to="/auditor/login" style={{
                    fontSize: '0.85rem', color: '#1e3a5f', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    textDecoration: 'none'
                }}>
                    <Shield size={16} /> Auditor Portal — External Auditor Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default SignIn;
