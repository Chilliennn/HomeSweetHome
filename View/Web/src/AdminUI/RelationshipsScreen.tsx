// components/AdminUI/RelationshipsScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { observer } from 'mobx-react-lite';
import { AdminSentimentAnalysisViewModel } from '@home-sweet-home/viewmodel';
import { relationshipRepository } from '@home-sweet-home/model';

import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Sample relationship data (hardcoded for now)
interface Relationship {
    id: string;
    youthName: string;
    elderlyName: string;
    youthId: string;
    elderlyId: string;
    lastContact: string;
    currentStage: string;
    stageDuration: string;
    status: 'critical' | 'caution' | 'healthy';
    warnings: string[];
}

type ViewType = 'list' | 'detail' | 'sentiment' | 'frequency' | 'risk' | 'recommendations';

export const RelationshipsScreen: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'caution' | 'critical'>('all');
    const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch real relationships from database
    useEffect(() => {
        const fetchRelationships = async () => {
            try {
                const data = await relationshipRepository.getAllRelationships();

                // Transform DB data to UI format
                const transformed: Relationship[] = data.map(rel => ({
                    id: rel.id,
                    youthName: rel.youth?.full_name || 'Unknown Youth',
                    elderlyName: rel.elderly?.full_name || 'Unknown Elderly',
                    youthId: rel.youth_id,
                    elderlyId: rel.elderly_id,
                    lastContact: calculateLastContact(rel.last_message_at), // Calculate real time
                    currentStage: formatStageName(rel.current_stage),
                    stageDuration: calculateDuration(rel.stage_start_date),
                    status: rel.risk_level || determineStatus(rel), // Use stored risk_level, fallback to calculated
                    warnings: [] // TODO: Generate based on metrics
                }));

                setRelationships(transformed);
            } catch (error) {
                console.error('[RelationshipsScreen] Error fetching relationships:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRelationships();
    }, []);

    // Helper functions
    const formatStageName = (stage: string): string => {
        const stageMap: Record<string, string> = {
            'getting_to_know': 'Stage 1: Getting to Know',
            'trial_period': 'Stage 2: Trial Period',
            'official_ceremony': 'Stage 3: Official Ceremony',
            'family_life': 'Stage 4: Family Life'
        };
        return stageMap[stage] || stage;
    };

    const calculateLastContact = (lastMessageAt: string | null | undefined): string => {
        if (!lastMessageAt) return 'Never';

        const now = new Date();
        const lastContact = new Date(lastMessageAt);
        const diffMs = now.getTime() - lastContact.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffDays === 0) {
            if (diffHours === 0) return 'Just now';
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return `${diffDays} days ago`;
        }
    };

    const calculateDuration = (startDate: string): string => {
        const start = new Date(startDate);
        const now = new Date();
        const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} days`;
    };

    const determineStatus = (rel: any): 'healthy' | 'caution' | 'critical' => {
        // Base status on actual activity from stage_metrics
        if (rel.status !== 'active') return 'critical';

        const metrics = rel.stage_metrics;
        if (!metrics) return 'caution';

        // Check recent activity (message count and active days)
        const hasRecentActivity = (metrics.message_count || 0) > 10 || (metrics.active_days || 0) > 3;
        const hasGoodProgress = (metrics.progress_percentage || 0) > 50;

        if (hasRecentActivity && hasGoodProgress) return 'healthy';
        if (hasRecentActivity || hasGoodProgress) return 'caution';
        return 'critical';
    };

    // Filter relationships based on selected filter
    const filteredRelationships = relationships.filter(rel => {
        if (activeFilter === 'all') return true;
        return rel.status === activeFilter;
    });

    const filters = [
        { key: 'all', label: 'All Families' },
        { key: 'healthy', label: 'Healthy' },
        { key: 'caution', label: 'Caution' },
        { key: 'critical', label: 'Critical' }
    ];


    const handleCardClick = (relationship: Relationship) => {
        setSelectedRelationship(relationship);
        setCurrentView('detail');
    };


    const refreshRelationships = async () => {
        try {
            const data = await relationshipRepository.getAllRelationships();
            const transformed: Relationship[] = data.map(rel => ({
                id: rel.id,
                youthName: rel.youth?.full_name || 'Unknown Youth',
                elderlyName: rel.elderly?.full_name || 'Unknown Elderly',
                youthId: rel.youth_id,
                elderlyId: rel.elderly_id,
                lastContact: calculateLastContact(rel.last_message_at),
                currentStage: formatStageName(rel.current_stage),
                stageDuration: calculateDuration(rel.stage_start_date),
                status: rel.risk_level || determineStatus(rel),
                warnings: []
            }));
            setRelationships(transformed);
        } catch (error) {
            console.error('[RelationshipsScreen] Error refreshing relationships:', error);
        }
    };

    const handleBackToDashboard = async () => {
        setSelectedRelationship(null);
        setCurrentView('list');
        // Refresh data to show updated risk levels
        await refreshRelationships();
    };

    const handleBackToDetail = () => {
        setCurrentView('detail');
    };

    // Styles matching ApplicationQueue
    const styles = {
        dashboard: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
        },
        container: {
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: '1.5rem',
        },
        sidebar: {
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            height: 'fit-content',
        },
        sectionTitle: {
            margin: '0 0 1rem 0',
            fontSize: '0.9rem',
            textTransform: 'uppercase' as const,
            color: '#666',
            fontWeight: 600,
        },
        filterBtn: {
            padding: '0.75rem 1rem',
            border: '2px solid #e0e0e0',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#666',
            transition: 'all 0.3s ease',
            textAlign: 'left' as const,
            width: '100%',
            marginBottom: '0.5rem',
        },
        filterBtnActive: {
            border: '2px solid #9DE2D0',
            backgroundColor: '#9DE2D0',
            color: '#ffffff',
        },
        mainContent: {
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        statCard: {
            padding: '1rem',
            marginBottom: '0.5rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            borderLeft: '4px solid #9DE2D0',
        },
        statLabel: {
            fontSize: '0.85rem',
            color: '#999',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            marginBottom: '0.3rem',
        },
        statValue: {
            fontSize: '1.8rem',
            fontWeight: 'bold' as const,
            color: '#333',
        },
    };

    const renderMainContent = () => {
        if (!selectedRelationship) {
            return (
                <>
                    {/* Relationship Cards */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredRelationships.map((relationship) => (
                            <RelationshipCard
                                key={relationship.id}
                                relationship={relationship}
                                onClick={() => handleCardClick(relationship)}
                            />
                        ))}
                    </section>
                    <div style={{ height: '40px' }}></div>
                </>
            );
        }

        switch (currentView) {
            case 'sentiment':
                return <SentimentAnalysisView relationship={selectedRelationship} onBack={handleBackToDetail} />;
            case 'frequency':
                return <CommunicationFrequencyView relationship={selectedRelationship} onBack={handleBackToDetail} />;
            case 'risk':
                return <UpdateRiskLevelView relationship={selectedRelationship} onBack={handleBackToDetail} />;
            case 'recommendations':
                return <RecommendationsView relationship={selectedRelationship} onBack={handleBackToDetail} />;
            case 'detail':
            default:
                return (
                    <RelationshipDetailView
                        relationship={selectedRelationship}
                        onBack={handleBackToDashboard}
                        onViewSentiment={() => setCurrentView('sentiment')}
                        onViewFrequency={() => setCurrentView('frequency')}
                        onUpdateRisk={() => setCurrentView('risk')}
                        onViewRecommendations={() => setCurrentView('recommendations')}
                    />
                );
        }
    };

    return (
        <div style={{ width: '100%', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            {/* Page Title */}
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333', margin: '0 0 0.5rem 0' }}>
                Monitor Relationship Health
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem 0' }}>
                Track and manage family relationships
            </p>

            {/* Dashboard Stats - Top Row (matching Application page) */}
            <div style={styles.dashboard}>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total Active Families</div>
                    <div style={styles.statValue}>{relationships.length}</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Healthy Relationships</div>
                    <div style={styles.statValue}>{relationships.filter(r => r.status === 'healthy').length}</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #EB8F80' }}>
                    <div style={styles.statLabel}>Needs Attention</div>
                    <div style={{ ...styles.statValue, color: '#EB8F80' }}>{relationships.filter(r => r.status === 'critical').length}</div>
                </div>
            </div>

            {/* Main Container: Sidebar + Content (matching Application page) */}
            <div style={styles.container}>
                {/* Sidebar - Filter */}
                <div style={styles.sidebar}>
                    <h4 style={styles.sectionTitle}>Filter By</h4>
                    <div>
                        {filters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => {
                                    setActiveFilter(filter.key as 'all' | 'healthy' | 'caution' | 'critical');
                                    setSelectedRelationship(null);
                                    setCurrentView('list');
                                }}
                                style={{
                                    ...styles.filterBtn,
                                    ...(activeFilter === filter.key ? styles.filterBtnActive : {}),
                                }}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={styles.mainContent}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                            <p style={{ fontSize: '16px', color: '#666' }}>Loading relationships...</p>
                        </div>
                    ) : relationships.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                            <p style={{ fontSize: '16px', color: '#666' }}>No relationships found</p>
                        </div>
                    ) : (
                        renderMainContent()
                    )}
                </div>
            </div>
        </div>
    );
};


// ========== BACK BUTTON COMPONENT ==========
const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#9DE2D0', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', marginBottom: '20px'
        }}
    >←</button>
);

// ========== SENTIMENT ANALYSIS VIEW ==========
interface SentimentAnalysisViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const SentimentAnalysisView: React.FC<SentimentAnalysisViewProps> = observer(({ relationship, onBack }) => {
    const [vm] = React.useState(() => new AdminSentimentAnalysisViewModel());
    const loadedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        // Only load if not already loaded for this relationship
        if (loadedRef.current !== relationship.id) {
            loadedRef.current = relationship.id;
            vm.loadAnalytics(relationship.id, relationship.youthId, relationship.elderlyId);
        }
    }, [relationship.id, relationship.youthId, relationship.elderlyId, vm]);

    if (vm.isLoading) {
        return (
            <div>
                <BackButton onClick={onBack} />
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <p style={{ fontSize: '16px', color: '#666' }}>Loading sentiment analysis...</p>
                </div>
            </div>
        );
    }

    if (vm.errorMessage) {
        return (
            <div>
                <BackButton onClick={onBack} />
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <p style={{ fontSize: '16px', color: '#E89B8E', marginBottom: '8px' }}>
                        {vm.errorMessage}
                    </p>
                    <button
                        onClick={() => vm.loadAnalytics(relationship.id, relationship.youthId, relationship.elderlyId)}
                        style={{
                            backgroundColor: '#9DE2D0',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '16px'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <BackButton onClick={onBack} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 32px 0' }}>
                Sentiment Analysis: {relationship.youthName} ↔ {relationship.elderlyName}
            </h1>

            {/* Recent Interaction Summary */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
                Recent Interaction Summary
            </h2>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                <StatBox value={vm.messageCount.toString()} label="Total Messages" />
                <StatBox value={vm.videoCallCount.toString()} label="Video Calls" />
                <StatBox value={vm.inPersonVisitCount.toString()} label="In-Person Visits" />
                <StatBox
                    value={`${vm.monthlyChange >= 0 ? '↑' : '↓'} ${Math.abs(vm.monthlyChange)}%`}
                    label="vs Last Month"
                    valueColor={vm.monthlyChange >= 0 ? '#9DE2D0' : '#EB8F80'}
                />
            </section>

            {/* Emotional Tone Indicators */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
                Emotional Tone Indicators
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#9DE2D0', color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>
                    😊 Positive: {vm.sentimentDistribution.positive}%
                </span>
                <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#F4C542', color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>
                    😐 Neutral: {vm.sentimentDistribution.neutral}%
                </span>
                <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#EB8F80', color: '#ffffff', fontSize: '13px', fontWeight: 500 }}>
                    😟 Negative: {vm.sentimentDistribution.negative}%
                </span>
            </div>

            {/* AI-Generated Insight */}
            <div style={{
                backgroundColor: '#F5F9E8',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: '4px solid #9DE2D0'
            }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
                    <strong>AI-Generated Insight:</strong> {vm.aiInsight}
                </p>
            </div>
        </div>
    );
});

// ========== COMMUNICATION FREQUENCY VIEW ==========
interface CommunicationFrequencyViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const CommunicationFrequencyView: React.FC<CommunicationFrequencyViewProps> = observer(({ relationship, onBack }) => {
    const [vm] = React.useState(() => new AdminSentimentAnalysisViewModel());
    const loadedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        // Only load if not already loaded for this relationship
        if (loadedRef.current !== relationship.id) {
            loadedRef.current = relationship.id;
            vm.loadAnalytics(relationship.id, relationship.youthId, relationship.elderlyId);
        }
    }, [relationship.id, relationship.youthId, relationship.elderlyId, vm]);

    if (vm.isLoading) {
        return (
            <div>
                <BackButton onClick={onBack} />
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <p style={{ fontSize: '16px', color: '#666' }}>Loading communication data...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <BackButton onClick={onBack} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 32px 0' }}>
                Communication Frequency: {relationship.youthName} ↔ {relationship.elderlyName}
            </h1>

            {/* Communication Timeline */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '16px' }}>
                    Communication Timeline
                </h3>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    {vm.timelineData.length > 0 ? (
                        <Line
                            data={{
                                labels: vm.timelineData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                                datasets: [{
                                    label: 'Messages',
                                    data: vm.timelineData.map(d => d.messages),
                                    borderColor: '#9DE2D0',
                                    backgroundColor: 'rgba(157, 226, 208, 0.1)',
                                    fill: true,
                                    tension: 0.4
                                }]
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' as const },
                                    title: { display: false }
                                },
                                scales: {
                                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                                }
                            }}
                        />
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No timeline data available</p>
                    )}
                </div>
            </div>

            {/* Frequency Graph with Toggle */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                        Frequency Analysis
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['daily', 'weekly', 'monthly'] as const).map(view => (
                            <button
                                key={view}
                                onClick={() => vm.setFrequencyView(view, relationship.id, relationship.youthId, relationship.elderlyId)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: vm.frequencyView === view ? '2px solid #9DE2D0' : '1px solid #e0e0e0',
                                    backgroundColor: vm.frequencyView === view ? '#F0FAF7' : '#ffffff',
                                    color: vm.frequencyView === view ? '#1a1a1a' : '#666',
                                    fontSize: '12px',
                                    fontWeight: vm.frequencyView === view ? 600 : 400,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    {vm.frequencyData.length > 0 ? (
                        <Bar
                            data={{
                                labels: vm.frequencyData.map(d => d.label),
                                datasets: [{
                                    label: 'Messages',
                                    data: vm.frequencyData.map(d => d.count),
                                    backgroundColor: '#9DE2D0',
                                    borderRadius: 4
                                }]
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false },
                                    title: { display: false }
                                },
                                scales: {
                                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                                }
                            }}
                        />
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No frequency data available</p>
                    )}
                </div>
            </div>

            {/* Response Time & Gaps Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {/* Average Response Time */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #f0f0f0'
                }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#666', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Avg Response Time
                    </h4>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a' }}>
                        {vm.averageResponseTime === 0 ? 'N/A' : `${vm.averageResponseTime}h`}
                    </div>
                    <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>
                        Average time between messages
                    </p>
                </div>

                {/* Communication Gaps */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #f0f0f0'
                }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#666', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Communication Gaps
                    </h4>
                    {vm.communicationGaps.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {vm.communicationGaps.slice(0, 3).map((gap, idx) => (
                                <div key={idx} style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#FFF3E0',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #EB8F80'
                                }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                                        {gap.days} days gap
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                        {new Date(gap.startDate).toLocaleDateString()} - {new Date(gap.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '14px', color: '#9DE2D0', margin: 0 }}>✓ No gaps detected (7+ days)</p>
                    )}
                </div>
            </div>

            {/* Stage Progression */}
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '16px' }}>
                    Relationship Stage Progression
                </h3>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    {vm.stageProgression.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {vm.stageProgression.map((stage, idx) => (
                                <div key={idx} style={{ flex: 1 }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        backgroundColor: '#F0FAF7',
                                        borderRadius: '8px',
                                        border: '2px solid #9DE2D0',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                                            {stage.stage.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            {stage.duration} days
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                            Since {new Date(stage.startDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No stage progression data available</p>
                    )}
                </div>
            </div>
        </div>
    );
});

// ========== UPDATE RISK LEVEL VIEW ==========
interface UpdateRiskLevelViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const UpdateRiskLevelView: React.FC<UpdateRiskLevelViewProps> = observer(({ relationship, onBack }) => {
    const [vm] = React.useState(() => new AdminSentimentAnalysisViewModel());
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [localStatus, setLocalStatus] = React.useState(relationship.status);
    const loadedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        if (loadedRef.current !== relationship.id) {
            loadedRef.current = relationship.id;
            vm.loadAnalytics(relationship.id, relationship.youthId, relationship.elderlyId);
        }
    }, [relationship.id, relationship.youthId, relationship.elderlyId, vm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return { bg: '#EB8F80', text: '#ffffff', label: 'CRITICAL' };
            case 'caution': return { bg: '#F4C542', text: '#1a1a1a', label: 'CAUTION' };
            case 'healthy': return { bg: '#9DE2D0', text: '#1a1a1a', label: 'HEALTHY' };
            default: return { bg: '#E9ECEF', text: '#495057', label: 'UNKNOWN' };
        }
    };

    const statusStyle = getStatusColor(localStatus);

    // Calculate if stage is stagnating
    const currentStage = vm.stageProgression[0];
    const stageDuration = currentStage?.duration || 0;
    const AVERAGE_STAGE_DURATION = 45; // days - could be fetched from database statistics
    const daysOverAverage = Math.max(0, stageDuration - AVERAGE_STAGE_DURATION);
    const isStagnating = daysOverAverage > 0;

    const handleUpdateStatus = async (newStatus: 'healthy' | 'caution' | 'critical') => {
        setIsUpdating(true);
        try {
            // Update in Supabase - mark as manually set
            const { supabase } = await import('@home-sweet-home/model');
            const { error } = await supabase
                .from('relationships')
                .update({
                    risk_level: newStatus,
                    risk_level_manual: true // Mark as admin override
                })
                .eq('id', relationship.id);

            if (error) {
                console.error('[UpdateRiskLevel] Error updating status:', error);
                alert('Failed to update risk level. Please try again.');
            } else {
                setLocalStatus(newStatus);
                alert(`Risk level manually set to ${newStatus.toUpperCase()}! Returning to dashboard...`);

                // Navigate back after short delay to show success
                setTimeout(() => {
                    onBack();
                }, 1500);
            }
        } catch (error) {
            console.error('[UpdateRiskLevel] Unexpected error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div>
            <BackButton onClick={onBack} />

            {/* Title with Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                    {relationship.youthName} ↔ {relationship.elderlyName}
                </h1>
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', backgroundColor: statusStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: statusStyle.text, textTransform: 'uppercase'
                }}>{statusStyle.label}</div>
            </div>

            {/* Update Risk Level */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
                Update Risk Level
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => handleUpdateStatus('healthy')}
                    disabled={isUpdating}
                    style={{
                        padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        backgroundColor: localStatus === 'healthy' ? '#9DE2D0' : '#E8F5E8',
                        color: '#1a1a1a', border: localStatus === 'healthy' ? '2px solid #5FBFA0' : 'none',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1
                    }}
                >
                    {localStatus === 'healthy' ? '✓ ' : ''}Healthy
                </button>
                <button
                    onClick={() => handleUpdateStatus('caution')}
                    disabled={isUpdating}
                    style={{
                        padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        backgroundColor: localStatus === 'caution' ? '#F4C542' : '#FFF8E0',
                        color: '#1a1a1a', border: localStatus === 'caution' ? '2px solid #D4A625' : 'none',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1
                    }}
                >
                    {localStatus === 'caution' ? '✓ ' : ''}CAUTION
                </button>
                <button
                    onClick={() => handleUpdateStatus('critical')}
                    disabled={isUpdating}
                    style={{
                        padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        backgroundColor: localStatus === 'critical' ? '#EB8F80' : '#FFE8E4',
                        color: localStatus === 'critical' ? '#ffffff' : '#1a1a1a',
                        border: localStatus === 'critical' ? '2px solid #D16951' : 'none',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1
                    }}
                >
                    {localStatus === 'critical' ? '✓ ' : ''}CRITICAL
                </button>
            </div>

            {/* Stage Stagnation Alert - only show if actually stagnating */}
            {isStagnating && currentStage && (
                <div style={{
                    backgroundColor: '#FFF8E0',
                    borderRadius: '12px',
                    padding: '20px',
                    borderLeft: '4px solid #F4C542',
                    marginBottom: '40px'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
                        <strong>⚠ Stage Stagnation Alert:</strong> This family has been in{' '}
                        <strong>{currentStage.stage.replace(/_/g, ' ')}</strong> for{' '}
                        <strong>{stageDuration} days</strong>, which is{' '}
                        <strong>{daysOverAverage} days longer</strong> than the {AVERAGE_STAGE_DURATION}-day average.
                        Consider updating their risk level or providing additional support.
                    </p>
                </div>
            )}

            {/* No alerts if progressing normally */}
            {!isStagnating && currentStage && (
                <div style={{
                    backgroundColor: '#F0FAF7',
                    borderRadius: '12px',
                    padding: '20px',
                    borderLeft: '4px solid #9DE2D0',
                    marginBottom: '40px'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
                        <strong>✓ Normal Progress:</strong> This family has been in{' '}
                        <strong>{currentStage.stage.replace(/_/g, ' ')}</strong> for{' '}
                        <strong>{stageDuration} days</strong>, which is within the expected timeframe
                        (average: {AVERAGE_STAGE_DURATION} days).
                    </p>
                </div>
            )}

            {/* Back to Dashboard Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={onBack} style={{
                    padding: '14px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: '#555555', color: '#ffffff', border: 'none', cursor: 'pointer'
                }}>Back to Dashboard</button>
            </div>
        </div>
    );
});

// ========== RECOMMENDATIONS VIEW ==========
interface RecommendationsViewProps {
    relationship: Relationship;
    onBack: () => void;
}

interface Recommendation {
    number: number;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    timeframe: string;
    assignTo: string;
}

const RecommendationsView: React.FC<RecommendationsViewProps> = observer(({ relationship, onBack }) => {
    const [vm] = React.useState(() => new AdminSentimentAnalysisViewModel());
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const loadedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const generateRecommendations = async () => {
            if (loadedRef.current === relationship.id) return;
            loadedRef.current = relationship.id;

            setIsLoading(true);
            try {
                // Load all analytics data
                await vm.loadAnalytics(relationship.id, relationship.youthId, relationship.elderlyId);

                // Generate recommendations based on real data
                const generated: Recommendation[] = [];
                let recNumber = 1;

                // 1. Check risk level - CRITICAL
                if (relationship.status === 'critical') {
                    generated.push({
                        number: recNumber++,
                        title: 'URGENT: Schedule Immediate Follow-Up',
                        description: `This relationship is marked as CRITICAL. Communication has been inactive for 7+ days. Contact both ${relationship.youthName} and ${relationship.elderlyName} immediately to check on their well-being and identify any barriers to communication. Consider a home visit or phone call from family advisor.`,
                        priority: 'High',
                        timeframe: 'Within 24 hours',
                        assignTo: 'Family Advisor'
                    });
                }

                // 2. Check risk level - CAUTION
                if (relationship.status === 'caution') {
                    generated.push({
                        number: recNumber++,
                        title: 'Schedule Check-In Call',
                        description: `Communication has dropped below normal levels (3-6 days without contact). Reach out to ${relationship.youthName} to understand if there are external factors affecting engagement. Provide support and resources as needed.`,
                        priority: 'High',
                        timeframe: 'Within 48 hours',
                        assignTo: 'Family Advisor'
                    });
                }

                // 3. Check sentiment - if negative
                const negativePercent = Array.isArray(vm.sentimentDistribution)
                    ? (vm.sentimentDistribution.find(s => s.sentiment === 'negative')?.percentage || 0)
                    : 0;
                if (negativePercent > 30) {
                    generated.push({
                        number: recNumber++,
                        title: 'Address Negative Sentiment Patterns',
                        description: `Recent messages show ${negativePercent.toFixed(0)}% negative sentiment. This may indicate underlying concerns or conflicts. Schedule a mediation session with both parties to address any issues and provide conflict resolution support.`,
                        priority: 'High',
                        timeframe: 'Within 3 days',
                        assignTo: 'Family Counselor'
                    });
                }

                // 4. Check communication gaps
                if (vm.communicationGaps.length > 0) {
                    const longestGap = vm.communicationGaps[0];
                    generated.push({
                        number: recNumber++,
                        title: 'Prevent Communication Gaps',
                        description: `Detected ${vm.communicationGaps.length} communication gap(s) of 7+ days, with the longest being ${longestGap.days} days. Set up automated reminders for both parties and suggest scheduled weekly check-ins to maintain consistent contact.`,
                        priority: 'Medium',
                        timeframe: 'Within 1 week',
                        assignTo: 'Activity Coordinator'
                    });
                }

                // 5. Check stage stagnation
                const currentStage = vm.stageProgression[0];
                if (currentStage && currentStage.duration > 45) {
                    generated.push({
                        number: recNumber++,
                        title: 'Address Stage Stagnation',
                        description: `The relationship has been in ${currentStage.stage.replace(/_/g, ' ')} for ${currentStage.duration} days (${currentStage.duration - 45} days over average). Organize a group activity or milestone celebration to re-energize the relationship and facilitate progression to the next stage.`,
                        priority: 'Medium',
                        timeframe: 'Within 2 weeks',
                        assignTo: 'Activity Coordinator'
                    });
                }

                // 6. Check message count - if low
                if (vm.messageCount < 10) {
                    generated.push({
                        number: recNumber++,
                        title: 'Encourage More Communication',
                        description: `Only ${vm.messageCount} messages exchanged in this relationship. Provide conversation starters, shared activity ideas, and communication tips to help both parties build a stronger connection. Consider creating structured topics or challenges.`,
                        priority: 'Medium',
                        timeframe: 'Ongoing',
                        assignTo: 'Content Team'
                    });
                }

                // 7. Positive reinforcement if everything is good
                const positivePercent = Array.isArray(vm.sentimentDistribution)
                    ? (vm.sentimentDistribution.find(s => s.sentiment === 'positive')?.percentage || 0)
                    : 0;
                if (relationship.status === 'healthy' && negativePercent < 20 && vm.messageCount > 20) {
                    generated.push({
                        number: recNumber++,
                        title: 'Celebrate Healthy Relationship',
                        description: `This relationship is progressing well with ${vm.messageCount} messages, ${positivePercent.toFixed(0)}% positive sentiment, and regular communication. Consider featuring them in a success story or recognizing their commitment.`,
                        priority: 'Low',
                        timeframe: 'Within 1 month',
                        assignTo: 'Communications Team'
                    });
                }

                // 8. Always include general support
                if (generated.length < 2) {
                    generated.push({
                        number: recNumber++,
                        title: 'Provide Ongoing Resources',
                        description: 'Share educational materials about maintaining intergenerational relationships, managing schedules, and keeping conversations engaging. Ensure both parties have access to support resources and know how to reach out for help.',
                        priority: 'Low',
                        timeframe: 'Ongoing',
                        assignTo: 'Content Team'
                    });
                }

                setRecommendations(generated);
            } catch (error) {
                console.error('[Recommendations] Error generating:', error);
            } finally {
                setIsLoading(false);
            }
        };

        generateRecommendations();
    }, [relationship, vm]);

    if (isLoading) {
        return (
            <div>
                <BackButton onClick={onBack} />
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                    <p style={{ fontSize: '16px', color: '#666' }}>Analyzing relationship data and generating recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <BackButton onClick={onBack} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 24px 0' }}>
                Support Recommendations: {relationship.youthName} ↔ {relationship.elderlyName}
            </h1>

            {/* AI Analysis Summary */}
            <div style={{
                backgroundColor: '#F5F9E8',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: '4px solid #9DE2D0',
                marginBottom: '32px'
            }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
                    <strong>🤖 AI Analysis Summary:</strong> Based on {vm.messageCount} messages, {vm.videoCallCount} video calls,
                    current risk level ({relationship.status.toUpperCase()}), sentiment patterns, and stage progress,
                    the system has generated {recommendations.length} personalized recommendation{recommendations.length > 1 ? 's' : ''} below.
                </p>
            </div>

            {/* Recommendations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {recommendations.map((rec) => (
                    <RecommendationCard key={rec.number} {...rec} />
                ))}
            </div>
        </div>
    );
});

// ========== RECOMMENDATION CARD COMPONENT ==========
interface RecommendationCardProps {
    number: number;
    title: string;
    description: string;
    priority: string;
    timeframe: string;
    assignTo: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ number, title, description, priority, timeframe, assignTo }) => {
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return { bg: '#9DE2D0', text: '#1a1a1a' };
            case 'Medium': return { bg: '#F4C542', text: '#1a1a1a' };
            case 'Low': return { bg: '#E9ECEF', text: '#495057' };
            default: return { bg: '#E9ECEF', text: '#495057' };
        }
    };
    const priorityColors = getPriorityColor(priority);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #f0f0f0',
            borderLeft: '4px solid #C8ADD6'
        }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
                {number}. {title}
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#555555', margin: '0 0 16px 0' }}>
                {description}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                    padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 500,
                    backgroundColor: priorityColors.bg, color: priorityColors.text
                }}>🎯 Priority: {priority}</span>
                <span style={{
                    padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 500,
                    backgroundColor: '#FFE8E4', color: '#EB8F80'
                }}>⏰ Timeframe: {timeframe}</span>
                <span style={{
                    padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 500,
                    backgroundColor: '#333333', color: '#ffffff'
                }}>👤 Assign to: {assignTo}</span>
            </div>
        </div>
    );
};

// ========== STAT BOX COMPONENT ==========
interface StatBoxProps {
    value: string;
    label: string;
    valueColor?: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label, valueColor = '#1a1a1a' }) => (
    <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #f0f0f0'
    }}>
        <div style={{ fontSize: '28px', fontWeight: 600, color: valueColor, marginBottom: '4px' }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#888888' }}>{label}</div>
    </div>
);

// ========== RELATIONSHIP DETAIL VIEW ==========
interface RelationshipDetailViewProps {
    relationship: Relationship;
    onBack: () => void;
    onViewSentiment: () => void;
    onViewFrequency: () => void;
    onUpdateRisk: () => void;
    onViewRecommendations: () => void;
}

const RelationshipDetailView: React.FC<RelationshipDetailViewProps> = ({
    relationship, onBack, onViewSentiment, onViewFrequency, onUpdateRisk, onViewRecommendations
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return { bg: '#EB8F80', text: '#ffffff', label: 'CRITICAL' };
            case 'caution': return { bg: '#F4C542', text: '#1a1a1a', label: 'CAUTION' };
            case 'healthy': return { bg: '#9DE2D0', text: '#1a1a1a', label: 'HEALTHY' };
            default: return { bg: '#E9ECEF', text: '#495057', label: 'UNKNOWN' };
        }
    };

    const getWarningColor = (warning: string) => {
        if (warning.includes('No contact')) return { bg: '#EB8F80', text: '#ffffff' };
        if (warning.includes('Declining')) return { bg: '#F4C542', text: '#1a1a1a' };
        if (warning.includes('stagnation')) return { bg: '#F4C542', text: '#1a1a1a' };
        if (warning.includes('Reduced')) return { bg: '#F4C542', text: '#1a1a1a' };
        return { bg: '#E9ECEF', text: '#495057' };
    };

    const statusStyle = getStatusColor(relationship.status);

    return (
        <div>
            <BackButton onClick={onBack} />

            {/* Title with Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                    {relationship.youthName} ↔ {relationship.elderlyName}
                </h1>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: statusStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: statusStyle.text, textTransform: 'uppercase'
                }}>{statusStyle.label}</div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', marginBottom: '24px' }}>
                <InfoBlock label="Youth Name" value={relationship.youthName} />
                <InfoBlock label="Youth ID" value={relationship.youthId} />
                <InfoBlock label="Elderly Name" value={relationship.elderlyName} />
                <InfoBlock label="Elderly ID" value={relationship.elderlyId} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '24px' }}>
                <InfoBlock label="Last Contact Date" value={relationship.lastContact} />
                <InfoBlock label="Current Stage" value={relationship.currentStage} />
                <InfoBlock label="Stage Duration" value={relationship.stageDuration} />
            </div>

            {/* Warning Tags */}
            {relationship.warnings.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    {relationship.warnings.map((warning, index) => {
                        const warningStyle = getWarningColor(warning);
                        return (
                            <span key={index} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                backgroundColor: warningStyle.bg, color: warningStyle.text,
                                padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 500
                            }}>⚠ {warning}</span>
                        );
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
                <ActionButton label="View Sentiment Analysis" color="#9DE2D0" textColor="#1a1a1a" onClick={onViewSentiment} />
                <ActionButton label="View Communication Frequency" color="#C8ADD6" textColor="#1a1a1a" onClick={onViewFrequency} />
                <ActionButton label="Update Risk Level" color="#EB8F80" textColor="#ffffff" onClick={onUpdateRisk} />
                <ActionButton label="Generate Recommendations" color="#F4C542" textColor="#1a1a1a" onClick={onViewRecommendations} />
            </div>

            {/* Back to Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={onBack} style={{
                    padding: '14px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: '#555555', color: '#ffffff', border: 'none', cursor: 'pointer'
                }}>Back to Dashboard</button>
            </div>
        </div>
    );
};

// ========== INFO BLOCK COMPONENT ==========
const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>{value}</div>
    </div>
);

// ========== ACTION BUTTON COMPONENT ==========
interface ActionButtonProps {
    label: string;
    color: string;
    textColor: string;
    onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, color, textColor, onClick }) => (
    <button onClick={onClick} style={{
        padding: '20px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
        backgroundColor: color, color: textColor, border: 'none', cursor: 'pointer', textAlign: 'center'
    }}>{label}</button>
);

// ========== STAT CARD COMPONENT ==========
interface RelationshipStatCardProps {
    value: number;
    label: string;
    color: string;
    highlighted?: boolean;
}

const RelationshipStatCard: React.FC<RelationshipStatCardProps> = ({ value, label, color, highlighted }) => (
    <div style={{
        backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px',
        border: highlighted ? `2px solid ${color}` : '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
        <span style={{ fontSize: '36px', fontWeight: 600, color: color, lineHeight: 1.2 }}>{value}</span>
        <span style={{ fontSize: '13px', color: '#888888', fontWeight: 400 }}>{label}</span>
    </div>
);

// ========== RELATIONSHIP CARD COMPONENT ==========
interface RelationshipCardProps {
    relationship: Relationship;
    onClick: () => void;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({ relationship, onClick }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return { bg: '#EB8F80', text: '#ffffff', label: 'CRITICAL' };
            case 'caution': return { bg: '#F4C542', text: '#1a1a1a', label: 'CAUTION' };
            case 'healthy': return { bg: '#9DE2D0', text: '#1a1a1a', label: 'HEALTHY' };
            default: return { bg: '#E9ECEF', text: '#495057', label: 'UNKNOWN' };
        }
    };

    const getWarningColor = (warning: string) => {
        if (warning.includes('No contact')) return { bg: '#EB8F80', text: '#ffffff' };
        if (warning.includes('Declining')) return { bg: '#F4C542', text: '#1a1a1a' };
        if (warning.includes('stagnation')) return { bg: '#F4C542', text: '#1a1a1a' };
        if (warning.includes('Reduced')) return { bg: '#F4C542', text: '#1a1a1a' };
        return { bg: '#E9ECEF', text: '#495057' };
    };

    const statusStyle = getStatusColor(relationship.status);

    return (
        <div onClick={onClick} style={{
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px 24px',
            border: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.2s ease'
        }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                    {relationship.youthName} ↔ {relationship.elderlyName}
                </div>
                <div style={{ fontSize: '12px', color: '#888888', marginBottom: '16px' }}>
                    Youth ID: {relationship.youthId} | Elderly ID: {relationship.elderlyId}
                </div>
                <div style={{ display: 'flex', gap: '48px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', marginBottom: '2px' }}>Last Contact</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{relationship.lastContact}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', marginBottom: '2px' }}>Current Stage</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{relationship.currentStage.split(':')[0]}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', marginBottom: '2px' }}>Stage Duration</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{relationship.stageDuration}</div>
                    </div>
                </div>
                {relationship.warnings.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {relationship.warnings.map((warning, index) => {
                            const warningStyle = getWarningColor(warning);
                            return (
                                <span key={index} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    backgroundColor: warningStyle.bg, color: warningStyle.text,
                                    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500
                                }}>⚠ {warning}</span>
                            );
                        })}
                    </div>
                )}
            </div>
            <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: statusStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: statusStyle.text, textTransform: 'uppercase'
                }}>{statusStyle.label}</div>
            </div>
        </div>
    );
};

export default RelationshipsScreen;
