import React from 'react';
import { Variable, Calculator, Delete, X } from 'lucide-react';

const FormulaBuilder = ({ value, onChange, variables = [] }) => {
    const operators = ['+', '-', '*', '/', '(', ')'];
    const numberButtons = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];

    const insertTerm = (term) => {
        onChange(value ? `${value} ${term}` : term);
    };

    const appendText = (text) => {
        onChange(`${value || ''}${text}`);
    };

    const removeLastChar = () => {
        if (!value) return;
        onChange(String(value).slice(0, -1));
    };

    const removeLastTerm = () => {
        const tokens = String(value || '').trim().split(/\s+/).filter(Boolean);
        if (!tokens.length) return;
        tokens.pop();
        onChange(tokens.join(' '));
    };

    const clearFormula = () => onChange('');

    const handleEditorKeyDown = (e) => {
        if (/^\d$/.test(e.key)) {
            e.preventDefault();
            appendText(e.key);
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            appendText(' ');
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            removeLastChar();
            return;
        }

        if (e.key === 'Delete') {
            e.preventDefault();
            clearFormula();
            return;
        }

        if (['Tab', 'Shift', 'Alt', 'Control', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            return;
        }

        e.preventDefault();
    };

    return (
        <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            background: 'var(--color-slate-50)'
        }}>
            {/* Editor Area */}
            <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Formula Editor
                    </label>
                    <button
                        type="button"
                        onClick={clearFormula}
                        style={{ background: 'none', border: 'none', color: 'var(--color-error-600)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        Clear All
                    </button>
                </div>
                <div style={{
                    minHeight: '60px',
                    padding: '0.75rem',
                    background: 'var(--color-slate-50)',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    color: 'var(--color-primary-700)',
                    wordBreak: 'break-all',
                    outline: 'none',
                    cursor: 'text'
                }}
                tabIndex={0}
                onKeyDown={handleEditorKeyDown}
                title="Use keyboard: numbers and space only"
                >
                    {value || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Build your formula using buttons below...</span>}
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={removeLastTerm}
                        disabled={!String(value || '').trim()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '0.4rem',
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: String(value || '').trim() ? 1 : 0.6,
                        }}
                    >
                        <Delete size={14} /> Backspace
                    </button>
                    <button
                        type="button"
                        onClick={clearFormula}
                        disabled={!String(value || '').trim()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '0.4rem',
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: String(value || '').trim() ? 1 : 0.6,
                        }}
                    >
                        <X size={14} /> Clear
                    </button>
                </div>

                {/* Number Pad */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ minWidth: '170px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Numbers
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '0.5rem', alignItems: 'center' }}>
                        {numberButtons.map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => appendText(num)}
                                style={{
                                    width: '40px',
                                    height: '34px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0.25rem',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => appendText(' ')}
                            style={{
                                gridColumn: 'span 3',
                                height: '34px',
                                borderRadius: '0.25rem',
                                background: 'white',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Space
                        </button>
                    </div>
                </div>

                {/* Variables */}
                <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Variable size={12} /> Variables
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {variables.map(v => (
                            <button
                                key={v.code}
                                type="button"
                                onClick={() => insertTerm(v.code)}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary-500)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                {v.name} ({v.code})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Operators */}
                <div style={{ minWidth: '220px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calculator size={12} /> Math Operators
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {operators.map(op => (
                            <button
                                key={op}
                                type="button"
                                onClick={() => insertTerm(op)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0.25rem',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'var(--color-slate-100)'}
                                onMouseOut={e => e.currentTarget.style.background = 'white'}
                            >
                                {op}
                            </button>
                        ))}
                    </div>
                </div>
                </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'var(--color-primary-50)', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-primary-800)' }}>
                <b>Example:</b> (BASIC / 30 / 8) * 1.5 * OT_HOURS
            </div>
        </div>
    );
};

export default FormulaBuilder;
