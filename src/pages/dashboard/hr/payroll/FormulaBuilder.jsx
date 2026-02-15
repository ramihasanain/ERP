import React, { useState } from 'react';
import Button from '../../../../components/common/Button';
import { Sigma, Variable, Calculator, X } from 'lucide-react';

const FormulaBuilder = ({ value, onChange, variables = [] }) => {
    const operators = ['+', '-', '*', '/', '(', ')'];

    const insertTerm = (term) => {
        onChange(value ? `${value} ${term}` : term);
    };

    const clearFormula = () => onChange('');

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
                        onClick={clearFormula}
                        style={{ background: 'none', border: 'none', color: 'var(--color-error-600)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        Clear
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
                    wordBreak: 'break-all'
                }}>
                    {value || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Build your formula using buttons below...</span>}
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Variables */}
                <div>
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
                <div>
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

            <div style={{ padding: '0.75rem 1rem', background: 'var(--color-primary-50)', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-primary-800)' }}>
                <b>Example:</b> (BASIC / 30 / 8) * 1.5 * OT_HOURS
            </div>
        </div>
    );
};

export default FormulaBuilder;
