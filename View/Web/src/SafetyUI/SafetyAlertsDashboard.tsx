import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { safetyViewModel } from '@home-sweet-home/viewmodel';

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
    dustyGray: '#999999',
    cinnamon: '#7A4F00',
    bossanova: '#4A2D5A',
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '60px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
    },
    header: {
        marginBottom: '40px',
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '34px',
        lineHeight: '41px',
        color: colors.mineShaft,
        margin: '0 0 12px 0',
    },
    subtitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '17px',
        lineHeight: '20px',
        color: colors.doveGray,
        margin: 0,
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
        marginBottom: '30px',
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        marginBottom: '40px',
    },
    statCard: {
        padding: '20px 24px',
        backgroundColor: colors.white,
        borderRadius: '12px',
        borderLeft: '4px solid',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    },
    statLabel: {
        fontSize: '12px',
        color: colors.dustyGray,
        textTransform: 'uppercase' as const,
        fontWeight: 600,
        marginBottom: '8px',
        letterSpacing: '0.5px',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
    },
    alertsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    alertCard: {
        display: 'flex',
        alignItems: 'center',
        padding: '28px 32px',
        background: colors.white,
        borderRadius: '20px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        gap: '28px',
    },
    alertIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        flexShrink: 0,
    },
    iconCritical: {
        background: colors.apricot,
    },
    iconHigh: {
        background: colors.corvette,
    },
    iconMedium: {
        background: colors.prelude,
    },
    iconLow: {
        background: colors.caper,
    },
    alertContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    alertHeader: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    reportId: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 400,
        color: colors.dustyGray,
        margin: 0,
    },
    reporterName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '22px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: 0,
    },
    submittedDate: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 400,
        color: colors.doveGray,
        margin: 0,
    },
    alertMeta: {
        display: 'flex',
        gap: '20px',
    },
    metaItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    metaLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 400,
        color: colors.dustyGray,
        margin: 0,
    },
    metaValue: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: 0,
    },
    waitingTimeCritical: {
        color: colors.apricot,
    },
    waitingTimeHigh: {
        color: colors.corvette,
    },
    waitingTimeMedium: {
        color: colors.morningGlory,
    },
    alertActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
    },
    severityBadge: {
        padding: '8px 16px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
    },
    badgeCritical: {
        background: colors.apricot,
        color: colors.white,
    },
    badgeHigh: {
        background: colors.corvette,
        color: colors.cinnamon,
    },
    badgeMedium: {
        background: colors.prelude,
        color: colors.bossanova,
    },
    badgeLow: {
        background: colors.caper,
        color: colors.mineShaft,
    },
    viewButton: {
        padding: '12px 28px',
        background: colors.morningGlory,
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14.5px',
        fontWeight: 700,
        color: colors.mineShaft,
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 40px',
        background: colors.white,
        borderRadius: '20px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    emptyTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: '0 0 8px 0',
    },
    emptyText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        color: colors.doveGray,
        margin: 0,
    },
    loadingState: {
        textAlign: 'center',
        padding: '60px 40px',
    },
    errorState: {
        textAlign: 'center',
        padding: '20px',
        background: '#fff5f5',
        borderRadius: '12px',
        color: colors.apricot,
        marginBottom: '20px',
    },
};

interface SafetyAlertsDashboardProps {
    onBack?: () => void;
    onSelectAlert?: (alertId: string) => void;
}

export const SafetyAlertsDashboard: React.FC<SafetyAlertsDashboardProps> = observer(({
    onBack,
    onSelectAlert
}) => {
    // Load data on mount
    useEffect(() => {
        safetyViewModel.loadAlerts();
        safetyViewModel.loadStats();
    }, []);

    const getSeverityBadgeStyle = (severity: string) => {
        switch (severity) {
            case 'critical': return { ...styles.severityBadge, ...styles.badgeCritical };
            case 'high': return { ...styles.severityBadge, ...styles.badgeHigh };
            case 'medium': return { ...styles.severityBadge, ...styles.badgeMedium };
            case 'low': return { ...styles.severityBadge, ...styles.badgeLow };
            default: return styles.severityBadge;
        }
    };

    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'critical': return '🔴 Critical';
            case 'high': return '🟡 High Priority';
            case 'medium': return '🟣 Medium';
            case 'low': return '🟢 Low';
            default: return severity;
        }
    };

    const getIconStyle = (severity: string) => {
        switch (severity) {
            case 'critical': return { ...styles.alertIcon, ...styles.iconCritical };
            case 'high': return { ...styles.alertIcon, ...styles.iconHigh };
            case 'medium': return { ...styles.alertIcon, ...styles.iconMedium };
            case 'low': return { ...styles.alertIcon, ...styles.iconLow };
            default: return styles.alertIcon;
        }
    };

    const getWaitingTimeStyle = (severity: string) => {
        switch (severity) {
            case 'critical': return { ...styles.metaValue, ...styles.waitingTimeCritical };
            case 'high': return { ...styles.metaValue, ...styles.waitingTimeHigh };
            case 'medium': return { ...styles.metaValue, ...styles.waitingTimeMedium };
            default: return styles.metaValue;
        }
    };

    const formatSubmittedDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `Submitted: ${formattedDate} (${diffDays} days ago)`;
    };

    const handleSelectAlert = (alertId: string) => {
        if (onSelectAlert) {
            onSelectAlert(alertId);
        }
    };

    const { alerts, stats, isLoading, errorMessage } = safetyViewModel;

    return (
        <div style={styles.container}>
            {/* Back Button */}
            {onBack && (
                <button style={styles.backButton} onClick={onBack}>
                    ← Back to Reports
                </button>
            )}

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Safety Alerts</h1>
                <p style={styles.subtitle}>Review and handle safety concern reports from users</p>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div style={styles.errorState}>
                    {errorMessage}
                </div>
            )}

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={{
                    ...styles.statCard,
                    borderLeft: `4px solid ${colors.apricot}`,
                }}>
                    <div style={styles.statLabel}>Critical Alerts</div>
                    <div style={{ ...styles.statValue, color: colors.apricot }}>
                        {stats?.critical ?? 0}
                    </div>
                </div>
                <div style={{
                    ...styles.statCard,
                    borderLeft: `4px solid ${colors.corvette}`,
                }}>
                    <div style={styles.statLabel}>High Priority</div>
                    <div style={{ ...styles.statValue, color: colors.corvette }}>
                        {stats?.high ?? 0}
                    </div>
                </div>
                <div style={{
                    ...styles.statCard,
                    borderLeft: `4px solid ${colors.morningGlory}`,
                }}>
                    <div style={styles.statLabel}>Pending Review</div>
                    <div style={{ ...styles.statValue, color: colors.morningGlory }}>
                        {stats?.pending ?? 0}
                    </div>
                </div>
                <div style={{
                    ...styles.statCard,
                    borderLeft: `4px solid ${colors.caper}`,
                }}>
                    <div style={styles.statLabel}>Avg Response Time</div>
                    <div style={{ ...styles.statValue, color: colors.caper }}>
                        {stats?.avgResponseTimeMinutes ?? 0}m
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div style={styles.loadingState}>
                    Loading safety alerts...
                </div>
            )}

            {/* Alerts List */}
            {!isLoading && (
                <div style={styles.alertsList}>
                    {alerts.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>✅</div>
                            <h3 style={styles.emptyTitle}>No Safety Alerts</h3>
                            <p style={styles.emptyText}>All safety concerns have been addressed. Great job!</p>
                        </div>
                    ) : (
                        alerts.map((alert: any) => (
                            <div key={alert.id} style={styles.alertCard}>
                                {/* Icon */}
                                <div style={getIconStyle(alert.severity)}>
                                    ⚠️
                                </div>

                                {/* Content */}
                                <div style={styles.alertContent}>
                                    <div style={styles.alertHeader}>
                                        <p style={styles.reportId}>Report ID: {alert.id}</p>
                                        <h3 style={styles.reporterName}>{alert.reporter.full_name}</h3>
                                        <p style={styles.submittedDate}>{formatSubmittedDate(alert.detected_at)}</p>
                                    </div>

                                    <div style={styles.alertMeta}>
                                        <div style={styles.metaItem}>
                                            <p style={styles.metaLabel}>Reporter Age</p>
                                            <p style={styles.metaValue}>{alert.reporter.age} years old</p>
                                        </div>
                                        <div style={styles.metaItem}>
                                            <p style={styles.metaLabel}>Waiting Time</p>
                                            <p style={getWaitingTimeStyle(alert.severity)}>
                                                ⏱️ {safetyViewModel.getWaitingTime(alert)} {safetyViewModel.isUrgent(alert) && '(URGENT)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={styles.alertActions}>
                                    <span style={getSeverityBadgeStyle(alert.severity)}>
                                        {getSeverityLabel(alert.severity)}
                                    </span>
                                    <button
                                        style={styles.viewButton}
                                        onClick={() => handleSelectAlert(alert.id)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

export default SafetyAlertsDashboard;
