import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { safetyViewModel } from '@home-sweet-home/viewmodel';

// Color constants matching existing design
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
    mercury: '#E5E5E5',
    alabaster: '#F8F8F8',
    hawkesBlue: '#E3F2FD',
    deepSeaGreen: '#0A4D42',
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '60px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
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
    headerCard: {
        background: colors.white,
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        marginBottom: '20px',
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    reportId: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.dustyGray,
        margin: 0,
    },
    headerTitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '35px',
        color: colors.mineShaft,
        margin: 0,
    },
    headerMeta: {
        display: 'flex',
        gap: '20px',
        marginTop: '4px',
    },
    metaItem: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
    },
    headerBadges: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
    },
    severityBadge: {
        padding: '8px 16px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 700,
        background: colors.apricot,
        color: colors.white,
    },
    statusBadge: {
        padding: '8px 20px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 700,
        background: colors.corvette,
        color: colors.cinnamon,
    },
    criticalAlert: {
        background: colors.mercury,
        borderRadius: '12px',
        padding: '16px',
        marginTop: '20px',
    },
    criticalAlertTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 700,
        color: colors.cinnamon,
        margin: '0 0 6px 0',
    },
    criticalAlertText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.cinnamon,
        margin: 0,
    },
    profilesRow: {
        display: 'flex',
        gap: '32px',
        marginBottom: '32px',
    },
    profileCard: {
        flex: 1,
        background: colors.white,
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    },
    cardTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '21px',
        color: colors.mineShaft,
        margin: '0 0 28px 0',
    },
    cardEmoji: {
        fontSize: '11px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: `1px solid ${colors.linen}`,
    },
    infoLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        color: colors.dustyGray,
        margin: 0,
    },
    infoValue: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: 0,
        textAlign: 'right' as const,
    },
    infoValueWarning: {
        color: colors.apricot,
    },
    infoValueActive: {
        color: colors.caper,
    },
    detailsCard: {
        background: colors.white,
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        marginBottom: '32px',
    },
    detailsGrid: {
        display: 'flex',
        gap: '28px',
        marginBottom: '20px',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.dustyGray,
        margin: '0 0 8px 0',
    },
    detailValue: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '17px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: 0,
    },
    subjectSection: {
        marginTop: '20px',
    },
    descriptionBox: {
        background: colors.linen,
        borderRadius: '16px',
        padding: '28px',
        marginTop: '20px',
    },
    descriptionText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        lineHeight: '29px',
        color: colors.mineShaft,
        margin: 0,
        whiteSpace: 'pre-wrap' as const,
    },
    evidenceSection: {
        marginTop: '20px',
    },
    evidenceGrid: {
        display: 'flex',
        gap: '16px',
    },
    evidenceItem: {
        flex: 1,
        background: colors.linen,
        border: `2px solid ${colors.morningGlory}`,
        borderRadius: '12px',
        padding: '18px',
        textAlign: 'center' as const,
    },
    evidenceIcon: {
        fontSize: '16px',
        marginBottom: '8px',
    },
    evidenceName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 700,
        color: colors.mineShaft,
        margin: '0 0 4px 0',
    },
    evidenceSize: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: colors.doveGray,
        margin: 0,
    },
    aiCard: {
        background: colors.white,
        border: `2px solid ${colors.morningGlory}`,
        borderRadius: '20px',
        padding: '38px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        marginBottom: '32px',
    },
    aiSeverity: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: colors.apricot,
        margin: '0 0 20px 0',
    },
    riskFactorsLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.dustyGray,
        margin: '0 0 12px 0',
    },
    riskFactorsList: {
        listStyle: 'disc',
        paddingLeft: '24px',
        margin: '0 0 20px 0',
    },
    riskFactor: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        lineHeight: '32px',
        color: colors.mineShaft,
    },
    recommendationBox: {
        background: colors.linen,
        borderRadius: '16px',
        padding: '28px',
    },
    recommendationLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.dustyGray,
        margin: '0 0 8px 0',
    },
    recommendationText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        lineHeight: '26px',
        color: colors.mineShaft,
        margin: 0,
    },
    actionsCard: {
        background: colors.alabaster,
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    },
    actionsInfo: {
        background: colors.hawkesBlue,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '28px',
    },
    actionsInfoText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.deepSeaGreen,
        margin: 0,
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    actionButton: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        borderRadius: '16px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '17px',
        fontWeight: 700,
    },
    warningButton: {
        background: colors.corvette,
        color: colors.cinnamon,
    },
    suspendButton: {
        background: colors.apricot,
        color: colors.white,
    },
    contactButton: {
        background: colors.morningGlory,
        color: colors.mineShaft,
    },
    dismissButton: {
        background: colors.white,
        border: `2px solid ${colors.mercury}`,
        color: colors.doveGray,
    },
    loadingState: {
        textAlign: 'center' as const,
        padding: '60px 40px',
    },
    errorState: {
        textAlign: 'center' as const,
        padding: '20px',
        background: '#fff5f5',
        borderRadius: '12px',
        color: colors.apricot,
        marginBottom: '20px',
    },
    processingOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    processingBox: {
        background: colors.white,
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center' as const,
    },
};

interface SafetyAlertDetailsProps {
    alertId?: string;
    onBack?: () => void;
}

export const SafetyAlertDetails: React.FC<SafetyAlertDetailsProps> = observer(({ alertId, onBack }) => {
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // Load alert details on mount
    useEffect(() => {
        if (alertId) {
            safetyViewModel.selectAlert(alertId);
        }
        return () => {
            safetyViewModel.backToList();
        };
    }, [alertId]);

    const handleAction = async (action: string) => {
        let success = false;

        switch (action) {
            case 'warning':
                success = await safetyViewModel.issueWarning('First warning - verbal caution', 'Warning issued for safety concern.');
                break;
            case 'suspend':
                success = await safetyViewModel.suspendUser('User suspended for safety violations detected in the report.', 'temporary');
                break;
            case 'contact':
                success = await safetyViewModel.contactUser('in_app', 'Initiating contact regarding safety concern.');
                break;
            case 'dismiss':
                success = await safetyViewModel.dismissReport('False positive - no violation detected');
                break;
        }

        if (success) {
            setActionSuccess(`Action "${action}" completed successfully`);
            setTimeout(() => setActionSuccess(null), 3000);
        }
    };

    const { selectedAlert: alert, isLoading, isProcessing, errorMessage } = safetyViewModel;

    if (isLoading) {
        return (
            <div style={styles.container}>
                <button style={styles.backButton} onClick={onBack}>
                    ← Back to Safety Alerts
                </button>
                <div style={styles.loadingState}>Loading alert details...</div>
            </div>
        );
    }

    if (!alert) {
        return (
            <div style={styles.container}>
                <button style={styles.backButton} onClick={onBack}>
                    ← Back to Safety Alerts
                </button>
                <div style={styles.errorState}>Alert not found</div>
            </div>
        );
    }

    const riskFactors = safetyViewModel.getRiskFactors(alert);
    const recommendation = safetyViewModel.getRecommendation(alert);

    return (
        <div style={styles.container}>
            {/* Processing Overlay */}
            {isProcessing && (
                <div style={styles.processingOverlay}>
                    <div style={styles.processingBox}>
                        Processing action...
                    </div>
                </div>
            )}

            {/* Back Button */}
            <button style={styles.backButton} onClick={onBack}>
                ← Back to Safety Alerts
            </button>

            {/* Error/Success Messages */}
            {errorMessage && (
                <div style={styles.errorState}>{errorMessage}</div>
            )}
            {actionSuccess && (
                <div style={{ ...styles.actionsInfo, marginBottom: '20px' }}>
                    <p style={styles.actionsInfoText}>✓ {actionSuccess}</p>
                </div>
            )}

            {/* Header Card */}
            <div style={styles.headerCard}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <p style={styles.reportId}>Report ID: {alert.id}</p>
                        <h1 style={styles.headerTitle}>{alert.subject}</h1>
                        <div style={styles.headerMeta}>
                            <span style={styles.metaItem}>📅 Submitted: {new Date(alert.detected_at).toLocaleString()}</span>
                            <span style={styles.metaItem}>⏱️ Response Time Remaining: {safetyViewModel.getResponseTimeRemaining(alert)}</span>
                            {alert.detected_keywords.length > 0 && (
                                <span style={styles.metaItem}>🔍 Keyword: "{alert.detected_keywords.join('", "')}"</span>
                            )}
                        </div>
                    </div>
                    <div style={styles.headerBadges}>
                        <span style={styles.severityBadge}>{alert.severity.toUpperCase()}</span>
                        <span style={styles.statusBadge}>{safetyViewModel.getStatusLabel(alert.status)}</span>
                    </div>
                </div>

                {alert.severity === 'critical' && (
                    <div style={styles.criticalAlert}>
                        <p style={styles.criticalAlertTitle}>⚠️ Critical Alert</p>
                        <p style={styles.criticalAlertText}>
                            This report contains patterns associated with {alert.incident_type.replace('_', ' ')}. Immediate review and action required.
                        </p>
                    </div>
                )}
            </div>

            {/* Profile Cards */}
            <div style={styles.profilesRow}>
                {/* Reporter Profile */}
                <div style={styles.profileCard}>
                    <h3 style={styles.cardTitle}>
                        <span style={styles.cardEmoji}>👵</span> Reporter Profile ({alert.reporter.user_type === 'elderly' ? 'Elderly' : 'Youth'})
                    </h3>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Full Name</p>
                        <p style={styles.infoValue}>{alert.reporter.full_name}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>User ID</p>
                        <p style={styles.infoValue}>{alert.reporter.id}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Age</p>
                        <p style={styles.infoValue}>{alert.reporter.age} years old</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Location</p>
                        <p style={styles.infoValue}>{alert.reporter.location || 'N/A'}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Account Created</p>
                        <p style={styles.infoValue}>{alert.reporter.account_created ? new Date(alert.reporter.account_created).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                        <p style={styles.infoLabel}>Previous Reports</p>
                        <p style={styles.infoValue}>{alert.reporter.previous_reports} reports</p>
                    </div>
                </div>

                {/* Reported User Profile */}
                <div style={styles.profileCard}>
                    <h3 style={styles.cardTitle}>
                        <span style={styles.cardEmoji}>👨</span> Reported User Profile ({alert.reported_user.user_type === 'youth' ? 'Youth' : 'Elderly'})
                    </h3>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Full Name</p>
                        <p style={styles.infoValue}>{alert.reported_user.full_name}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>User ID</p>
                        <p style={styles.infoValue}>{alert.reported_user.id}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Age</p>
                        <p style={styles.infoValue}>{alert.reported_user.age} years old</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Occupation</p>
                        <p style={styles.infoValue}>{alert.reported_user.occupation || 'N/A'}</p>
                    </div>
                    <div style={styles.infoRow}>
                        <p style={styles.infoLabel}>Account Status</p>
                        <p style={{ ...styles.infoValue, ...(alert.reported_user.account_status === 'active' ? styles.infoValueActive : styles.infoValueWarning) }}>
                            {alert.reported_user.account_status.charAt(0).toUpperCase() + alert.reported_user.account_status.slice(1)}
                        </p>
                    </div>
                    <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                        <p style={styles.infoLabel}>Previous Warnings</p>
                        <p style={{ ...styles.infoValue, ...styles.infoValueWarning }}>
                            {alert.reported_user.previous_warnings} warning{alert.reported_user.previous_warnings !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Details */}
            <div style={styles.detailsCard}>
                <h3 style={styles.cardTitle}>
                    <span style={styles.cardEmoji}>📋</span> Report Details
                </h3>
                <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                        <p style={styles.detailLabel}>Report Type</p>
                        <p style={styles.detailValue}>{alert.incident_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                    </div>
                    <div style={styles.detailItem}>
                        <p style={styles.detailLabel}>Relationship Stage</p>
                        <p style={styles.detailValue}>{alert.relationship_stage}</p>
                    </div>
                    <div style={styles.detailItem}>
                        <p style={styles.detailLabel}>Relationship Duration</p>
                        <p style={styles.detailValue}>{alert.relationship_duration}</p>
                    </div>
                </div>

                <div style={styles.subjectSection}>
                    <p style={styles.detailLabel}>Subject</p>
                    <p style={styles.detailValue}>{alert.subject}</p>
                </div>

                <div style={styles.subjectSection}>
                    <p style={styles.detailLabel}>Detailed Description</p>
                    <div style={styles.descriptionBox}>
                        <p style={styles.descriptionText}>{alert.description}</p>
                    </div>
                </div>
            </div>

            {/* Evidence Attached */}
            {alert.evidence.length > 0 && (
                <div style={styles.detailsCard}>
                    <h3 style={styles.cardTitle}>
                        <span style={styles.cardEmoji}>📎</span> Evidence Attached
                    </h3>
                    <div style={styles.evidenceGrid}>
                        {alert.evidence.map((item: { name: string; type: string; size: string }, index: number) => (
                            <div key={index} style={styles.evidenceItem}>
                                <div style={styles.evidenceIcon}>
                                    {item.type === 'image' ? '💬' : '📝'}
                                </div>
                                <p style={styles.evidenceName}>{item.name}</p>
                                <p style={styles.evidenceSize}>{item.size}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Severity Analysis */}
            <div style={styles.aiCard}>
                <h3 style={styles.cardTitle}>
                    <span style={styles.cardEmoji}>🤖</span> AI Severity Analysis
                </h3>

                <div>
                    <p style={styles.detailLabel}>Severity Assessment</p>
                    <p style={styles.aiSeverity}>{alert.severity.toUpperCase()} - Requires {alert.severity === 'critical' ? 'immediate' : 'timely'} attention</p>
                </div>

                <div>
                    <p style={styles.riskFactorsLabel}>Risk Factors Identified</p>
                    <ul style={styles.riskFactorsList}>
                        {riskFactors.map((factor: string, index: number) => (
                            <li key={index} style={styles.riskFactor}>{factor}</li>
                        ))}
                    </ul>
                </div>

                <div style={styles.recommendationBox}>
                    <p style={styles.recommendationLabel}>Recommended Action</p>
                    <p style={styles.recommendationText}>{recommendation}</p>
                </div>
            </div>

            {/* Take Action */}
            <div style={styles.actionsCard}>
                <h3 style={styles.cardTitle}>
                    <span style={styles.cardEmoji}>⚡</span> Take Action
                </h3>

                <div style={styles.actionsInfo}>
                    <p style={styles.actionsInfoText}>
                        ℹ️ Select the appropriate action based on your review. All actions will be logged and notifications sent to relevant parties.
                    </p>
                </div>

                <div style={styles.actionsGrid}>
                    <button
                        style={{ ...styles.actionButton, ...styles.warningButton }}
                        onClick={() => handleAction('warning')}
                        disabled={isProcessing}
                    >
                        ⚠️ Issue Warning
                    </button>
                    <button
                        style={{ ...styles.actionButton, ...styles.suspendButton }}
                        onClick={() => handleAction('suspend')}
                        disabled={isProcessing}
                    >
                        🚫 Suspend User
                    </button>
                    <button
                        style={{ ...styles.actionButton, ...styles.contactButton }}
                        onClick={() => handleAction('contact')}
                        disabled={isProcessing}
                    >
                        📞 Contact User
                    </button>
                    <button
                        style={{ ...styles.actionButton, ...styles.dismissButton }}
                        onClick={() => handleAction('dismiss')}
                        disabled={isProcessing}
                    >
                        ✓ Dismiss Report
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SafetyAlertDetails;
