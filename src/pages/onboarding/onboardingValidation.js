import i18n from '@/i18n';

const API_FIELD_MAP = {
    company_name: 'companyName',
    industry: 'industry',
    country: 'country',
    base_currency: 'currency',
    default_language: 'language',
    selected_modules: 'modules',
};

const toFieldMessage = (value) => {
    if (value == null) return '';
    if (Array.isArray(value)) return String(value[0] || '').trim();
    if (typeof value === 'object' && value?.msg) return String(value.msg).trim();
    return String(value).trim();
};

/**
 * @param {number} step
 * @param {object} formData
 * @param {(key: string, options?: object) => string} [t] - optional i18n t function (onboarding namespace)
 */
export const validateOnboardingStep = (step, formData, t) => {
    const translate =
        t ||
        ((key, options) => i18n.t(`onboarding:validation.${key}`, options));

    const errors = {};

    if (step === 1) {
        if (!formData.companyName?.trim()) errors.companyName = translate('companyNameRequired');
        if (!formData.industry) errors.industry = translate('industryRequired');
        if (!formData.country) errors.country = translate('countryRequired');
    }

    if (step === 2) {
        if (!formData.currency) errors.currency = translate('currencyRequired');
        if (!formData.language) errors.language = translate('languageRequired');
    }

    if (step === 3 && !(formData.modules?.length > 0)) {
        errors.modules = translate('modulesRequired');
    }

    return errors;
};

export const mapRegisterApiErrors = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

    const errors = {};

    Object.entries(data).forEach(([key, value]) => {
        if (['detail', 'error', 'message'].includes(key)) return;
        const formKey = API_FIELD_MAP[key] || key;
        const message = toFieldMessage(value);
        if (message) errors[formKey] = message;
    });

    return errors;
};
