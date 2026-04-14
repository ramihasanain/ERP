import React from 'react';

const StepRegionalSettings = ({ data, updateData, options }) => {
    const currencies = options?.currencies || [];
    const languages = options?.languages || [];

    const selectedCountryName =
        options?.countries?.find((country) => country.value === data.country)?.label || 'your country';

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
                    <option value="">Select Currency...</option>
                    {currencies.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                            {currency.label}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Default Language</label>
                <select
                    value={data.language}
                    onChange={(e) => updateData('language', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                >
                    <option value="">Select Language...</option>
                    {languages.map((language) => (
                        <option key={language.value} value={language.value}>
                            {language.label}
                        </option>
                    ))}
                </select>
            </div>

            <div
                style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card))',
                }}
            >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                    Auto-Configuration
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Based on your selection of <strong style={{ color: 'var(--color-text-main)' }}>{selectedCountryName}</strong>, we will automatically apply localized tax rules, chart of accounts, and payroll policies.
                </p>
            </div>
        </div>
    );
};

export default StepRegionalSettings;
