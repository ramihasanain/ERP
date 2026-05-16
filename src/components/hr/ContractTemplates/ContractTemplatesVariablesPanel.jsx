import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';

const ContractTemplatesVariablesPanel = () => {
    const { t } = useTranslation(['hr', 'common']);
    return (
    <Card
        className="padding-md"
        style={
            compact
                ? undefined
                : {
                    height: '720px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }
        }
    >
        {!isLargeEditorLayout && (
            <>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Available Variables</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    Click to insert at cursor position.
                </p>
            </>
        )}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                flex: compact ? undefined : 1,
                minHeight: 0,
                maxHeight: compact ? '180px' : 'none',
                overflowY: 'auto',
            }}
        >
            {tagsQuery.isLoading ? (
                <Spinner />
            ) : tagsQuery.isError ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-error)' }}>
                        Could not load available variables.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => tagsQuery.refetch()}>
                        Retry
                    </Button>
                </div>
            ) : availableVariables.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    No variables available.
                </p>
            ) : (
                availableVariables.map((variable) => (
                    <button
                        key={variable.key}
                        onClick={() => onInsertVariable(variable.key)}
                        style={{
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-text-main)',
                        }}
                        onMouseOver={(event) => {
                            event.currentTarget.style.background = 'var(--color-bg-subtle)';
                        }}
                        onMouseOut={(event) => {
                            event.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <code
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-primary-600)',
                                background: 'var(--color-bg-subtle)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                            }}
                        >
                            {`{{${variable.key}}}`}
                        </code>
                    </button>
                ))
            )}
        </div>
    </Card>
    );
};

export default ContractTemplatesVariablesPanel;
