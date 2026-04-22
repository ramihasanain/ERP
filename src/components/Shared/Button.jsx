import React from 'react';
import clsx from 'clsx';
import styles from '@/components/Shared/Button.module.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    isLoading,
    icon,
    ...restProps
}) => {
    return (
        <button
            className={clsx(
                styles.button,
                styles[variant],
                styles[size],
                { [styles.fullWidth]: fullWidth },
                { [styles.iconOnly]: !children && icon },
                className
            )}
            disabled={isLoading || restProps.disabled}
            {...restProps}
        >
            {isLoading && (
                <span style={{
                    width: '1em',
                    height: '1em',
                    border: '2px solid currentColor',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
            )}
            {!isLoading && icon && <span className={styles.icon}>{icon}</span>}
            {children}

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </button>
    );
};

export default Button;
