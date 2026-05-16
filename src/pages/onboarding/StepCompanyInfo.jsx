import React from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/components/Shared/Input';
import { Building2, Globe } from 'lucide-react';

const fieldErrorStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-error)',
    marginTop: '0.25rem',
};

const selectStyle = (hasError) => ({
    height: '2.5rem',
    padding: '0 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: hasError ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
});

const StepCompanyInfo = ({ data, updateData, options, errors = {} }) => {
    const { t } = useTranslation('onboarding');
    const industries = options?.industries || [];
    const countries = options?.countries || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('companyInfo.title')}</h3>

            <Input
                label={t('companyInfo.companyName')}
                placeholder={t('companyInfo.companyNamePlaceholder')}
                value={data.companyName}
                onChange={(e) => updateData('companyName', e.target.value)}
                startIcon={<Building2 size={18} />}
                error={errors.companyName}
                required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
                    {t('companyInfo.industry')}
                </label>
                <select
                    value={data.industry}
                    onChange={(e) => updateData('industry', e.target.value)}
                    style={selectStyle(Boolean(errors.industry))}
                >
                    <option value="">{t('companyInfo.selectIndustry')}</option>
                    {industries.map((industry) => (
                        <option key={industry.value} value={industry.value}>
                            {industry.label}
                        </option>
                    ))}
                </select>
                {errors.industry && <span style={fieldErrorStyle}>{errors.industry}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
                    {t('companyInfo.country')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Globe
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            color: 'var(--color-text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <select
                        value={data.country}
                        onChange={(e) => updateData('country', e.target.value)}
                        style={{
                            ...selectStyle(Boolean(errors.country)),
                            width: '100%',
                            paddingLeft: '2.5rem',
                            paddingRight: '0.75rem',
                        }}
                    >
                        <option value="">{t('companyInfo.selectCountry')}</option>
                        {countries.map((country) => (
                            <option key={country.value} value={country.value}>
                                {country.label}
                            </option>
                        ))}
                    </select>
                </div>
                {errors.country && <span style={fieldErrorStyle}>{errors.country}</span>}
            </div>
        </div>
    );
};

export default StepCompanyInfo;
