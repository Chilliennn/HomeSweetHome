import React, { useState } from 'react';
import { StatCard } from '../components/ui';

// Color constants matching existing AdminUI design
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

// Types for consultation data
interface ConsultationRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterType: 'youth' | 'elderly';
    requesterAge: number;
    partnerName: string;
    partnerAge: number;
    consultationType: string;
    preferredMethod: string;
    preferredDateTime: string;
    concernDescription: string;
    status: 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed';
    submittedAt: string;
    urgency: 'low' | 'normal' | 'high';
    relationshipStage: string;
    relationshipDuration: string;
}

interface Advisor {
    id: string;
    name: string;
    specialization: string;
    status: 'available' | 'busy' | 'offline';
    currentWorkload: number;
    languages: string[];
}

// Data should come from database via ViewModel/Service/Repository
// Currently empty - will be populated when database is connected
const mockConsultations: ConsultationRequest[] = [];
const mockAdvisors: Advisor[] = [];

const styles = {
    container: {
        padding: '40px 60px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box' as const,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
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
        color: '#333333',
        marginBottom: '20px',
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '32px',
        lineHeight: '38px',
        color: colors.mineShaft,
        margin: 0,
    },
    subtitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '16px',
        color: colors.doveGray,
        margin: 0,
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '24px',
    },
    sidebar: {
        background: colors.white,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        height: 'fit-content',
    },
    sidebarSection: {
        marginBottom: '24px',
    },
    sidebarTitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: colors.doveGray,
        margin: '0 0 12px 0',
    },
    filterButton: {
        display: 'block',
        width: '100%',
        padding: '12px 16px',
        marginBottom: '8px',
        background: 'transparent',
        border: `2px solid ${colors.silver}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.doveGray,
        textAlign: 'left' as const,
        transition: 'all 0.2s ease',
    },
    filterButtonActive: {
        background: colors.morningGlory,
        borderColor: colors.morningGlory,
        color: colors.white,
    },
    listContainer: {
        background: colors.white,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: `2px solid ${colors.linen}`,
    },
    listTitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '20px',
        color: colors.mineShaft,
        margin: 0,
    },
    totalCount: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.morningGlory,
        fontWeight: 600,
    },
    requestCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '20px',
        marginBottom: '16px',
        background: colors.linen,
        borderRadius: '12px',
        border: `2px solid transparent`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    requestCardHover: {
        borderColor: colors.morningGlory,
        boxShadow: '0 4px 12px rgba(157, 226, 208, 0.2)',
    },
    requestInfo: {
        flex: 1,
    },
    requestIdRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    requestId: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.silver,
        textTransform: 'uppercase' as const,
    },
    urgencyBadge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
    },
    urgencyHigh: {
        background: colors.apricot,
        color: colors.white,
    },
    urgencyNormal: {
        background: colors.corvette,
        color: colors.mineShaft,
    },
    urgencyLow: {
        background: colors.caper,
        color: colors.mineShaft,
    },
    requesterName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: '0 0 4px 0',
    },
    requestMeta: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.doveGray,
        margin: '0 0 8px 0',
    },
    consultationType: {
        display: 'inline-block',
        padding: '4px 12px',
        background: colors.prelude,
        borderRadius: '16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.white,
    },
    concernPreview: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
        margin: '12px 0 0 0',
        lineHeight: '1.5',
    },
    requestActions: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end',
        gap: '12px',
        marginLeft: '20px',
    },
    statusBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
    },
    statusPending: {
        background: colors.corvette,
        color: colors.mineShaft,
    },
    statusAssigned: {
        background: colors.morningGlory,
        color: colors.white,
    },
    statusInProgress: {
        background: colors.prelude,
        color: colors.white,
    },
    statusCompleted: {
        background: colors.caper,
        color: colors.mineShaft,
    },
    waitingTime: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.doveGray,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    waitingTimeAlert: {
        color: colors.apricot,
        fontWeight: 600,
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '60px 20px',
        color: colors.doveGray,
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    emptyText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        margin: 0,
    },
};

interface ConsultationDashboardProps {
    onBack?: () => void;
    onSelectRequest?: (requestId: string) => void;
}

export const ConsultationDashboard: React.FC<ConsultationDashboardProps> = ({
    onBack,
    onSelectRequest
}) => {
    const [filter, setFilter] = useState<'all' | 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed'>('all');
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [consultations] = useState<ConsultationRequest[]>(mockConsultations);

    // Calculate stats
    const stats = {
        pendingAssignment: consultations.filter(c => c.status === 'pending_assignment').length,
        inProgress: consultations.filter(c => c.status === 'in_progress' || c.status === 'assigned').length,
        completedToday: consultations.filter(c => c.status === 'completed').length,
        availableAdvisors: mockAdvisors.filter(a => a.status === 'available').length,
    };

    // Filter consultations
    const filteredConsultations = filter === 'all'
        ? consultations
        : consultations.filter(c => c.status === filter);

    const getWaitingTime = (submittedAt: string): string => {
        const submitted = new Date(submittedAt);
        const now = new Date();
        const hours = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    };

    const isWaitingTimeAlert = (submittedAt: string): boolean => {
        const submitted = new Date(submittedAt);
        const now = new Date();
        const hours = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
        return hours > 24;
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending_assignment': return styles.statusPending;
            case 'assigned': return styles.statusAssigned;
            case 'in_progress': return styles.statusInProgress;
            case 'completed': return styles.statusCompleted;
            default: return styles.statusPending;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_assignment': return 'Pending';
            case 'assigned': return 'Assigned';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'dismissed': return 'Dismissed';
            default: return status;
        }
    };

    const getUrgencyStyle = (urgency: string) => {
        switch (urgency) {
            case 'high': return styles.urgencyHigh;
            case 'normal': return styles.urgencyNormal;
            case 'low': return styles.urgencyLow;
            default: return styles.urgencyNormal;
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    {onBack && (
                        <button style={styles.backButton} onClick={onBack}>
                            ← Back to Reports
                        </button>
                    )}
                    <h1 style={styles.title}>Family Advisor Consultations</h1>
                    <p style={styles.subtitle}>
                        Review requests and assign advisors to support family relationships
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div style={styles.statsRow}>
                <StatCard label="Pending Assignment" value={stats.pendingAssignment} />
                <StatCard label="In Progress" value={stats.inProgress} />
                <StatCard label="Completed Today" value={stats.completedToday} />
                <StatCard label="Available Advisors" value={stats.availableAdvisors} />
            </div>

            {/* Main Content: Sidebar + List */}
            <div style={styles.mainContent}>
                {/* Sidebar Filters */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarSection}>
                        <h4 style={styles.sidebarTitle}>Filter by Status</h4>
                        {[
                            { key: 'all', label: 'All Requests' },
                            { key: 'pending_assignment', label: 'Pending Assignment' },
                            { key: 'assigned', label: 'Assigned' },
                            { key: 'in_progress', label: 'In Progress' },
                            { key: 'completed', label: 'Completed' },
                            { key: 'dismissed', label: 'Dismissed' },
                        ].map(f => (
                            <button
                                key={f.key}
                                style={{
                                    ...styles.filterButton,
                                    ...(filter === f.key ? styles.filterButtonActive : {}),
                                }}
                                onClick={() => setFilter(f.key as any)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Request List */}
                <div style={styles.listContainer}>
                    <div style={styles.listHeader}>
                        <h3 style={styles.listTitle}>Consultation Requests</h3>
                        <span style={styles.totalCount}>
                            Total: {filteredConsultations.length}
                        </span>
                    </div>

                    {filteredConsultations.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📭</div>
                            <p style={styles.emptyText}>No consultation requests found</p>
                        </div>
                    ) : (
                        filteredConsultations.map(request => (
                            <div
                                key={request.id}
                                style={{
                                    ...styles.requestCard,
                                    ...(hoveredCard === request.id ? styles.requestCardHover : {}),
                                }}
                                onMouseEnter={() => setHoveredCard(request.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => onSelectRequest?.(request.id)}
                            >
                                <div style={styles.requestInfo}>
                                    <div style={styles.requestIdRow}>
                                        <span style={styles.requestId}>{request.id}</span>
                                        <span style={{
                                            ...styles.urgencyBadge,
                                            ...getUrgencyStyle(request.urgency),
                                        }}>
                                            {request.urgency} urgency
                                        </span>
                                    </div>
                                    <h4 style={styles.requesterName}>
                                        {request.requesterName} ({request.requesterType === 'youth' ? 'Youth' : 'Elderly'}, {request.requesterAge})
                                    </h4>
                                    <p style={styles.requestMeta}>
                                        Partner: {request.partnerName} • {request.preferredMethod} • {request.preferredDateTime}
                                    </p>
                                    <span style={styles.consultationType}>
                                        {request.consultationType}
                                    </span>
                                    <p style={styles.concernPreview}>
                                        {request.concernDescription.substring(0, 120)}...
                                    </p>
                                </div>
                                <div style={styles.requestActions}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        ...getStatusStyle(request.status),
                                    }}>
                                        {getStatusLabel(request.status)}
                                    </span>
                                    <span style={{
                                        ...styles.waitingTime,
                                        ...(isWaitingTimeAlert(request.submittedAt) ? styles.waitingTimeAlert : {}),
                                    }}>
                                        ⏱️ {getWaitingTime(request.submittedAt)}
                                        {isWaitingTimeAlert(request.submittedAt) && ' ⚠️'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationDashboard;
