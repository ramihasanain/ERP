import React from 'react';
import { ArrowLeft, Copy, Printer } from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import Spinner from '@/core/Spinner';
import ResourceLoadError from '@/core/ResourceLoadError';
import { useBasePath } from '@/hooks/useBasePath';

const ContractTemplatesPreviewView = ({
    templateDetailsQuery,
    previewTemplateName,
    isWidePreviewHeader,
    navigate,
    previewHtml,
    onCopy,
    onPrint,
    isRenderingPreview,
}) => {
    const basePath = useBasePath();
    if (templateDetailsQuery.isLoading) return <Spinner />;
    if (templateDetailsQuery.isError) {
        return (
            <ResourceLoadError
                error={templateDetailsQuery.error}
                title="Could not load contract template"
                onGoBack={() => navigate(`${basePath}/hr/contract-templates`)}
                onRefresh={() => templateDetailsQuery.refetch()}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: isWidePreviewHeader ? 'nowrap' : 'wrap',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flex: isWidePreviewHeader ? '1 1 auto' : '1 1 320px',
                        minWidth: 0,
                    }}
                >
                    <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(`${basePath}/hr/contract-templates`)} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Contract Preview</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{previewTemplateName}</p>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginLeft: 'auto',
                        flex: isWidePreviewHeader ? '0 0 auto' : '1 1 100%',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button variant="outline" icon={<Copy size={16} />} disabled={!previewHtml} onClick={onCopy}>
                        Copy
                    </Button>
                    <Button icon={<Printer size={16} />} onClick={onPrint} disabled={!previewHtml}>
                        Print
                    </Button>
                </div>
            </div>
            <Card
                className="padding-lg"
                style={{
                    background: 'var(--color-bg-surface)',
                    maxWidth: '900px',
                    margin: '0 auto',
                    width: '100%',
                    border: '1px solid var(--color-border)',
                }}
            >
                {isRenderingPreview ? (
                    <Spinner />
                ) : !previewHtml ? (
                    <div style={{ color: 'var(--color-text-secondary)', padding: '1rem' }}>
                        No rendered HTML returned for this template.
                    </div>
                ) : (
                    <iframe
                        title={`${previewTemplateName} preview`}
                        srcDoc={previewHtml}
                        style={{
                            width: '100%',
                            minHeight: '70vh',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'var(--color-bg-card)',
                        }}
                    />
                )}
            </Card>
        </div>
    );
};

export default ContractTemplatesPreviewView;
