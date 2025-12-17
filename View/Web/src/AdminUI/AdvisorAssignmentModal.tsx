import React, { useState } from 'react';

// Color constants
const colors = {
    linen: '#FFFDF5',
    white: '#FFFFFF',
    mineShaft: '#333333',
    doveGray: '#666666',
    morningGlory: '#9DE2D0',
    apricot: '#EB8F80',
    prelude: '#C8ADD6',
    corvette: '#FADE9F',
    caper: '#D4E5AE',
    silver: '#9B9B9B',
};

interface Advisor {
    id: string;
    name: string;
    specialization: string;
    status: 'available' | 'busy' | 'offline';
    currentWorkload: number;
    languages: string[];
}

// Mock advisors
const mockAdvisors: Advisor[] = [
    { id: 'adv-1', name: 'Dr. Wong Li Mei', specialization: 'Relationship Guidance', status: 'available', currentWorkload: 2, languages: ['English', 'Mandarin', 'Cantonese'] },
    { id: 'adv-2', name: 'Encik Razak bin Abdullah', specialization: 'Conflict Mediation', status: 'available', currentWorkload: 3, languages: ['English', 'Malay'] },
    { id: 'adv-3', name: 'Ms. Priya Ramasamy', specialization: 'Communication Support', status: 'busy', currentWorkload: 5, languages: ['English', 'Tamil', 'Malay'] },
    { id: 'adv-4', name: 'Mr. Lim Kah Seng', specialization: 'General Advice', status: 'available', currentWorkload: 1, languages: ['English', 'Mandarin', 'Hokkien'] },
];

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: colors.white,
        borderRadius: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    header: {
        padding: '24px 28px',
        borderBottom: `2px solid ${colors.linen}`,
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '22px',
        color: colors.mineShaft,
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
        margin: 0,
    },
    content: {
        padding: '24px 28px',
        overflowY: 'auto' as const,
        flex: 1,
    },
    advisorCard: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        marginBottom: '12px',
        background: colors.linen,
        borderRadius: '12px',
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    advisorCardSelected: {
        border: `2px solid ${colors.morningGlory}`,
        background: colors.white,
        boxShadow: '0 4px 12px rgba(157, 226, 208, 0.3)',
    },
    advisorCardDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    avatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors.morningGlory} 0%, ${colors.prelude} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        marginRight: '16px',
    },
    advisorInfo: {
        flex: 1,
    },
    advisorName: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        color: colors.mineShaft,
        margin: '0 0 4px 0',
    },
    advisorMeta: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.doveGray,
        margin: 0,
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
    },
    statusAvailable: {
        background: colors.caper,
        color: colors.mineShaft,
    },
    statusBusy: {
        background: colors.corvette,
        color: colors.mineShaft,
    },
    statusOffline: {
        background: colors.silver,
        color: colors.white,
    },
    workloadText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: colors.doveGray,
        marginTop: '4px',
    },
    languagesText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: colors.prelude,
        marginTop: '2px',
    },
    footer: {
        padding: '20px 28px',
        borderTop: `2px solid ${colors.linen}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },
    button: {
        padding: '12px 24px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 700,
        transition: 'all 0.2s ease',
    },
    cancelButton: {
        background: 'transparent',
        border: `2px solid ${colors.silver}`,
        color: colors.doveGray,
    },
    confirmButton: {
        background: colors.morningGlory,
        color: colors.white,
    },
    confirmButtonDisabled: {
        background: colors.silver,
        cursor: 'not-allowed',
    },
    noAdvisors: {
        textAlign: 'center' as const,
        padding: '40px 20px',
    },
    noAdvisorsIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    noAdvisorsText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: colors.doveGray,
        margin: '0 0 8px 0',
    },
    noAdvisorsSubtext: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.silver,
        margin: 0,
    },
};

interface AdvisorAssignmentModalProps {
    onClose: () => void;
    onAssign: (advisorId: string) => void;
    requestId: string;
}

export const AdvisorAssignmentModal: React.FC<AdvisorAssignmentModalProps> = ({
    onClose,
    onAssign,
    requestId,
}) => {
    const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
    const [advisors] = useState<Advisor[]>(mockAdvisors);

    const availableAdvisors = advisors.filter(a => a.status === 'available');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'available': return styles.statusAvailable;
            case 'busy': return styles.statusBusy;
            default: return styles.statusOffline;
        }
    };

    const handleConfirm = () => {
        if (selectedAdvisor) {
            onAssign(selectedAdvisor);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Assign to Family Advisor</h2>
                    <p style={styles.subtitle}>
                        Select an available advisor for request {requestId}
                    </p>
                </div>

                <div style={styles.content}>
                    {availableAdvisors.length === 0 ? (
                        <div style={styles.noAdvisors}>
                            <div style={styles.noAdvisorsIcon}>😔</div>
                            <p style={styles.noAdvisorsText}>No advisors available</p>
                            <p style={styles.noAdvisorsSubtext}>
                                The request will remain pending until an advisor becomes available.
                            </p>
                        </div>
                    ) : (
                        advisors.map(advisor => (
                            <div
                                key={advisor.id}
                                style={{
                                    ...styles.advisorCard,
                                    ...(selectedAdvisor === advisor.id ? styles.advisorCardSelected : {}),
                                    ...(advisor.status !== 'available' ? styles.advisorCardDisabled : {}),
                                }}
                                onClick={() => {
                                    if (advisor.status === 'available') {
                                        setSelectedAdvisor(advisor.id);
                                    }
                                }}
                            >
                                <div style={styles.avatar}>👨‍⚕️</div>
                                <div style={styles.advisorInfo}>
                                    <h4 style={styles.advisorName}>{advisor.name}</h4>
                                    <p style={styles.advisorMeta}>{advisor.specialization}</p>
                                    <p style={styles.workloadText}>
                                        Current workload: {advisor.currentWorkload} active consultations
                                    </p>
                                    <p style={styles.languagesText}>
                                        🌐 {advisor.languages.join(', ')}
                                    </p>
                                </div>
                                <span style={{
                                    ...styles.statusBadge,
                                    ...getStatusStyle(advisor.status),
                                }}>
                                    {advisor.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div style={styles.footer}>
                    <button style={{ ...styles.button, ...styles.cancelButton }} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        style={{
                            ...styles.button,
                            ...styles.confirmButton,
                            ...(!selectedAdvisor ? styles.confirmButtonDisabled : {}),
                        }}
                        onClick={handleConfirm}
                        disabled={!selectedAdvisor}
                    >
                        Assign Advisor
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvisorAssignmentModal;
