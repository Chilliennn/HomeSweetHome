import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { consultationViewModel, safetyViewModel } from '@home-sweet-home/viewmodel';
import { AdminLayout } from '../components/ui';
import { ConsultationDashboard } from './ConsultationDashboard';
import { ConsultationDetails } from './ConsultationDetails';
import { SafetyAlertsDashboard, SafetyAlertDetails } from '../SafetyUI';

// Color constants from UC501UI.txt
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
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '40px 60px',
        gap: '40px',
        width: '100%',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box' as const,
    },
    header: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-start',
        gap: '12px',
        width: '100%',
        maxWidth: '1400px',
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '35px',
        lineHeight: '42px',
        color: colors.mineShaft,
        margin: 0,
    },
    subtitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '17px',
        lineHeight: '20px',
        color: colors.doveGray,
        margin: 0,
    },
    cardsContainer: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        width: '100%',
        maxWidth: '1400px',
        flexWrap: 'wrap' as const,
    },
    card: {
        position: 'relative' as const,
        width: '100%',
        maxWidth: '600px',
        minHeight: '500px',
        background: colors.white,
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        padding: '51px',
        boxSizing: 'border-box' as const,
    },
    cardGreen: {
        border: `3px solid ${colors.morningGlory}`,
    },
    cardApricot: {
        border: `3px solid ${colors.apricot}`,
    },
    iconCircle: {
        width: '100px',
        height: '100px',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
    },
    iconCircleGreen: {
        background: colors.morningGlory,
    },
    iconCircleApricot: {
        background: colors.apricot,
    },
    iconEmoji: {
        fontSize: '50px',
    },
    cardTitle: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '31px',
        lineHeight: '38px',
        color: colors.mineShaft,
        margin: '0 0 12px 0',
    },
    cardTitleRow: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    urgentBadge: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        background: colors.apricot,
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '12px',
        color: colors.white,
    },
    cardDescription: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '17px',
        lineHeight: '29px',
        color: colors.doveGray,
        margin: '0 0 32px 0',
    },
    statsRow: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '32px',
    },
    statBox: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '16px',
        gap: '4px',
        width: '150px',
        background: colors.linen,
        borderRadius: '12px',
    },
    statValue: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '32px',
        lineHeight: '38px',
        textAlign: 'center' as const,
        margin: 0,
    },
    statLabel: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '13px',
        lineHeight: '16px',
        textAlign: 'center' as const,
        color: colors.doveGray,
        margin: 0,
    },
    actionButton: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '18px',
        width: '100%',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '17px',
        lineHeight: '21px',
        transition: 'all 0.2s ease',
    },
    actionButtonGreen: {
        background: colors.morningGlory,
        color: colors.mineShaft,
    },
    actionButtonApricot: {
        background: colors.apricot,
        color: colors.white,
    },
};

// Data should come from database - currently showing 0 since no data exists
const consultationData = {
    pending: 0,
    inProgress: 0,
    completed: 0,
};

const safetyAlertsData = {
    critical: 0,
    highPriority: 0,
    medium: 0,
    urgentCount: 0,
};

const ReportPage: React.FC = observer(() => {
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'main' | 'consultations' | 'consultation-details' | 'safety-alerts' | 'safety-alert-details'>('main');
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

    // Load stats on mount
    useEffect(() => {
        consultationViewModel.loadStats();
        safetyViewModel.loadStats();
    }, []);

    // Get stats from ViewModels with fallback to 0
    const consultationStats = consultationViewModel.stats;
    const safetyStats = safetyViewModel.stats;

    // Handle tab change - resets view back to main when clicking Reports tab
    const handleTabChange = (tab: string) => {
        if (tab === 'reports') {
            setCurrentView('main');
            setSelectedRequestId(null);
            setSelectedAlertId(null);
        }
    };

    // Handle navigation to consultation dashboard
    const handleViewConsultations = () => {
        setCurrentView('consultations');
    };

    // Handle navigation to consultation details
    const handleSelectRequest = (requestId: string) => {
        setSelectedRequestId(requestId);
        setCurrentView('consultation-details');
    };

    // Handle back navigation
    const handleBackToReports = () => {
        setCurrentView('main');
        setSelectedRequestId(null);
    };

    const handleBackToConsultations = () => {
        setCurrentView('consultations');
        setSelectedRequestId(null);
    };

    // Handle navigation to safety alerts dashboard
    const handleViewSafetyAlerts = () => {
        setCurrentView('safety-alerts');
    };

    // Handle navigation to safety alert details
    const handleSelectAlert = (alertId: string) => {
        setSelectedAlertId(alertId);
        setCurrentView('safety-alert-details');
    };

    // Handle back to safety alerts from details
    const handleBackToSafetyAlerts = () => {
        setCurrentView('safety-alerts');
        setSelectedAlertId(null);
    };

    // Render Consultation Dashboard
    if (currentView === 'consultations') {
        return (
            <AdminLayout onTabChange={handleTabChange}>
                <ConsultationDashboard
                    onBack={handleBackToReports}
                    onSelectRequest={handleSelectRequest}
                />
            </AdminLayout>
        );
    }

    // Render Consultation Details
    if (currentView === 'consultation-details' && selectedRequestId) {
        return (
            <AdminLayout onTabChange={handleTabChange}>
                <ConsultationDetails
                    requestId={selectedRequestId}
                    onBack={handleBackToConsultations}
                />
            </AdminLayout>
        );
    }

    // Render Safety Alerts Dashboard
    if (currentView === 'safety-alerts') {
        return (
            <AdminLayout onTabChange={handleTabChange}>
                <SafetyAlertsDashboard
                    onBack={handleBackToReports}
                    onSelectAlert={handleSelectAlert}
                />
            </AdminLayout>
        );
    }

    // Render Safety Alert Details
    if (currentView === 'safety-alert-details' && selectedAlertId) {
        return (
            <AdminLayout onTabChange={handleTabChange}>
                <SafetyAlertDetails
                    alertId={selectedAlertId}
                    onBack={handleBackToSafetyAlerts}
                />
            </AdminLayout>
        );
    }

    // Main Reports Dashboard

    return (
        <AdminLayout onTabChange={handleTabChange}>
            <div style={styles.container}>
                {/* Page Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Reports Dashboard</h1>
                    <p style={styles.subtitle}>
                        View and manage family advisor consultations and safety alerts across all relationships
                    </p>
                </div>

                {/* Cards Container */}
                <div style={styles.cardsContainer}>
                    {/* Family Advisor Consultation Card */}
                    <div style={{ ...styles.card, ...styles.cardGreen }}>
                        {/* Icon */}
                        <div style={{ ...styles.iconCircle, ...styles.iconCircleGreen }}>
                            <span style={styles.iconEmoji}>👨‍👩‍👧</span>
                        </div>

                        {/* Title */}
                        <h2 style={styles.cardTitle}>Family Advisor Consultation</h2>

                        {/* Description */}
                        <p style={styles.cardDescription}>
                            Track the status of all family advisor consultations between youth and elderly participants in the system.
                        </p>

                        {/* Stats Row */}
                        <div style={styles.statsRow}>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.corvette }}>
                                    {consultationData.pending}
                                </p>
                                <p style={styles.statLabel}>Pending</p>
                            </div>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.morningGlory }}>
                                    {consultationData.inProgress}
                                </p>
                                <p style={styles.statLabel}>In Progress</p>
                            </div>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.caper }}>
                                    {consultationData.completed}
                                </p>
                                <p style={styles.statLabel}>Completed</p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            style={{
                                ...styles.actionButton,
                                ...styles.actionButtonGreen,
                                transform: hoveredButton === 'consultation' ? 'translateY(-2px)' : 'none',
                                boxShadow: hoveredButton === 'consultation'
                                    ? '0 4px 12px rgba(157, 226, 208, 0.4)'
                                    : 'none',
                            }}
                            onMouseEnter={() => setHoveredButton('consultation')}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={handleViewConsultations}
                        >
                            View All Consultations
                        </button>
                    </div>

                    {/* Safety Alerts Card */}
                    <div style={{ ...styles.card, ...styles.cardApricot }}>
                        {/* Icon */}
                        <div style={{ ...styles.iconCircle, ...styles.iconCircleApricot }}>
                            <span style={styles.iconEmoji}>⚠️</span>
                        </div>

                        {/* Title with Badge */}
                        <div style={styles.cardTitleRow}>
                            <h2 style={{ ...styles.cardTitle, margin: 0 }}>Safety Alerts</h2>
                            <span style={styles.urgentBadge}>{safetyAlertsData.urgentCount} Urgent</span>
                        </div>

                        {/* Description */}
                        <p style={styles.cardDescription}>
                            Monitor and respond to safety concerns reported across all active relationships.
                        </p>

                        {/* Stats Row */}
                        <div style={styles.statsRow}>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.apricot }}>
                                    {safetyAlertsData.critical}
                                </p>
                                <p style={styles.statLabel}>Critical</p>
                            </div>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.corvette }}>
                                    {safetyAlertsData.highPriority}
                                </p>
                                <p style={styles.statLabel}>High Priority</p>
                            </div>
                            <div style={styles.statBox}>
                                <p style={{ ...styles.statValue, color: colors.prelude }}>
                                    {safetyAlertsData.medium}
                                </p>
                                <p style={styles.statLabel}>Medium</p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            style={{
                                ...styles.actionButton,
                                ...styles.actionButtonApricot,
                                transform: hoveredButton === 'safety' ? 'translateY(-2px)' : 'none',
                                boxShadow: hoveredButton === 'safety'
                                    ? '0 4px 12px rgba(235, 143, 128, 0.4)'
                                    : 'none',
                            }}
                            onMouseEnter={() => setHoveredButton('safety')}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={handleViewSafetyAlerts}
                        >
                            View All Alerts
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
});

export default ReportPage;
