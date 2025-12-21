// View/Web/src/components/AdminUI/NavigationBar.tsx

import React from 'react';

interface Props {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export const NavigationBar: React.FC<Props> = ({ currentPage, onNavigate }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 32px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5'
        }}>
            {/* Logo */}
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                HomeSweetHome
            </div>

            {/* Navigation Links */}
            <div style={{ display: 'flex', gap: '32px' }}>
                <button
                    onClick={() => onNavigate('relationships')}
                    style={{
                        background: currentPage === 'relationships' ? '#9DE2D0' : 'none',
                        border: currentPage === 'relationships' ? 'none' : 'none',
                        fontSize: '14px',
                        fontWeight: currentPage === 'relationships' ? 600 : 400,
                        color: currentPage === 'relationships' ? '#ffffff' : '#666666',
                        cursor: 'pointer',
                        padding: currentPage === 'relationships' ? '8px 16px' : '8px 0',
                        borderRadius: currentPage === 'relationships' ? '20px' : '0'
                    }}
                >
                    Relationships
                </button>
                <button
                    onClick={() => onNavigate('applications')}
                    style={{
                        background: currentPage === 'applications' ? '#9DE2D0' : 'none',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: currentPage === 'applications' ? 600 : 400,
                        color: currentPage === 'applications' ? '#ffffff' : '#666666',
                        cursor: 'pointer',
                        padding: currentPage === 'applications' ? '8px 16px' : '8px 0',
                        borderRadius: currentPage === 'applications' ? '20px' : '0'
                    }}
                >
                    Applications
                </button>
                <button
                    onClick={() => onNavigate('reports')}
                    style={{
                        background: currentPage === 'reports' ? '#9DE2D0' : 'none',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: currentPage === 'reports' ? 600 : 400,
                        color: currentPage === 'reports' ? '#ffffff' : '#666666',
                        cursor: 'pointer',
                        padding: currentPage === 'reports' ? '8px 16px' : '8px 0',
                        borderRadius: currentPage === 'reports' ? '20px' : '0'
                    }}
                >
                    Reports
                </button>
                <button
                    onClick={() => onNavigate('keyword-management')}
                    style={{
                        background: currentPage === 'keyword-management' ? '#9DE2D0' : 'none',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: currentPage === 'keyword-management' ? '#ffffff' : '#666666',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '20px'
                    }}
                >
                    Keyword Management
                </button>
            </div>

            {/* User Avatars */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#C8ADD6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    U
                </div>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#9DE2D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    SA
                </div>
            </div>
        </div>
    );
};
