import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { consultationViewModel } from '@home-sweet-home/viewmodel';
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
        width: 'fit-content',
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap' as const,
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
    completeButton: {
        background: colors.caper,
        color: colors.mineShaft,
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
    requestId: string;
    onBack?: () => void;
}

export const ConsultationDetails: React.FC<ConsultationDetailsProps> = observer(({ requestId, onBack }) => {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDismissModal, setShowDismissModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');

    // Load the consultation data when component mounts
    useEffect(() => {
        if (requestId) {
            // Clear any previous error message before loading
            consultationViewModel.errorMessage = null;
            consultationViewModel.selectConsultation(requestId);
        }
    }, [requestId]);

    const request = consultationViewModel.selectedConsultation;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_assignment': return 'Pending Assignment';
            case 'assigned': return 'Assigned';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'dismissed': return 'Dismissed';
            default: return status;
        }
    };

    const handleAssign = async (advisorId: string) => {
        if (request) {
            await consultationViewModel.assignAdvisor(request.id, advisorId);
            alert('✅ Advisor assigned successfully! The user has been notified.');
        }
        setShowAssignModal(false);
        onBack?.();
    };

    const handleDismiss = async (reason: string, notes: string) => {
        if (request) {
            await consultationViewModel.dismissRequest(request.id, `${reason}: ${notes}`);
        }
        setShowDismissModal(false);
        onBack?.();
    };

    const handleComplete = async () => {
        if (request && completionNotes.trim()) {
            await consultationViewModel.completeRequest(request.id, completionNotes);
            alert('✅ Consultation marked as completed!');
        }
        setShowCompleteModal(false);
        setCompletionNotes('');
        onBack?.();
    };

    // Show loading state
    if (consultationViewModel.isLoading) {
        return (
            <div style={styles.container}>
                <p>Loading consultation details...</p>
            </div>
        );
    }

    // If there's an error or no data, redirect back to consultations list
    if (consultationViewModel.errorMessage || !request) {
        // Clear error and go back
        if (consultationViewModel.errorMessage) {
            consultationViewModel.errorMessage = null;
        }

        // Show a brief message and redirect
        return (
            <div style={styles.container}>
                <button style={styles.backButton} onClick={onBack}>
                    ← Back to Consultations
                </button>
                <p style={{ color: colors.morningGlory }}>
                    ✓ Notification received. Redirecting to consultations list...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button style={styles.backButton} onClick={onBack}>
                        ← Back to Consultations
                    </button>
                    <div style={styles.titleRow}>
                        <h1 style={styles.title}>Request #{request.id.slice(0, 8)}</h1>
                        <span style={styles.statusBadge}>{getStatusLabel(request.status)}</span>
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
                    {(request.status === 'assigned' || request.status === 'in_progress') && (
                        <button
                            style={{ ...styles.actionButton, ...styles.completeButton }}
                            onClick={() => setShowCompleteModal(true)}
                        >
                            ✓ Mark as Complete
                        </button>
                    )}
                    {request.status === 'pending_assignment' && (
                        <button
                            style={{ ...styles.actionButton, ...styles.assignButton }}
                            onClick={() => setShowAssignModal(true)}
                        >
                            Assign to Advisor
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Requester Profile */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👤 Requester Profile</h3>
                    <div style={styles.profileRow}>
                        {request.requesterAvatarUrl ? (
                            <img
                                src={request.requesterAvatarUrl}
                                alt={request.requesterName}
                                style={{ ...styles.avatar, objectFit: 'cover' as const }}
                            />
                        ) : (
                            <div style={styles.avatar}>
                                {request.requesterName.charAt(0).toUpperCase()}
                            </div>
                        )}
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
                            <p style={styles.infoLabel}>Type</p>
                            <p style={styles.infoValue}>{request.requesterType === 'youth' ? 'Youth' : 'Elderly'}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Relationship Stage</p>
                            <p style={styles.infoValue}>{request.relationshipStage}</p>
                        </div>
                        <div style={styles.infoItem}>
                            <p style={styles.infoLabel}>Duration</p>
                            <p style={styles.infoValue}>{request.relationshipDuration}</p>
                        </div>
                    </div>
                </div>

                {/* Partner Profile */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👥 Partner Profile</h3>
                    <div style={styles.profileRow}>
                        {request.partnerAvatarUrl ? (
                            <img
                                src={request.partnerAvatarUrl}
                                alt={request.partnerName}
                                style={{ ...styles.avatar, objectFit: 'cover' as const }}
                            />
                        ) : (
                            <div style={styles.avatar}>
                                {request.partnerName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={styles.profileInfo}>
                            <h4 style={styles.profileName}>{request.partnerName}</h4>
                            <p style={styles.profileMeta}>{request.partnerAge} years old</p>
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
                            <p style={styles.infoLabel}>Role</p>
                            <p style={styles.infoValue}>{request.requesterType === 'youth' ? 'Elderly' : 'Youth'}</p>
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

            {/* Completion Modal */}
            {showCompleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: colors.white,
                        borderRadius: '16px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90%',
                    }}>
                        <h2 style={{ margin: '0 0 24px 0', fontFamily: 'Inter, sans-serif', color: colors.mineShaft }}>
                            ✓ Complete Consultation
                        </h2>
                        <p style={{ fontFamily: 'Inter, sans-serif', color: colors.doveGray, marginBottom: '16px' }}>
                            Please provide resolution notes for this consultation:
                        </p>
                        <textarea
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Enter resolution notes, outcome summary, and any follow-up actions..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.silver}`,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                background: colors.white,
                                color: colors.mineShaft,
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setShowCompleteModal(false); setCompletionNotes(''); }}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.silver}`,
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 600,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={!completionNotes.trim()}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: completionNotes.trim() ? colors.caper : colors.silver,
                                    color: colors.mineShaft,
                                    cursor: completionNotes.trim() ? 'pointer' : 'not-allowed',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 700,
                                }}
                            >
                                Complete Consultation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ConsultationDetails;
