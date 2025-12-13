import React from 'react';

interface CardProps {
    children: React.ReactNode;
    padding?: number | string;
    style?: React.CSSProperties;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

const baseStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

export const Card: React.FC<CardProps> = ({
    children,
    padding = '1.5rem',
    style,
    className,
    onClick,
    hoverable = false,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const combinedStyle: React.CSSProperties = {
        ...baseStyle,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        ...(hoverable && isHovered ? {
            boxShadow: '0 4px 12px rgba(157, 226, 208, 0.2)',
            borderColor: '#9DE2D0',
        } : {}),
        ...style,
    };

    return (
        <div
            style={combinedStyle}
            className={className}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
        </div>
    );
};

export default Card;
