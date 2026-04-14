import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Shield, LogIn, ArrowLeft, Building2 } from 'lucide-react';
import { useAudit } from '@/context/AuditContext';

const AuditorLogin = () => {
    const navigate = useNavigate();
    const { loginAuditor, registerFirm } = useAudit();
    const [mode, setMode] = useState('login'); // login | register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Registration
    const [regForm, setRegForm] = useState({
        name: '', licenseNumber: '', email: '', phone: '',
        address: '', contactPerson: '', specialization: '', password: ''
    });

    const handleLogin = () => {
        setError('');
        const firm = loginAuditor(email, password);
        if (firm) {
            navigate('/auditor/dashboard');
        } else {
            setError('Invalid credentials. Please check your email and password.');
        }
    };

    const handleRegister = () => {
        if (!regForm.name || !regForm.email || !regForm.password || !regForm.licenseNumber) {
            setError('Please fill all required fields.');
            return;
        }
        registerFirm(regForm);
        setMode('login');
        setEmail(regForm.email);
        setError('');
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)'
        }}>
            <div style={{ width: '100%', maxWidth: mode === 'register' ? '600px' : '420px', padding: '2rem' }}>
                {/* Back to main */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button onClick={() => navigate('/auth/signin')} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
                    }}>
                        <ArrowLeft size={16} /> Back to Main Login
                    </button>
                </div>

                <Card className="padding-lg" style={{ borderRadius: '16px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '4rem', height: '4rem', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <Shield size={28} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                            {mode === 'login' ? 'Auditor Portal' : 'Register Audit Firm'}
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                            {mode === 'login' ? 'Sign in to review and audit financial statements.' : 'Create your audit firm account.'}
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem', borderRadius: '8px', background: 'var(--color-error-dim)',
                            color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {mode === 'login' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="audit@company.com"
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />

                            <Button onClick={handleLogin} icon={<LogIn size={18} />} style={{ width: '100%', marginTop: '0.5rem' }}>
                                Sign In as Auditor
                            </Button>

                            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                    Don't have an audit account?
                                </p>
                                <Button variant="outline" size="sm" icon={<Building2 size={14} />} onClick={() => { setMode('register'); setError(''); }}>
                                    Register Audit Firm
                                </Button>
                            </div>

                            <div style={{
                                padding: '0.75rem', borderRadius: '8px', background: 'var(--color-primary-50)',
                                fontSize: '0.75rem', color: 'var(--color-primary-700)'
                            }}>
                                <strong>Demo:</strong> Use <code>audit@deloitte.jo</code> / <code>demo123</code>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Firm Name *" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="e.g. ABC Audit" />
                                <Input label="License Number *" value={regForm.licenseNumber} onChange={e => setRegForm({ ...regForm, licenseNumber: e.target.value })} placeholder="AUD-XXXX" />
                                <Input label="Email *" type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} placeholder="audit@firm.com" />
                                <Input label="Phone" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} placeholder="+962..." />
                                <Input label="Contact Person" value={regForm.contactPerson} onChange={e => setRegForm({ ...regForm, contactPerson: e.target.value })} />
                                <Input label="Specialization" value={regForm.specialization} onChange={e => setRegForm({ ...regForm, specialization: e.target.value })} placeholder="e.g. Tax & Assurance" />
                            </div>
                            <Input label="Address" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} />
                            <Input label="Password *" type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <Button variant="ghost" onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1 }}>Cancel</Button>
                                <Button onClick={handleRegister} icon={<Building2 size={16} />} style={{ flex: 1 }}>Register Firm</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AuditorLogin;
