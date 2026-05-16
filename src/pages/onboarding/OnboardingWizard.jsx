import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Button from '@/components/Shared/Button';
import StepCompanyInfo from '@/pages/onboarding/StepCompanyInfo';
import StepRegionalSettings from '@/pages/onboarding/StepRegionalSettings';
import StepModules from '@/pages/onboarding/StepModules';
import { useCustomQuery } from '@/hooks/useQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { translateApiError } from '@/utils/translateApiError';
import {
    mapRegisterApiErrors,
    validateOnboardingStep,
} from '@/pages/onboarding/onboardingValidation';

const COMPANY_INFO_STEP = 1;

const STEP_COMPONENTS = [
    { id: 1, key: 'companyInfo', component: StepCompanyInfo },
    { id: 2, key: 'regionalSettings', component: StepRegionalSettings },
    { id: 3, key: 'selectModules', component: StepModules },
];

const OnboardingWizard = () => {
    const { t } = useTranslation('onboarding');
    const navigate = useNavigate();
    const location = useLocation();
    const { register, isLoading } = useAuth();
    const signupData = location.state?.signupData;
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: signupData?.company_name || '',
        industry: '',
        country: '',
        currency: '',
        language: '',
        modules: [],
    });
    const [stepErrors, setStepErrors] = useState({});

    const steps = useMemo(
        () =>
            STEP_COMPONENTS.map((step) => ({
                ...step,
                title: t(`steps.${step.key}`),
            })),
        [t],
    );

    const bootstrapQuery = useCustomQuery('/shared/bootstrap-data/', ['signup-bootstrap-data']);

    const listFromResponse = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.results)) return response.results;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        return [];
    };

    const bootstrapData = useMemo(() => {
        const response = bootstrapQuery.data;
        if (!response || typeof response !== 'object') return {};
        if (response?.data && typeof response.data === 'object') return response.data;
        return response;
    }, [bootstrapQuery.data]);

    const options = useMemo(() => ({
        industries: listFromResponse(bootstrapData.industries).map((item) => ({
            value: item?.id || item?.uuid || item?.value,
            label: item?.name || item?.title || item?.label,
        })).filter((item) => item.value && item.label),
        countries: listFromResponse(bootstrapData.countries).map((item) => ({
            value: item?.id || item?.uuid || item?.value,
            label: item?.name || item?.title || item?.label,
        })).filter((item) => item.value && item.label),
        currencies: listFromResponse(bootstrapData.currencies).map((item) => ({
            value: item?.id || item?.uuid || item?.value,
            label: item?.name || item?.code || item?.title || item?.label,
        })).filter((item) => item.value && item.label),
        languages: listFromResponse(bootstrapData.languages).map((item) => ({
            value: item?.id || item?.uuid || item?.value,
            label: item?.name || item?.code || item?.title || item?.label,
        })).filter((item) => item.value && item.label),
        modules: listFromResponse(bootstrapData.modules).map((item) => ({
            value: item?.id || item?.uuid || item?.value,
            label: item?.name || item?.title || item?.label,
            description: item?.description || item?.desc || '',
        })).filter((item) => item.value && item.label),
    }), [bootstrapData]);

    const onboardingLoading = bootstrapQuery.isLoading;
    const onboardingError = bootstrapQuery.error;

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            industry: prev.industry || options.industries[0]?.value || '',
            country: prev.country || options.countries[0]?.value || '',
            currency: prev.currency || options.currencies[0]?.value || '',
            language: prev.language || options.languages[0]?.value || '',
            modules: prev.modules.length ? prev.modules : options.modules.slice(0, 3).map((mod) => mod.value),
        }));
    }, [options]);

    const handleNext = async () => {
        const validationErrors = validateOnboardingStep(currentStep, formData, (key) =>
            t(`validation.${key}`),
        );
        if (Object.keys(validationErrors).length > 0) {
            setStepErrors((prev) => ({ ...prev, ...validationErrors }));
            const firstMessage = Object.values(validationErrors)[0];
            if (firstMessage) toast.error(firstMessage, errorToastOptions);
            return;
        }

        setStepErrors((prev) => {
            const next = { ...prev };
            Object.keys(validationErrors).forEach((key) => {
                delete next[key];
            });
            return next;
        });

        if (currentStep < steps.length) {
            setCurrentStep((curr) => curr + 1);
            return;
        }

        try {
            await register({
                ...signupData,
                company_name: formData.companyName || signupData.company_name || signupData.full_name,
                industry: formData.industry,
                country: formData.country,
                base_currency: formData.currency,
                default_language: formData.language,
                selected_modules: formData.modules,
            });
            toast.success(t('success'), successToastOptions);
            navigate('/admin/dashboard');
        } catch (err) {
            const apiErrors = mapRegisterApiErrors(err?.response?.data);
            if (Object.keys(apiErrors).length > 0) {
                setStepErrors((prev) => ({ ...prev, ...apiErrors }));
            }

            setCurrentStep(COMPANY_INFO_STEP);

            toast.error(
                translateApiError(err, 'onboarding:failed'),
                errorToastOptions,
            );
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((curr) => curr - 1);
        }
    };

    const updateData = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setStepErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const CurrentComponent = steps.find((s) => s.id === currentStep)?.component || StepCompanyInfo;

    if (!signupData) {
        return (
            <AuthLayout title={t('wizard.noSignupTitle')} subtitle={t('wizard.noSignupSubtitle')}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    {t('wizard.noSignupMessage')}
                </p>
                <Button onClick={() => navigate('/auth/signup')}>
                    {t('wizard.goToSignUp')}
                </Button>
            </AuthLayout>
        );
    }

    if (onboardingLoading) {
        return (
            <AuthLayout title={t('wizard.loadingTitle')} subtitle={t('wizard.loadingSubtitle')}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    {t('wizard.loadingMessage')}
                </p>
            </AuthLayout>
        );
    }

    if (onboardingError) {
        return (
            <AuthLayout title={t('wizard.errorTitle')} subtitle={t('wizard.errorSubtitle')}>
                <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                    {onboardingError?.message || t('wizard.errorDefault')}
                </p>
                <Button onClick={() => window.location.reload()}>
                    {t('wizard.retry')}
                </Button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title={t('wizard.title')}
            subtitle={t('wizard.subtitleStep', { current: currentStep, total: steps.length })}
        >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {steps.map((step) => (
                    <ProgressBar
                        key={step.id}
                        active={step.id <= currentStep}
                    />
                ))}
            </div>

            <div style={{ minHeight: '300px' }}>
                <CurrentComponent
                    data={formData}
                    updateData={updateData}
                    options={options}
                    errors={stepErrors}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    {t('actions.back')}
                </Button>
                <Button onClick={handleNext} isLoading={isLoading} disabled={isLoading}>
                    {currentStep === steps.length ? t('actions.finish') : t('actions.continue')}
                </Button>
            </div>
        </AuthLayout>
    );
};

function ProgressBar({ active }) {
    return (
        <div
            style={{
                flex: 1,
                height: '4px',
                background: active ? 'var(--color-primary-600)' : 'var(--color-border)',
                borderRadius: '2px',
                transition: 'background 0.3s ease',
            }}
        />
    );
}

export default OnboardingWizard;
