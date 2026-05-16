import React, { useRef, useLayoutEffect, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const buildSortedVariableCodes = (variables) =>
    [...(variables || [])]
        .map((v) => v.code)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

/**
 * Identifier ending at cursor (exclusive end index).
 */
const findTrailingIdentifierBounds = (text, endExclusive) => {
    const { t } = useTranslation(['hr', 'common']);
    if (endExclusive <= 0) return null;
    let i = endExclusive - 1;
    while (i >= 0 && /[A-Za-z0-9_]/.test(text[i])) {
        i -= 1;
    }
    const start = i + 1;
    if (start >= endExclusive) return null;
    return { start, end: endExclusive };
};

const tryDeleteWholeVariableBeforeCursor = (text, cursorPos, sortedCodes) => {
    const bounds = findTrailingIdentifierBounds(text, cursorPos);
    if (!bounds) return null;
    const token = text.slice(bounds.start, bounds.end);
    if (!sortedCodes.includes(token)) return null;
    const nextValue = text.slice(0, bounds.start) + text.slice(cursorPos);
    return { nextValue, cursor: bounds.start };
};

const insertWithSpacing = (before, after, term) => {

    const needSpaceBefore = before.length > 0 && !/\s$/.test(before);
    const needSpaceAfter = after.length > 0 && !/^\s/.test(after);
    const insertion =
        (needSpaceBefore ? ' ' : '') + term + (needSpaceAfter ? ' ' : '');
    return { next: before + insertion + after, cursor: before.length + insertion.length };
};

const ALLOWED_NAV_KEYS = new Set([
    'Tab',
    'Shift',
    'Alt',
    'Control',
    'Meta',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Escape',
    'Home',
    'End',
    'Delete',
]);

const FormulaBuilder = ({ value, onChange, variables = [] }) => {

    const operators = ['+', '-', '*', '/', '(', ')'];
    const textareaRef = useRef(null);
    const pendingCursorRef = useRef(null);
    const [editorFocused, setEditorFocused] = useState(false);

    const sortedVariableCodes = useMemo(() => buildSortedVariableCodes(variables), [variables]);

    useLayoutEffect(() => {
        const el = textareaRef.current;
        const pos = pendingCursorRef.current;
        if (el == null || pos == null) return;
        el.selectionStart = el.selectionEnd = pos;
        pendingCursorRef.current = null;
    }, [value]);

    const insertTerm = useCallback(
        (term) => {
            const el = textareaRef.current;
            const v = value ?? '';
            let start = v.length;
            let end = v.length;
            if (el) {
                start = el.selectionStart;
                end = el.selectionEnd;
            }
            const before = v.slice(0, start);
            const after = v.slice(end);
            const { next, cursor } = insertWithSpacing(before, after, term);
            pendingCursorRef.current = cursor;
            onChange(next);
            queueMicrotask(() => {
                el?.focus();
            });
        },
        [value, onChange]
    );

    const handlePaste = useCallback(
        (e) => {
            e.preventDefault();
            const el = textareaRef.current;
            const raw = (e.clipboardData || window.clipboardData)?.getData('text') || '';
            const filtered = raw.replace(/[^\d.\s]/g, '');
            if (!filtered) return;
            const v = value ?? '';
            const start = el ? el.selectionStart : v.length;
            const end = el ? el.selectionEnd : v.length;
            const next = v.slice(0, start) + filtered + v.slice(end);
            pendingCursorRef.current = start + filtered.length;
            onChange(next);
        },
        [value, onChange]
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.nativeEvent.isComposing || e.key === 'Process') return;

            if (e.ctrlKey || e.metaKey) {
                const k = e.key.toLowerCase();
                if (['c', 'v', 'x', 'a', 'z', 'y'].includes(k)) return;
            }

            const el = e.target;
            const start = el.selectionStart;
            const end = el.selectionEnd;

            if (e.key === 'Backspace') {
                if (start !== end) return;
                const res = tryDeleteWholeVariableBeforeCursor(
                    value ?? '',
                    start,
                    sortedVariableCodes
                );
                if (res) {
                    e.preventDefault();
                    pendingCursorRef.current = res.cursor;
                    onChange(res.nextValue);
                }
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                return;
            }

            if (ALLOWED_NAV_KEYS.has(e.key)) return;

            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                if (/^[0-9.]$/.test(e.key) || e.key === ' ') return;
                e.preventDefault();
            }
        },
        [value, onChange, sortedVariableCodes]
    );

    const chip = {
        padding: '0.2rem 0.45rem',
        borderRadius: '0.25rem',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--color-text-main)',
        cursor: 'pointer',
    };

    const opBtn = {
        ...chip,
        minWidth: '1.75rem',
        height: '1.75rem',
        padding: '0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0.8125rem',
    };

    const labelStyle = {
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginRight: '0.15rem',
    };

    return (
        <div
            style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-slate-50)',
            }}
        >
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="font-medium" style={labelStyle}>
                        Formula
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            pendingCursorRef.current = 0;
                            onChange('');
                            queueMicrotask(() => textareaRef.current?.focus());
                        }}
                        disabled={!String(value || '').trim()}
                        className="font-medium cursor-pointer"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-error-600)',
                            fontSize: '0.75rem',
                            opacity: String(value || '').trim() ? 1 : 0.45,
                            cursor: String(value || '').trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Clear
                    </button>
                </div>
                <textarea
                    ref={textareaRef}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onFocus={() => setEditorFocused(true)}
                    onBlur={() => setEditorFocused(false)}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    rows={3}
                    className="font-normal"
                    placeholder="Click to move the caret — type 0–9, ., space; Backspace removes a whole variable when the caret is right after its code"
                    aria-label="Formula"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        minHeight: '56px',
                        padding: '0.5rem 0.65rem',
                        background: 'var(--color-slate-50)',
                        borderRadius: '0.25rem',
                        border: editorFocused
                            ? '1px solid var(--color-primary-400)'
                            : '1px solid var(--color-border)',
                        boxShadow: editorFocused ? '0 0 0 2px var(--color-primary-100)' : 'none',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '0.8125rem',
                        color: 'var(--color-primary-800)',
                        wordBreak: 'break-all',
                        outline: 'none',
                        cursor: 'text',
                        whiteSpace: 'pre-wrap',
                        caretColor: 'var(--color-primary-600)',
                        lineHeight: 1.45,
                    }}
                />
            </div>

            <div
                style={{
                    padding: '0.5rem 0.65rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.35rem 0.5rem',
                    rowGap: '0.35rem',
                }}
            >
                <span className="font-medium" style={labelStyle}>
                    Variables
                </span>
                {variables.map((v) => (
                    <button
                        key={v.code}
                        type="button"
                        title={v.name}
                        onClick={() => insertTerm(v.code)}
                        className="font-medium cursor-pointer"
                        style={chip}
                    >
                        {v.code}
                    </button>
                ))}

                <span
                    aria-hidden
                    style={{
                        width: '1px',
                        height: '1.25rem',
                        background: 'var(--color-border)',
                        margin: '0 0.15rem',
                        flexShrink: 0,
                    }}
                />

                <span className="font-medium" style={labelStyle}>
                    Operators
                </span>
                {operators.map((op) => (
                    <button
                        key={op}
                        type="button"
                        onClick={() => insertTerm(op)}
                        className="font-medium cursor-pointer"
                        style={opBtn}
                    >
                        {op}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FormulaBuilder;
