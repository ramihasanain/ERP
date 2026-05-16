import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { usePayroll } from '@/context/PayrollContext';
import { Save, Shield, Info, AlertTriangle } from 'lucide-react';

const SocialSecuritySettings = () => {
    const { t } = useTranslation(['hr', 'common']);

    const { socialSecurityConfig, setSocialSecurityConfig, salaryComponents } = usePayroll();
    const [localConfig, setLocalConfig] = useState({ ...socialSecurityConfig });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {

        setIsSaving(true);
        setTimeout(() => {
            setSocialSecurityConfig(localConfig);
            setIsSaving(false);
            alert('Social Security rules updated successfully!');
        }, 800);
    };

    const toggleEarning = (code) => {
        const current = localConfig.applyToEarnings || [];
        const next = current.includes(code)
            ? current.filter(c => c !== code)
            : [...current, code];
        setLocalConfig({ ...localConfig, applyToEarnings: next });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Social Security (GOSI) Rules</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Configure contribution rates and salary calculation bases.</p>
                </div>
                <Button variant="primary" icon={<Save size={18} />} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Rules'}
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card className="padding-lg">
                        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield className="text-primary-600" size={20} /> Contribution Rates
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Employee Contribution (%)</label>
                                <div style={{ position: 'relative' }}>
                                    <Input
                                        type="number"
                                        value={localConfig.employeeRate}
                                        onChange={e => setLocalConfig({ ...localConfig, employeeRate: Number(e.target.value) })}
                                    />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>%</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Employer Contribution (%)</label>
                                <div style={{ position: 'relative' }}>
                                    <Input
                                        type="number"
                                        value={localConfig.employerRate}
                                        onChange={e => setLocalConfig({ ...localConfig, employerRate: Number(e.target.value) })}
                                    />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>%</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="padding-lg">
                        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Salary Limits & Bases</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Minimum Salary Base (JOD)</label>
                                <Input
                                    type="number"
                                    value={localConfig.minSalary}
                                    onChange={e => setLocalConfig({ ...localConfig, minSalary: Number(e.target.value) })}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Minimum salary subject to contribution.</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Maximum Salary Cap (JOD)</label>
                                <Input
                                    type="number"
                                    value={localConfig.maxSalary}
                                    onChange={e => setLocalConfig({ ...localConfig, maxSalary: Number(e.target.value) })}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Contributions are capped at this amount.</p>
                            </div>
                        </div>

                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Applicable Earnings Components</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {salaryComponents.filter(c => c.type === 'Earning').map(comp => (
                                <div
                                    key={comp.id}
                                    onClick={() => toggleEarning(comp.code)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        border: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        background: localConfig.applyToEarnings.includes(comp.code) ? 'var(--color-primary-50)' : 'transparent',
                                        borderColor: localConfig.applyToEarnings.includes(comp.code) ? 'var(--color-primary-600)' : 'var(--color-border)',
                                        color: localConfig.applyToEarnings.includes(comp.code) ? 'var(--color-primary-700)' : 'var(--color-text-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {comp.name}
                                    {localConfig.applyToEarnings.includes(comp.code) && <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card className="padding-md" style={{ background: 'var(--color-slate-50)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-primary-700)' }}>
                            <Info size={20} />
                            <h4 style={{ fontWeight: 600 }}>SS Calculation Logic</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            GOSI = Basis * Rate
                            <br /><br />
                            Basis is the sum of selected earnings,
                            constrained between the <b>Minimum Base</b> and <b>Maximum Cap</b>.
                        </p>
                    </Card>

                    <Card className="padding-md" style={{ border: '1px solid var(--color-warning-100)', background: 'var(--color-warning-50)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-warning-700)' }}>
                            <AlertTriangle size={20} />
                            <h4 style={{ fontWeight: 600 }}>Compliance Warning</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-warning-800)', lineHeight: 1.5 }}>
                            Changes to these rules will affect the next payroll calculation for all employees assigned to structures containing the SS component.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SocialSecuritySettings;
