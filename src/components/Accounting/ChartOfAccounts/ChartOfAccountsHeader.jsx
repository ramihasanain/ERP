import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import Button from '@/components/Shared/Button';
import { Plus, ArrowLeft } from 'lucide-react';

const ChartOfAccountsHeader = ({ onOpenModal }) => {
    const { t } = useTranslation('accounting');
    const navigate = useNavigate();
    const basePath = useBasePath();

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(`${basePath}/accounting`)}
                    className="cursor-pointer shrink-0"
                />
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                        {t('chartOfAccounts.title')}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{t('chartOfAccounts.subtitle')}</p>
                </div>
            </div>
            <Button icon={<Plus size={18} />} onClick={onOpenModal} size="lg" className="cursor-pointer shrink-0">
                {t('chartOfAccounts.newAccount')}
            </Button>
        </div>
    );
};

export default ChartOfAccountsHeader;
