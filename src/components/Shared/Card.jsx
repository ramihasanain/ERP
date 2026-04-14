import React from 'react';
import clsx from 'clsx';
import styles from '@/components/Shared/Card.module.css';

const Card = ({
    children,
    className,
    padding = 'md',
    hoverable = false,
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
            {children}
        </div>
    );
};

export default Card;
