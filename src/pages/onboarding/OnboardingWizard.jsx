import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounting } from '../../context/AccountingContext';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';
import StepCompanyInfo from './StepCompanyInfo';
import StepRegionalSettings from './StepRegionalSettings';
import StepModules from './StepModules';
import { Check } from 'lucide-react';

const steps = [
    { id: 1, title: 'Company Info', component: StepCompanyInfo },
    { id: 2, title: 'Regional Settings', component: StepRegionalSettings },
    { id: 3, title: 'Select Modules', component: StepModules },
];

const OnboardingWizard = () => {
    const navigate = useNavigate();
    const { updateCompanyProfile } = useAccounting();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        country: 'JO',
        currency: 'JOD',
        language: 'ar',
        modules: ['accounting', 'hr', 'inventory']
    });

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(curr => curr + 1);
        } else {
            // Final submit
            console.log('Submitting:', formData);
            updateCompanyProfile({
                name: formData.companyName,
                country: formData.country,
                currency: formData.currency
            });
            navigate('/admin/dashboard');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const updateData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const CurrentComponent = steps.find(s => s.id === currentStep)?.component || StepCompanyInfo;

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
                            background: step.id <= currentStep ? 'var(--color-primary-600)' : 'var(--color-slate-200)',
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
                <Button onClick={handleNext}>
                    {currentStep === steps.length ? 'Finish Setup' : 'Continue'}
                </Button>
            </div>
        </AuthLayout>
    );
};

export default OnboardingWizard;
