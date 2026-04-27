export const humanizeTag = (tag) => tag.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const formatTemplateDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsed);
};

export const selectStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
};

export const contractTypeOptions = [
    { value: 'full_time', label: 'Full-Time' },
    { value: 'part_time', label: 'Part-Time' },
    { value: 'fixed_term', label: 'Fixed-Term' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
];
