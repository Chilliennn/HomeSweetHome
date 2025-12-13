import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: '#9DE2D0',
        color: '#ffffff',
    },
    secondary: {
        backgroundColor: '#f0f0f0',
        color: '#333333',
    },
    danger: {
        backgroundColor: '#EB8F80',
        color: '#ffffff',
    },
    warning: {
        backgroundColor: '#D4E5AE',
        color: '#333333',
    },
    outline: {
        backgroundColor: 'transparent',
        border: '2px solid #9DE2D0',
        color: '#9DE2D0',
    },
};

const baseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
};

const disabledStyle: React.CSSProperties = {
    opacity: 0.6,
    cursor: 'not-allowed',
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    loading = false,
    fullWidth = false,
    disabled,
    style,
    children,
    ...props
}) => {
    const combinedStyle: React.CSSProperties = {
        ...baseStyle,
        ...variantStyles[variant],
        ...(fullWidth ? { width: '100%' } : {}),
        ...(disabled || loading ? disabledStyle : {}),
        ...style,
    };

    return (
        <button
            style={combinedStyle}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
};

export default Button;
