import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/app-layout/AuthLayout';
import Button from '@/components/Shared/Button';
import StepCompanyInfo from '@/pages/onboarding/StepCompanyInfo';
import StepRegionalSettings from '@/pages/onboarding/StepRegionalSettings';
import StepModules from '@/pages/onboarding/StepModules';
import { useCustomQuery } from '@/hooks/useQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { errorToastOptions, successToastOptions } from '@/utils/toastOptions';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import {
    mapRegisterApiErrors,
    validateOnboardingStep,
} from '@/pages/onboarding/onboardingValidation';

const COMPANY_INFO_STEP = 1;

const steps = [
    { id: 1, title: 'Company Info', component: StepCompanyInfo },
    { id: 2, title: 'Regional Settings', component: StepRegionalSettings },
    { id: 3, title: 'Select Modules', component: StepModules },
];

const OnboardingWizard = () => {
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
        const validationErrors = validateOnboardingStep(currentStep, formData);
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
            toast.success('Account created successfully. Welcome to your workspace!', successToastOptions);
            navigate('/admin/dashboard');
        } catch (err) {
            const apiErrors = mapRegisterApiErrors(err?.response?.data);
            if (Object.keys(apiErrors).length > 0) {
                setStepErrors((prev) => ({ ...prev, ...apiErrors }));
            }

            setCurrentStep(COMPANY_INFO_STEP);

            const message = getApiErrorMessage(
                err,
                'Registration failed. Please verify your setup details and try again.'
            );
            toast.error(message, errorToastOptions);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
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

    const CurrentComponent = steps.find(s => s.id === currentStep)?.component || StepCompanyInfo;

    if (!signupData) {
        return (
            <AuthLayout title="Create an account" subtitle="Start your 14-day free trial">
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    Please start from the signup form to continue onboarding.
                </p>
                <Button onClick={() => navigate('/auth/signup')}>
                    Go to Sign Up
                </Button>
            </AuthLayout>
        );
    }

    if (onboardingLoading) {
        return (
            <AuthLayout title="Setup your workspace" subtitle="Loading onboarding data...">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Preparing industries, countries, currencies, languages, and modules.
                </p>
            </AuthLayout>
        );
    }

    if (onboardingError) {
        return (
            <AuthLayout title="Setup your workspace" subtitle="Could not load onboarding data">
                <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
                    {onboardingError?.message || 'Failed to load onboarding data.'}
                </p>
                <Button onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Setup your workspace"
            subtitle={`Step ${currentStep} of ${steps.length}`}
        >
            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {steps.map((step) => (
                    <div
                        key={step.id}
                        style={{
                            flex: 1,
                            height: '4px',
                            background: step.id <= currentStep ? 'var(--color-primary-600)' : 'var(--color-border)',
                            borderRadius: '2px',
                            transition: 'background 0.3s ease'
                        }}
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
                    Back
                </Button>
                <Button onClick={handleNext} isLoading={isLoading} disabled={isLoading}>
                    {currentStep === steps.length ? 'Finish Setup' : 'Continue'}
                </Button>
            </div>
        </AuthLayout>
    );
};

export default OnboardingWizard;
