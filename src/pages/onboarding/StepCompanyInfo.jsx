import React from 'react';
import Input from '../../components/common/Input';
import { Building2, Globe } from 'lucide-react';

const StepCompanyInfo = ({ data, updateData }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Company Details</h3>

            <Input
                label="Company Name"
                placeholder="Acme Corp"
                value={data.companyName}
                onChange={(e) => updateData('companyName', e.target.value)}
                startIcon={<Building2 size={18} />}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Industry</label>
                <select
                    value={data.industry}
                    onChange={(e) => updateData('industry', e.target.value)}
                    style={{
                        height: '2.5rem',
                        padding: '0 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-main)'
                    }}
                >
                    <option value="">Select Industry...</option>
                    <option value="tech">Technology</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Services</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Country</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Globe size={18} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                    <select
                        value={data.country}
                        onChange={(e) => updateData('country', e.target.value)}
                        style={{
                            width: '100%',
                            height: '2.5rem',
                            paddingLeft: '2.5rem',
                            paddingRight: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        <option value="JO">Jordan</option>
                        <option value="SY">Syria</option>
                        <option value="SA">Saudi Arabia</option>
                        <option value="DE">Germany</option>
                        <option value="US">United States</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default StepCompanyInfo;
