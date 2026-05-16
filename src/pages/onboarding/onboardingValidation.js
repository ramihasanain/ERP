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

export const validateOnboardingStep = (step, formData) => {
    const errors = {};

    if (step === 1) {
        if (!formData.companyName?.trim()) errors.companyName = 'Company name is required';
        if (!formData.industry) errors.industry = 'Industry is required';
        if (!formData.country) errors.country = 'Country is required';
    }

    if (step === 2) {
        if (!formData.currency) errors.currency = 'Base currency is required';
        if (!formData.language) errors.language = 'Default language is required';
    }

    if (step === 3 && !(formData.modules?.length > 0)) {
        errors.modules = 'Select at least one module';
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
