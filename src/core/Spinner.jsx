const Spinner = ({ size = 28, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '999px',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary-600)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
