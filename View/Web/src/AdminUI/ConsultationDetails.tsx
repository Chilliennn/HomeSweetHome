import React, { useState } from 'react';
import { AdvisorAssignmentModal } from './AdvisorAssignmentModal';
import { DismissalModal } from './DismissalModal';

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

interface ConsultationRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterType: 'youth' | 'elderly';
    requesterAge: number;
    requesterLocation: string;
    requesterLanguages: string[];
    partnerName: string;
    partnerAge: number;
    partnerOccupation: string;
    partnerLocation: string;
    partnerCommunicationStyle: string;
    partnerLastActive: string;
    consultationType: string;
    preferredMethod: string;
    preferredDateTime: string;
    concernDescription: string;
    status: 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed';
    submittedAt: string;
    urgency: 'low' | 'normal' | 'high';
    relationshipStage: string;
    relationshipDuration: string;
    assignedAdvisor?: string;
}

// Mock data
const mockRequest: ConsultationRequest = {
    id: 'REQ-001',
    requesterId: 'user-101',
    requesterName: 'Sarah Chen',
    requesterType: 'youth',
    requesterAge: 22,
    requesterLocation: 'Kuala Lumpur',
    requesterLanguages: ['English', 'Mandarin'],
    partnerName: 'Uncle Tan Ah Kow',
    partnerAge: 68,
    partnerOccupation: 'Retired Teacher',
    partnerLocation: 'Kuala Lumpur',
    partnerCommunicationStyle: 'Patient, Prefers phone calls',
    partnerLastActive: '2 hours ago',
    consultationType: 'Relationship Guidance',
    preferredMethod: 'Video Call',
    preferredDateTime: '2025-12-15 10:00 AM',
    concernDescription: `I feel like we have been drifting apart lately. Uncle Tan seems distant and I am not sure how to reconnect with him.

We used to have weekly video calls but now it has become more sporadic. I understand he might be busy with his health check-ups but I want to find a way to maintain our bond.

Sometimes I feel like I might have said something wrong during our last conversation about my career plans. He seemed disappointed when I mentioned wanting to work overseas temporarily.

I really value this relationship and want to work through this. I think speaking with a family advisor could help us communicate better and understand each other's perspectives.`,
    status: 'pending_assignment',
    submittedAt: '2025-12-11T08:30:00Z',
    urgency: 'normal',
    relationshipStage: 'Family Life',
    relationshipDuration: '8 months',
};

const styles = {
    container: {
        padding: '40px 60px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box' as const,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: colors.prelude,
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: 700,
        color: colors.mineShaft,
        marginBottom: '20px',
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '28px',
        color: colors.mineShaft,
        margin: 0,
    },
    statusBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
        background: colors.corvette,
        color: colors.mineShaft,
    },
    urgencyBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
    },
    urgencyHigh: {
        background: colors.apricot,
        color: colors.white,
    },
    urgencyNormal: {
        background: colors.corvette,
        color: colors.mineShaft,
    },
    meta: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
        margin: 0,
    },
    headerActions: {
        display: 'flex',
        gap: '12px',
    },
    actionButton: {
        padding: '14px 28px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontWeight: 700,
        transition: 'all 0.2s ease',
    },
    assignButton: {
        background: colors.morningGlory,
        color: colors.white,
    },
    dismissButton: {
        background: 'transparent',
        border: `2px solid ${colors.apricot}`,
        color: colors.apricot,
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
    },
    card: {
        background: colors.white,
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    cardTitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        color: colors.mineShaft,
        margin: '0 0 20px 0',
        paddingBottom: '12px',
        borderBottom: `2px solid ${colors.linen}`,
    },
    profileRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
    },
    avatar: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors.morningGlory} 0%, ${colors.prelude} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        color: colors.mineShaft,
        margin: '0 0 4px 0',
    },
    profileMeta: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
        margin: 0,
    },
    roleBadge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
    },
    youthBadge: {
        background: colors.morningGlory,
        color: colors.white,
    },
    elderlyBadge: {
        background: colors.prelude,
        color: colors.white,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    infoItem: {
        marginBottom: '12px',
    },
    infoLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.silver,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        margin: '0 0 4px 0',
    },
    infoValue: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        color: colors.mineShaft,
        margin: 0,
    },
    concernCard: {
        gridColumn: '1 / -1',
    },
    concernText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        lineHeight: '1.7',
        color: colors.mineShaft,
        margin: 0,
        whiteSpace: 'pre-wrap' as const,
    },
    typeBadge: {
        display: 'inline-block',
        padding: '6px 14px',
        background: colors.prelude,
        borderRadius: '16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.white,
        marginBottom: '16px',
    },
};

interface ConsultationDetailsProps {
    requestId?: string;
    onBack?: () => void;
}

export const ConsultationDetails: React.FC<ConsultationDetailsProps> = ({ requestId: _requestId, onBack }) => {
    const [request] = useState<ConsultationRequest>(mockRequest);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDismissModal, setShowDismissModal] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAssign = (advisorId: string) => {
        console.log('Assigned to advisor:', advisorId);
        setShowAssignModal(false);
        // TODO: Update status and send notifications
    };

    const handleDismiss = (reason: string, notes: string) => {
        console.log('Dismissed with reason:', reason, notes);
        setShowDismissModal(false);
        // TODO: Update status and notify requester
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button style={styles.backButton} onClick={onBack}>
                        ← Back to Consultations
                    </button>
                    <div style={styles.titleRow}>
                        <h1 style={styles.title}>Request {request.id}</h1>
                        <span style={styles.statusBadge}>Pending Assignment</span>
                        <span style={{
                            ...styles.urgencyBadge,
                            ...(request.urgency === 'high' ? styles.urgencyHigh : styles.urgencyNormal),
                        }}>
                            {request.urgency.toUpperCase()} URGENCY
                        </span>
                    </div>
                    <p style={styles.meta}>
                        Submitted: {formatDate(request.submittedAt)} • {request.relationshipStage} • {request.relationshipDuration}
                    </p>
                </div>
                <div style={styles.headerActions}>
                    <button
                        style={{ ...styles.actionButton, ...styles.dismissButton }}
                        onClick={() => setShowDismissModal(true)}
                    >
                        Dismiss Request
                    </button>
                    <button
                        style={{ ...styles.actionButton, ...styles.assignButton }}
                        onClick={() => setShowAssignModal(true)}
                    >
                        Assign to Advisor
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Requester Profile */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👤 Requester Profile</h3>
                    <div style={styles.profileRow}>
                        <div style={styles.avatar}>
                            {request.requesterType === 'youth' ? '👧' : '👴'}
                        </div>
                        <div style={styles.profileInfo}>
                            <h4 style={styles.profileName}>{request.requesterName}</h4>
                            <p style={styles.profileMeta}>ID: {request.requesterId}</p>
                        </div>
                        <span style={{
                            ...styles.roleBadge,
                            ...(request.requesterType === 'youth' ? styles.youthBadge : styles.elderlyBadge),
                        }}>
                            {request.requesterType}
                        </span>
                    </div>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Age</p>
                            <p style={styles.infoValue}>{request.requesterAge} years old</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Location</p>
                            <p style={styles.infoValue}>{request.requesterLocation}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Languages</p>
                            <p style={styles.infoValue}>{request.requesterLanguages.join(', ')}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Relationship Stage</p>
                            <p style={styles.infoValue}>{request.relationshipStage}</p>
                        </div>
                    </div>
                </div>

                {/* Partner Profile */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👥 Partner Profile</h3>
                    <div style={styles.profileRow}>
                        <div style={styles.avatar}>
                            {request.requesterType === 'youth' ? '👴' : '👧'}
                        </div>
                        <div style={styles.profileInfo}>
                            <h4 style={styles.profileName}>{request.partnerName}</h4>
                            <p style={styles.profileMeta}>{request.partnerOccupation}</p>
                        </div>
                        <span style={{
                            ...styles.roleBadge,
                            ...(request.requesterType === 'youth' ? styles.elderlyBadge : styles.youthBadge),
                        }}>
                            {request.requesterType === 'youth' ? 'elderly' : 'youth'}
                        </span>
                    </div>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Age</p>
                            <p style={styles.infoValue}>{request.partnerAge} years old</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Location</p>
                            <p style={styles.infoValue}>{request.partnerLocation}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Communication Style</p>
                            <p style={styles.infoValue}>{request.partnerCommunicationStyle}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Last Active</p>
                            <p style={styles.infoValue}>{request.partnerLastActive}</p>
                        </div>
                    </div>
                </div>

                {/* Request Information */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>📋 Request Information</h3>
                    <span style={styles.typeBadge}>{request.consultationType}</span>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Preferred Method</p>
                            <p style={styles.infoValue}>{request.preferredMethod}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Preferred Date & Time</p>
                            <p style={styles.infoValue}>{request.preferredDateTime}</p>
                        </div>
                    </div>
                </div>

                {/* Relationship Info */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>💕 Relationship Info</h3>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Current Stage</p>
                            <p style={styles.infoValue}>{request.relationshipStage}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Duration</p>
                            <p style={styles.infoValue}>{request.relationshipDuration}</p>
                        </div>
                    </div>
                </div>

                {/* Concern Description */}
                <div style={{ ...styles.card, ...styles.concernCard }}>
                    <h3 style={styles.cardTitle}>💬 Concern Description</h3>
                    <p style={styles.concernText}>{request.concernDescription}</p>
                </div>
            </div>

            {/* Modals */}
            {showAssignModal && (
                <AdvisorAssignmentModal
                    onClose={() => setShowAssignModal(false)}
                    onAssign={handleAssign}
                    requestId={request.id}
                />
            )}

            {showDismissModal && (
                <DismissalModal
                    onClose={() => setShowDismissModal(false)}
                    onDismiss={handleDismiss}
                    requestId={request.id}
                />
            )}
        </div>
    );
};

export default ConsultationDetails;
