import React from 'react';

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    alert?: boolean;
    style?: React.CSSProperties;
}

const baseStyle: React.CSSProperties = {
    padding: '1rem',
    marginBottom: '0.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    borderLeft: '4px solid #9DE2D0',
    transition: 'all 0.3s ease',
};

const alertStyle: React.CSSProperties = {
    borderLeft: '4px solid #EB8F80',
    backgroundColor: '#fff5f5',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: '0.3rem',
};

const valueStyle: React.CSSProperties = {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};

const alertValueStyle: React.CSSProperties = {
    color: '#EB8F80',
};

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    alert = false,
    style,
}) => {
    return (
        <div style={{ ...baseStyle, ...(alert ? alertStyle : {}), ...style }}>
            <div style={labelStyle}>{label}</div>
            <div style={{ ...valueStyle, ...(alert ? alertValueStyle : {}) }}>
                {value}
                {alert && <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>⚠️</span>}
            </div>
        </div>
    );
};

export default StatCard;
