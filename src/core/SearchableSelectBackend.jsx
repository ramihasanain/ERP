import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import Spinner from '@/core/Spinner';

const NEAR_BOTTOM_PX = 48;

const inlineSpinnerStyle = {
    width: '0.875rem',
    height: '0.875rem',
    borderRadius: '999px',
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-primary-600)',
    flexShrink: 0,
};

const SearchableSelectBackend = ({
    label,
    value,
    onChange,
    options = [],
    searchTerm = '',
    onSearchChange,
    placeholder = 'Search...',
    emptyLabel = 'No options found',
    getOptionLabel = (option) => option?.label ?? '',
    getOptionValue = (option) => option?.value ?? '',
    disabled = false,
    hasMore = false,
    onLoadMore,
    isLoadingMore = false,
    isInitialLoading = false,
    paginationError = '',
    listMaxHeight = 220,
    zIndex = 80,
    searchDebounceMs = 300,
}) => {
    const uid = useId().replace(/:/g, '');
    const spinKeyframesId = `searchableSelectSpin_${uid}`;
    const [isOpen, setIsOpen] = useState(false);
    const [isTriggerHovered, setIsTriggerHovered] = useState(false);
    const [hoveredOptionValue, setHoveredOptionValue] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);
    const sentinelRef = useRef(null);
    const scrollRafRef = useRef(0);

    const selectDisabled = disabled;

    const selectedOption = useMemo(
        () => options.find((option) => getOptionValue(option) === value) || null,
        [options, value, getOptionValue]
    );
    const fallbackValueLabel = useMemo(() => {
        if (selectedOption) return '';
        if (typeof value === 'string') {
            const normalized = value.trim();
            return normalized || '';
        }
        if (value == null) return '';
        return String(value);
    }, [selectedOption, value]);

    const tryLoadMore = useCallback(() => {
        if (!hasMore || isLoadingMore || !onLoadMore) return;
        onLoadMore();
    }, [hasMore, isLoadingMore, onLoadMore]);

    useLayoutEffect(() => {
        if (!isOpen || !listRef.current || !sentinelRef.current) return undefined;

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
    }, [isOpen, hasMore, isLoadingMore, options.length, tryLoadMore]);

    const updateDropdownPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex,
        });
    }, [zIndex]);

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
        const handleClickOutside = (event) => {
            const clickedInsideTrigger = containerRef.current?.contains(event.target);
            const clickedInsideDropdown = dropdownRef.current?.contains(event.target);
            if (!clickedInsideTrigger && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return undefined;
        updateDropdownPosition();

        const handleViewportChange = () => updateDropdownPosition();
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen, updateDropdownPosition]);

    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (localSearchTerm === searchTerm) return;
            onSearchChange?.(localSearchTerm);
        }, searchDebounceMs);

        return () => window.clearTimeout(timeoutId);
    }, [localSearchTerm, searchTerm, onSearchChange, searchDebounceMs]);

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
            <style>{`
                @keyframes ${spinKeyframesId} {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            {label ? <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</label> : null}

            <button
                ref={triggerRef}
                type="button"
                onClick={() => !selectDisabled && setIsOpen((prev) => !prev)}
                onMouseEnter={() => !selectDisabled && setIsTriggerHovered(true)}
                onMouseLeave={() => setIsTriggerHovered(false)}
                disabled={selectDisabled}
                style={{
                    width: '100%',
                    minHeight: '2.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: selectDisabled ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                    background: selectDisabled
                        ? 'var(--color-bg-secondary)'
                        : isTriggerHovered
                            ? 'var(--color-bg-table-header)'
                            : 'var(--color-bg-surface)',
                    color: selectDisabled ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                    textAlign: 'left',
                    cursor: selectDisabled ? 'not-allowed' : 'pointer',
                    opacity: selectDisabled ? 0.75 : 1,
                    transition: 'background-color 0.15s ease',
                }}
            >
                {selectedOption ? getOptionLabel(selectedOption) : (fallbackValueLabel || placeholder)}
            </button>

            {isOpen && !selectDisabled && dropdownStyle
                ? createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            ...dropdownStyle,
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'var(--color-bg-surface)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                        }}
                    >
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            />
                            <input
                                value={localSearchTerm}
                                onChange={(event) => setLocalSearchTerm(event.target.value)}
                                placeholder={placeholder}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.85rem',
                                }}
                            />
                        </div>

                        <div
                            ref={listRef}
                            onScroll={onListScroll}
                            style={{ maxHeight: typeof listMaxHeight === 'number' ? `${listMaxHeight}px` : listMaxHeight, overflowY: 'auto' }}
                        >
                            {options.length ? (
                                options.map((option) => {
                                    const optionValue = getOptionValue(option);
                                    const isSelected = optionValue === value;
                                    const isHovered = hoveredOptionValue === optionValue;

                                    return (
                                        <button
                                            key={optionValue}
                                            type="button"
                                            onMouseEnter={() => setHoveredOptionValue(optionValue)}
                                            onMouseLeave={() => setHoveredOptionValue(null)}
                                            onClick={() => {
                                                onChange(optionValue, option);
                                                setIsOpen(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                border: 'none',
                                                borderBottom: '1px solid var(--color-border)',
                                                background: isSelected
                                                    ? 'var(--color-primary-50)'
                                                    : isHovered
                                                        ? 'var(--color-bg-table-header)'
                                                        : 'transparent',
                                                color: 'var(--color-text-main)',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                padding: '0.6rem 0.75rem',
                                                fontSize: '0.85rem',
                                                fontWeight: isSelected ? 600 : 400,
                                                transition: 'background-color 0.15s ease',
                                            }}
                                        >
                                            {getOptionLabel(option)}
                                        </button>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {emptyLabel}
                                </div>
                            )}

                            {isInitialLoading ? (
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
                                    <Spinner size={14} />
                                    Loading...
                                </div>
                            ) : null}

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
                                    Loading...
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

                            {hasMore ? <div ref={sentinelRef} style={{ height: 1, width: '100%', flexShrink: 0 }} aria-hidden /> : null}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
};

export default SearchableSelectBackend;
