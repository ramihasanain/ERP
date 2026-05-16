import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const fieldErrorStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-error)',
    marginTop: '0.25rem',
};

const selectStyle = (hasError) => ({
    width: '100%',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    border: hasError ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
});

const StepRegionalSettings = ({ data, updateData, options, errors = {} }) => {
    const { t } = useTranslation('onboarding');
    const currencies = options?.currencies || [];
    const languages = options?.languages || [];

    const selectedCountryName =
        options?.countries?.find((country) => country.value === data.country)?.label ||
        t('regionalSettings.yourCountry');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('regionalSettings.title')}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('regionalSettings.baseCurrency')}</label>
                <select
                    value={data.currency}
                    onChange={(e) => updateData('currency', e.target.value)}
                    style={selectStyle(Boolean(errors.currency))}
                >
                    <option value="">{t('regionalSettings.selectCurrency')}</option>
                    {currencies.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                            {currency.label}
                        </option>
                    ))}
                </select>
                {errors.currency && <span style={fieldErrorStyle}>{errors.currency}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('regionalSettings.defaultLanguage')}</label>
                <select
                    value={data.language}
                    onChange={(e) => updateData('language', e.target.value)}
                    style={selectStyle(Boolean(errors.language))}
                >
                    <option value="">{t('regionalSettings.selectLanguage')}</option>
                    {languages.map((language) => (
                        <option key={language.value} value={language.value}>
                            {language.label}
                        </option>
                    ))}
                </select>
                {errors.language && <span style={fieldErrorStyle}>{errors.language}</span>}
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
                    {t('regionalSettings.autoConfigTitle')}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <Trans
                        i18nKey="onboarding:regionalSettings.autoConfigDescription"
                        values={{ country: selectedCountryName }}
                        components={{ strong: <strong style={{ color: 'var(--color-text-main)' }} /> }}
                    />
                </p>
            </div>
        </div>
    );
};

export default StepRegionalSettings;
