import React from 'react';
import Button from '@/components/Shared/Button';
import { Plus } from 'lucide-react';

const ChartOfAccountsHeader = ({ t, onOpenModal }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                    {t.title}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{t.subtitle}</p>
            </div>
            <Button icon={<Plus size={18} />} onClick={onOpenModal} size="lg">
                {t.newAccount}
            </Button>
        </div>
    );
};

export default ChartOfAccountsHeader;
