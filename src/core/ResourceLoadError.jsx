import React from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

/**
 * Shown when a page or section cannot load (permission, missing resource, server error).
 * Displays backend error text when available, with go-back and full page refresh actions.
 */
const ResourceLoadError = ({
    error,
    message: messageProp,
    title = 'This page cannot be loaded',
    fallbackMessage = 'We could not load the data. You may not have access, or the resource may be unavailable.',
    onGoBack,
    onRefresh,
    goBackLabel = 'Go back',
    refreshLabel = 'Refresh page',
    style,
}) => {
    const fromBackend = messageProp?.trim() || getApiErrorMessage(error, '');
    const bodyText = fromBackend || fallbackMessage;

    const handleBack =
        onGoBack ||
        (() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
            }
        });

    const handleRefresh =
        onRefresh ||
        (() => {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        });

    return (
        <Card
            className="padding-lg"
            style={{
                maxWidth: '560px',
                margin: '0 auto',
                width: '100%',
                ...style,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-error)' }}>
                    <AlertTriangle size={22} aria-hidden />
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{title}</h2>
                </div>
                <p
                    style={{
                        margin: 0,
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {bodyText}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.25rem' }}>
                    <Button type="button" variant="outline" className="cursor-pointer" icon={<ArrowLeft size={18} />} onClick={handleBack}>
                        {goBackLabel}
                    </Button>
                    <Button type="button" variant="primary" className="cursor-pointer" icon={<RefreshCw size={18} />} onClick={handleRefresh}>
                        {refreshLabel}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ResourceLoadError;
