import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import { Info } from 'lucide-react';

const sizeStyles = {
  sm: {
    padding: '0.75rem',
    titleSize: '0.9rem',
    descriptionSize: '0.8rem',
    iconSize: 16,
    gap: '0.5rem',
  },
  md: {
    padding: '1rem',
    titleSize: '1rem',
    descriptionSize: '0.875rem',
    iconSize: 18,
    gap: '0.65rem',
  },
};

/**
 * Global, reusable empty-state component.
 * Use for null/empty API fields to keep UI consistent across modules.
 */
const NoData = ({
  label,
  title,
  description,
  icon,
  size = 'md',
  variant = 'card',
  style,
  className,
}) => {
  const { t } = useTranslation('common');
  const resolved = sizeStyles[size] || sizeStyles.md;

  const resolvedTitle =
    title ||
    (label ? t('noData.titleWithLabel', { label }) : t('noData.title'));
  const resolvedDescription =
    description ||
    (label
      ? t('noData.descriptionWithLabel', { label })
      : t('noData.description'));

  const Icon = icon || Info;

  const content = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: resolved.gap }}>
      <div
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '10px',
          background: 'var(--color-bg-toggle-track)',
          color: 'var(--color-primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Icon size={resolved.iconSize} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: resolved.titleSize,
            color: 'var(--color-text-main)',
          }}
        >
          {resolvedTitle}
        </div>
        <div
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: resolved.descriptionSize,
            lineHeight: 1.45,
          }}
        >
          {resolvedDescription}
        </div>
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <Card
      className={className}
      style={{
        padding: resolved.padding,
        borderStyle: 'dashed',
        borderColor: 'var(--color-border)',
        background: 'var(--color-bg-subtle)',
        ...style,
      }}
    >
      {content}
    </Card>
  );
};

export default NoData;

