import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import translateApiError from '@/utils/translateApiError';

const isHtmlLike = (value) => {
    if (typeof value !== 'string') return false;
    const text = value.trim().slice(0, 400).toLowerCase();
    if (!text) return false;
    return (
        text.includes('<!doctype html') ||
        text.includes('<html') ||
        text.includes('<head') ||
        text.includes('<body') ||
        text.includes('<title') ||
        text.includes('<meta') ||
        text.includes('<script') ||
        text.includes('</html>')
    );
};

const getResponseContentType = (error) => {
    const headers = error?.response?.headers;
    if (!headers) return '';
    const ct = headers['content-type'] || headers['Content-Type'] || '';
    return typeof ct === 'string' ? ct : '';
};

/**
 * Shown when a page or section cannot load (permission, missing resource, server error).
 * Displays backend error text when available, with go-back and full page refresh actions.
 */
const ResourceLoadError = ({
    error,
    message: messageProp,
    title,
    fallbackMessage,
    onGoBack,
    onRefresh,
    goBackLabel,
    refreshLabel,
    style,
}) => {
    const { t } = useTranslation('common');

    const resolvedTitle = title ?? t('resourceLoadError.title');
    const resolvedFallback = fallbackMessage ?? t('resourceLoadError.fallback');
    const resolvedGoBackLabel = goBackLabel ?? t('resourceLoadError.goBack');
    const resolvedRefreshLabel = refreshLabel ?? t('resourceLoadError.refresh');

    const contentType = getResponseContentType(error).toLowerCase();
    const rawMessage = messageProp?.trim() || translateApiError(error, '');
    const backendLooksHtml =
        contentType.includes('text/html') ||
        contentType.includes('application/xhtml+xml') ||
        isHtmlLike(rawMessage);
    const safeBackendMessage = backendLooksHtml ? '' : rawMessage;
    const bodyText = safeBackendMessage || resolvedFallback;

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
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{resolvedTitle}</h2>
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
                        {resolvedGoBackLabel}
                    </Button>
                    <Button type="button" variant="primary" className="cursor-pointer" icon={<RefreshCw size={18} />} onClick={handleRefresh}>
                        {resolvedRefreshLabel}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ResourceLoadError;
