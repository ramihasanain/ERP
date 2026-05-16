import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import Input from '@/components/Shared/Input';

const searchColStyleFull = { width: '300px', minWidth: 0 };
const searchColStyleCompact = { width: '210px', minWidth: 0 };
const searchColStyleDrawer = { width: '100%', minWidth: 0 };

/**
 * @param {{ compact?: boolean; variant?: 'header' | 'drawer' }} props
 */
const HeaderSearchField = ({ compact = false, variant = 'header' }) => {
    const { t } = useTranslation('nav');
    const colStyle =
        variant === 'drawer'
            ? searchColStyleDrawer
            : compact
              ? searchColStyleCompact
              : searchColStyleFull;
    const inputStyle =
        variant === 'drawer'
            ? { height: '2rem', fontSize: '0.82rem' }
            : compact
              ? { height: '2rem', fontSize: '0.82rem' }
              : { height: '2.25rem', fontSize: '0.9rem' };
    const iconSize = compact || variant === 'drawer' ? 16 : 18;

    return (
        <div style={colStyle}>
            <Input
                placeholder={t('searchPlaceholder')}
                startIcon={React.createElement(Search, { size: iconSize })}
                style={inputStyle}
            />
        </div>
    );
};

export default HeaderSearchField;
