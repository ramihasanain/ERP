import React, { useMemo } from 'react';
import SearchableSelectBackend from '@/core/SearchableSelectBackend';

const SearchableSelectFrontend = ({
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
}) => {
    const filteredOptions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return options;

        return options.filter((option) =>
            String(getOptionLabel(option)).toLowerCase().includes(normalizedSearch)
        );
    }, [options, searchTerm, getOptionLabel]);

    return (
        <SearchableSelectBackend
            label={label}
            value={value}
            onChange={onChange}
            options={filteredOptions}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder={placeholder}
            emptyLabel={emptyLabel}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            disabled={disabled}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
            isInitialLoading={isInitialLoading}
            paginationError={paginationError}
            listMaxHeight={listMaxHeight}
            zIndex={zIndex}
        />
    );
};

export default SearchableSelectFrontend;
