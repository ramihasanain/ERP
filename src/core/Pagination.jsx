const getVisiblePages = (totalPages, currentPage) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('...');

  pages.push(totalPages);
  return pages;
};

const buttonBaseStyle = {
  minWidth: '2rem',
  height: '2rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-card)',
  color: 'var(--color-text-main)',
  fontWeight: 500,
  fontSize: '0.875rem',
  cursor: 'pointer',
  padding: '0 0.5rem',
};

const Pagination = ({ currentPage = 1, count = 0, onPageChange, pageSize = 15 }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pages = getVisiblePages(totalPages, currentPage);

  if (count <= pageSize) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Page {currentPage} of {totalPages}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          style={buttonBaseStyle}
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          Prev
        </button>

        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} style={{ color: 'var(--color-text-secondary)' }}>
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              style={{
                ...buttonBaseStyle,
                backgroundColor: isActive ? 'var(--color-primary-600)' : 'var(--color-bg-card)',
                borderColor: isActive ? 'var(--color-primary-600)' : 'var(--color-border)',
                color: isActive ? '#fff' : 'var(--color-text-main)',
              }}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          style={buttonBaseStyle}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
