import React from 'react';
import clsx from 'clsx';
import styles from '@/components/Shared/Card.module.css';

const Card = ({
    children,
    className,
    padding = 'md',
    hoverable = false,
    title,
    headerAction,
    ...props
}) => {
    return (
        <div
            className={clsx(
                styles.card,
                styles[`padding-${padding}`],
                { [styles.hoverable]: hoverable },
                className
            )}
            {...props}
        >
            {(title || headerAction) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                    }}
                >
                    {title ? (
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                            {title}
                        </h3>
                    ) : (
                        <span />
                    )}
                    {headerAction}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
