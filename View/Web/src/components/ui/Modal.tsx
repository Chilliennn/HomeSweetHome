import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
};

const contentBaseStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    minWidth: '320px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    maxWidth = '500px',
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div style={overlayStyle} onClick={handleOverlayClick}>
            <div style={{ ...contentBaseStyle, maxWidth }}>
                {children}
            </div>
        </div>
    );
};

// Modal sub-components for structure
interface ModalHeaderProps {
    children: React.ReactNode;
    onClose?: () => void;
}

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0.25rem',
    lineHeight: 1,
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose }) => (
    <div style={headerStyle}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>{children}</div>
        {onClose && (
            <button style={closeButtonStyle} onClick={onClose}>×</button>
        )}
    </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
    <div style={{ marginBottom: '1.5rem', ...style }}>{children}</div>
);

const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0',
};

export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={footerStyle}>{children}</div>
);

export default Modal;
