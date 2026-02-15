import React from 'react';
import Input from '../../components/common/Input';

const StepRegionalSettings = ({ data, updateData }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Regional Settings</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Base Currency</label>
                <select
                    value={data.currency}
                    onChange={(e) => updateData('currency', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                >
                    <option value="JOD">Jordanian Dinar (JOD)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="SYP">Syrian Pound (SYP)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">States Dollar (USD)</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Default Language</label>
                <select
                    value={data.language}
                    onChange={(e) => updateData('language', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                >
                    <option value="ar">Arabic (RTL)</option>
                    <option value="en">English (LTR)</option>
                    <option value="de">German (LTR)</option>
                </select>
            </div>

            <div style={{ padding: '1rem', background: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Auto-Configuration</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Based on your selection of <strong>{data.country.toUpperCase()}</strong>, we will automatically apply localized tax rules, chart of accounts, and payroll policies.
                </p>
            </div>
        </div>
    );
};

export default StepRegionalSettings;
