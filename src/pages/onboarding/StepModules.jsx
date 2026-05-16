import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import { Layers, Users, Package } from 'lucide-react';

const FALLBACK_MODULE_KEYS = ['accounting', 'hr', 'inventory'];
const FALLBACK_ICONS = [<Layers key="layers" />, <Users key="users" />, <Package key="package" />];

const fieldErrorStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-error)',
    marginTop: '0.25rem',
};

const StepModules = ({ data, updateData, options, errors = {} }) => {
    const { t } = useTranslation('onboarding');

    const modulesList = useMemo(() => {
        if (options?.modules?.length) {
            return options.modules.map((module, index) => ({
                id: module.value,
                name: module.label,
                desc: module.description || t('modules.fallbackDesc'),
                icon: FALLBACK_ICONS[index] || <Layers />,
            }));
        }
        return FALLBACK_MODULE_KEYS.map((key, index) => ({
            id: key,
            name: t(`modules.fallback.${key}.name`),
            desc: t(`modules.fallback.${key}.desc`),
            icon: FALLBACK_ICONS[index],
        }));
    }, [options?.modules, t]);

    const toggleModule = (id) => {
        const current = data.modules || [];
        if (current.includes(id)) {
            updateData('modules', current.filter((m) => m !== id));
        } else {
            updateData('modules', [...current, id]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('modules.title')}</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('modules.subtitle')}</p>
            {errors.modules && <span style={fieldErrorStyle}>{errors.modules}</span>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modulesList.map((mod) => {
                    const isSelected = data.modules.includes(mod.id);
                    return (
                        <Card
                            key={mod.id}
                            className="padding-md"
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--color-primary-500)' : '1px solid var(--color-border)',
                                background: isSelected
                                    ? 'color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))'
                                    : 'var(--color-bg-card)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onClick={() => toggleModule(mod.id)}
                        >
                            <div style={{ color: isSelected ? 'var(--color-primary-500)' : 'var(--color-text-muted)' }}>
                                {mod.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{mod.name}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{mod.desc}</p>
                            </div>
                            <div style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                borderRadius: '50%',
                                border: isSelected ? 'none' : '2px solid var(--color-border)',
                                background: isSelected ? 'var(--color-primary-600)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                {isSelected && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StepModules;
