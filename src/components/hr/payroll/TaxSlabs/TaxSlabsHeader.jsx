import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import Button from '@/components/Shared/Button';

const TaxSlabsHeader = () => {
    const { t } = useTranslation(['hr', 'common']);
    return (
    <div
        style={{
            display: 'flex',
            flexDirection: isCompactLayout ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isCompactLayout ? 'stretch' : 'center',
            gap: isCompactLayout ? '0.75rem' : 0,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start' }}>
            <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={onBack} className="cursor-pointer" />
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Income Tax Configuration</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Define progressive tax brackets for gross-to-net calculations.
                </p>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: isCompactLayout ? 'flex-end' : 'flex-start' }}>
            <Button variant="outline" icon={<Plus size={18} />} onClick={onAddBracket} disabled={isSaving}>
                Add Bracket
            </Button>
            <Button variant="primary" icon={<Save size={18} />} onClick={onSave} disabled={isSaving || !hasChanges}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    </div>
    );
};

export default TaxSlabsHeader;
