import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const reactIdSafe = (id) => id.replace(/:/g, '');

const inlineSpinnerStyle = {
    width: '0.875rem',
    height: '0.875rem',
    borderRadius: '999px',
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-primary-600)',
    flexShrink: 0,
};

const NEAR_BOTTOM_PX = 48;
const MENU_GAP_PX = 4;
const VIEWPORT_EDGE_PAD_PX = 8;

function parseMaxHeightPx(listMaxHeight) {
    if (typeof listMaxHeight === 'number' && Number.isFinite(listMaxHeight)) return listMaxHeight;
    if (typeof listMaxHeight === 'string') {
        const n = parseFloat(listMaxHeight);
        return Number.isFinite(n) ? n : 240;
    }
    return 240;
}

/**
 * Custom dropdown with a scrollable option list. When the user scrolls near the bottom
 * (or the list is short enough that the end is visible), the next page is requested via
 * `onLoadMore`. Intended for paginated APIs (parent owns data / React Query infinite).
 *
 * Props: label, id, value, onChange, options, emptyOptionLabel, disabled, triggerStyle,
 * listMaxHeight, hasMore (or deprecated showLoadMore), onLoadMore, isLoadingMore,
 * isInitialLoading, paginationError, zIndex.
 *
 * The option list is rendered with `createPortal` + `position: fixed` so it is not clipped by
 * ancestor `overflow` and stays aligned to the trigger on scroll/resize (opens above when
 * there is not enough space below).
 */
const SelectWithLoadMore = ({
    label,
    id,
    value,
    onChange,
    options = [],
    emptyOptionLabel,
    disabled = false,
    triggerStyle: triggerStyleProp,
    listMaxHeight = 240,
    hasMore: hasMoreProp,
    showLoadMore,
    onLoadMore,
    isLoadingMore = false,
    isInitialLoading = false,
    paginationError = null,
    zIndex = 300,
}) => {
    const uid = useId();
    const spinKeyframesId = `selectWithLoadMoreSpin_${reactIdSafe(uid)}`;
    const listboxId = id ? `${id}-listbox` : `${reactIdSafe(uid)}-listbox`;
    const [open, setOpen] = useState(false);
    const [hoveredValue, setHoveredValue] = useState(null);
    const [menuPlacement, setMenuPlacement] = useState(null);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const listRef = useRef(null);
    const sentinelRef = useRef(null);
    const scrollRafRef = useRef(0);

    const hasMore = Boolean(hasMoreProp ?? showLoadMore);
    const selectDisabled = disabled || isInitialLoading;

    const selectedLabel = useMemo(() => {
        if (value === '' || value == null) return '';
        const hit = options.find((o) => o.value === value);
        return hit?.label ?? value;
    }, [options, value]);

    const triggerLabel = selectedLabel || (emptyOptionLabel != null ? emptyOptionLabel : 'Select…');

    const tryLoadMore = useCallback(() => {
        if (!hasMore || isLoadingMore || !onLoadMore) return;
        onLoadMore();
    }, [hasMore, isLoadingMore, onLoadMore]);

    const updateMenuPlacement = useCallback(() => {
        if (!open || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0;
        const maxHConfig = parseMaxHeightPx(listMaxHeight);
        const spaceBelow = viewportH - rect.bottom - MENU_GAP_PX;
        const spaceAbove = rect.top - MENU_GAP_PX;
        const targetMin = Math.min(maxHConfig, 200);
        const openAbove = spaceBelow < targetMin && spaceAbove > spaceBelow;
        const maxHeightPx = Math.min(
            maxHConfig,
            Math.max(96, (openAbove ? spaceAbove : spaceBelow) - VIEWPORT_EDGE_PAD_PX)
        );

        setMenuPlacement({
            left: rect.left,
            width: rect.width,
            openAbove,
            top: rect.bottom + MENU_GAP_PX,
            triggerTop: rect.top,
            maxHeightPx,
        });
    }, [open, listMaxHeight]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuPlacement(null);
            return undefined;
        }
        updateMenuPlacement();
        const onReposition = () => updateMenuPlacement();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, updateMenuPlacement, options.length]);

    useLayoutEffect(() => {
        if (!open || !listRef.current || !sentinelRef.current) return undefined;

        const root = listRef.current;
        const sentinel = sentinelRef.current;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) return;
                tryLoadMore();
            },
            { root, rootMargin: `0px 0px ${NEAR_BOTTOM_PX}px 0px`, threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [open, hasMore, isLoadingMore, options.length, tryLoadMore, menuPlacement]);

    const onListScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !hasMore || isLoadingMore) return;
        if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = 0;
            const { scrollTop, clientHeight, scrollHeight } = el;
            if (scrollTop + clientHeight >= scrollHeight - NEAR_BOTTOM_PX) {
                tryLoadMore();
            }
        });
    }, [hasMore, isLoadingMore, tryLoadMore]);

    useEffect(() => () => {
        if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => {
            const t = e.target;
            if (rootRef.current?.contains(t)) return;
            if (listRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const defaultTriggerStyle = {
        height: '2.5rem',
        padding: '0 0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        color: 'var(--color-text-main)',
        cursor: selectDisabled ? 'not-allowed' : 'pointer',
        opacity: selectDisabled ? 0.65 : 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 400,
        textAlign: 'left',
    };

    const optionRowStyle = (active, hovered) => ({
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 400,
        cursor: 'pointer',
        background: active
            ? 'var(--color-primary-500)'
            : hovered
                ? 'var(--color-bg-table-header)'
                : 'transparent',
        color: active ? '#fff' : 'var(--color-text-main)',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        display: 'block',
    });

    return (
        <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <style>{`
                @keyframes ${spinKeyframesId} {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            {label ? (
                <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {label}
                </label>
            ) : null}

            <div style={{ position: 'relative', width: '100%' }}>
                <button
                    ref={buttonRef}
                    id={id}
                    type="button"
                    disabled={selectDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    onClick={() => {
                        if (!selectDisabled) setOpen((o) => !o);
                    }}
                    style={{ ...defaultTriggerStyle, ...triggerStyleProp }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{triggerLabel}</span>
                    <span aria-hidden style={{ flexShrink: 0, opacity: 0.7 }}>
                        ▾
                    </span>
                </button>

                {open && !selectDisabled && menuPlacement && typeof document !== 'undefined'
                    ? createPortal(
                          <div
                              id={listboxId}
                              role="listbox"
                              ref={listRef}
                              onScroll={onListScroll}
                              style={{
                                  position: 'fixed',
                                  zIndex,
                                  left: `${menuPlacement.left}px`,
                                  width: `${menuPlacement.width}px`,
                                  maxHeight: `${menuPlacement.maxHeightPx}px`,
                                  overflowY: 'auto',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--color-border)',
                                  background: 'var(--color-bg-surface)',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                  ...(menuPlacement.openAbove
                                      ? {
                                            bottom: `${window.innerHeight - menuPlacement.triggerTop + MENU_GAP_PX}px`,
                                            top: 'auto',
                                        }
                                      : {
                                            top: `${menuPlacement.top}px`,
                                            bottom: 'auto',
                                        }),
                              }}
                          >
                              {emptyOptionLabel != null ? (
                                  <button
                                      type="button"
                                      role="option"
                                      aria-selected={value === ''}
                                      style={optionRowStyle(value === '', hoveredValue === '__empty__')}
                                      onMouseEnter={() => setHoveredValue('__empty__')}
                                      onMouseLeave={() => setHoveredValue(null)}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                          onChange('');
                                          setOpen(false);
                                      }}
                                  >
                                      {emptyOptionLabel}
                                  </button>
                              ) : null}
                              {options.map((opt) => (
                                  <button
                                      key={opt.value}
                                      type="button"
                                      role="option"
                                      aria-selected={opt.value === value}
                                      style={optionRowStyle(opt.value === value, hoveredValue === opt.value)}
                                      onMouseEnter={() => setHoveredValue(opt.value)}
                                      onMouseLeave={() => setHoveredValue(null)}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                          onChange(opt.value);
                                          setOpen(false);
                                      }}
                                  >
                                      {opt.label}
                                  </button>
                              ))}

                              {isLoadingMore ? (
                                  <div
                                      role="status"
                                      aria-live="polite"
                                      style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.5rem 0.75rem',
                                          fontSize: '0.8125rem',
                                          color: 'var(--color-text-secondary)',
                                          borderTop: '1px solid var(--color-border)',
                                      }}
                                  >
                                      <span
                                          aria-hidden
                                          style={{
                                              ...inlineSpinnerStyle,
                                              display: 'inline-block',
                                              animation: `${spinKeyframesId} 0.75s linear infinite`,
                                          }}
                                      />
                                      Loading…
                                  </div>
                              ) : null}

                              {paginationError ? (
                                  <div
                                      style={{
                                          padding: '0.5rem 0.75rem',
                                          fontSize: '0.8125rem',
                                          color: 'var(--color-error)',
                                          borderTop: '1px solid var(--color-border)',
                                      }}
                                  >
                                      {paginationError}
                                  </div>
                              ) : null}

                              {hasMore ? (
                                  <div ref={sentinelRef} style={{ height: 1, width: '100%', flexShrink: 0 }} aria-hidden />
                              ) : null}
                          </div>,
                          document.body
                      )
                    : null}
            </div>
        </div>
    );
};

export default SelectWithLoadMore;
