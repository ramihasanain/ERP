import React from 'react';
import clsx from 'clsx';
import styles from '@/components/Shared/Input.module.css';

const Input = ({
    label,
    error,
    startIcon,
    endIcon,
    className,
    containerClassName,
    ...props
}) => {
    return (
        <div className={clsx(styles.wrapper, containerClassName)}>
            {label && <label className={styles.label}>{label}</label>}

            <div className={styles.inputContainer}>
                {startIcon && <span className={clsx(styles.icon, styles.startIcon)}>{startIcon}</span>}

                <input
                    className={clsx(
                        styles.input,
                        {
                            [styles.errorInput]: error,
                            [styles.hasStartIcon]: startIcon,
                            [styles.hasEndIcon]: endIcon,
                        },
                        className
                    )}
                    {...props}
                />

                {endIcon && <span className={clsx(styles.icon, styles.endIcon)}>{endIcon}</span>}
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export default Input;
