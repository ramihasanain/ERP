const baseToastStyle = {
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
};

export const errorToastOptions = {
  duration: 5000,
  style: {
    ...baseToastStyle,
    border: '1px solid var(--color-error)',
  },
};

export const successToastOptions = {
  duration: 3500,
  style: {
    ...baseToastStyle,
    border: '1px solid var(--color-success)',
  },
};
