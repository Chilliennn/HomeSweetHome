// components/AdminUI/RelationshipsScreen.tsx
"use client";

import React, { useState } from "react";

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

const sampleRelationships: Relationship[] = [
    {
        id: '1',
        youthName: 'Alex Chen',
        elderlyName: 'Ah Ma Mei',
        youthId: 'Y12345',
        elderlyId: 'E67890',
        lastContact: '9 days ago',
        currentStage: 'Stage 3: Building Bond',
        stageDuration: '65 days',
        status: 'critical',
        warnings: ['No contact 7+ days', 'Declining sentiment', 'Stage stagnation']
    },
    {
        id: '2',
        youthName: 'Sarah Lim',
        elderlyName: 'Uncle Tan',
        youthId: 'Y23456',
        elderlyId: 'E78901',
        lastContact: '3 days ago',
        currentStage: 'Stage 2: Getting Acquainted',
        stageDuration: '42 days',
        status: 'caution',
        warnings: ['Reduced communication']
    },
    {
        id: '3',
        youthName: 'Kevin Wong',
        elderlyName: 'Aunty Rose',
        youthId: 'Y34567',
        elderlyId: 'E89012',
        lastContact: '1 day ago',
        currentStage: 'Stage 4: Deep Connection',
        stageDuration: '89 days',
        status: 'healthy',
        warnings: []
    },
    {
        id: '4',
        youthName: 'Michelle Tan',
        elderlyName: 'Grandpa Lee',
        youthId: 'Y45678',
        elderlyId: 'E90123',
        lastContact: '2 days ago',
        currentStage: 'Stage 3: Building Bond',
        stageDuration: '55 days',
        status: 'healthy',
        warnings: []
    }
];

type ViewType = 'list' | 'detail' | 'sentiment' | 'frequency' | 'risk' | 'recommendations';

interface Props {
    onNavigate?: (page: string) => void;
}

export const RelationshipsScreen: React.FC<Props> = ({ onNavigate }) => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'caution' | 'critical'>('all');
    const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('list');

    // Filter relationships based on selected filter
    const filteredRelationships = sampleRelationships.filter(rel => {
        if (activeFilter === 'all') return true;
        return rel.status === activeFilter;
    });

    const filters = [
        { key: 'all', label: 'All Families' },
        { key: 'healthy', label: 'Healthy (Green)' },
        { key: 'caution', label: 'Caution (Yellow)' },
        { key: 'critical', label: 'Critical (Red)' }
    ];

    const handleCardClick = (relationship: Relationship) => {
        setSelectedRelationship(relationship);
        setCurrentView('detail');
    };

    const handleBackToDashboard = () => {
        setSelectedRelationship(null);
        setCurrentView('list');
    };

    const handleBackToDetail = () => {
        setCurrentView('detail');
    };

    const renderMainContent = () => {
        if (!selectedRelationship) {
            return (
                <>
                    {/* Title */}
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        margin: '0 0 24px 0'
                    }}>Monitor Relationship Health</h1>

                    {/* Stats Row - 3 cards */}
                    <section style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '24px',
                        width: '100%'
                    }}>
                        <RelationshipStatCard value={156} label="Total Active Families" color="#9DE2D0" />
                        <RelationshipStatCard value={128} label="Healthy Relationships" color="#9DE2D0" />
                        <RelationshipStatCard value={12} label="Needs Attention" color="#EB8F80" highlighted />
                    </section>

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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#FDF8F3',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
            {/* ========== MAIN LAYOUT ========== */}
            <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
                {/* ========== LEFT SIDEBAR ========== */}
                <aside style={{
                    width: '200px',
                    minWidth: '200px',
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #f0f0f0',
                    padding: '20px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    flexShrink: 0
                }}>
                    <h2 style={{
                        fontSize: '11px', fontWeight: 600, color: '#999999',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        paddingLeft: '12px', margin: '0 0 8px 0'
                    }}>Filter By</h2>
                    {filters.map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => {
                                setActiveFilter(filter.key as 'all' | 'healthy' | 'caution' | 'critical');
                                setSelectedRelationship(null);
                                setCurrentView('list');
                            }}
                            style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px',
                                borderRadius: '6px', fontSize: '14px',
                                fontWeight: activeFilter === filter.key ? 500 : 400,
                                backgroundColor: activeFilter === filter.key ? '#9DE2D0' : 'transparent',
                                color: activeFilter === filter.key ? '#1a1a1a' : '#555555',
                                border: 'none', cursor: 'pointer', marginBottom: '2px'
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </aside>

                {/* ========== MAIN CONTENT ========== */}
                <main style={{
                    flex: 1,
                    padding: '24px 32px',
                    backgroundColor: '#FDF8F3',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: 'calc(100vh - 60px)'
                }}>
                    {renderMainContent()}
                </main>
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

const SentimentAnalysisView: React.FC<SentimentAnalysisViewProps> = ({ relationship, onBack }) => (
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
            <StatBox value="23" label="Total Messages" />
            <StatBox value="5" label="Video Calls" />
            <StatBox value="2" label="In-Person Visits" />
            <StatBox value="↓ 45%" label="vs Last Month" valueColor="#EB8F80" />
        </section>

        {/* Emotional Tone Indicators */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
            Emotional Tone Indicators
        </h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#9DE2D0', color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>
                😊 Positive: 35%
            </span>
            <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#F4C542', color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>
                😐 Neutral: 40%
            </span>
            <span style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#EB8F80', color: '#ffffff', fontSize: '13px', fontWeight: 500 }}>
                😟 Negative: 25%
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
                <strong>AI-Generated Insight:</strong> Communication patterns show declining frequency over the past 3 weeks.
                Sentiment analysis indicates increased neutral and negative tones in recent exchanges. Youth's response time
                has increased from 2 hours to 8 hours on average. Elderly's messages show signs of reduced engagement and shorter responses.
            </p>
        </div>
    </div>
);

// ========== COMMUNICATION FREQUENCY VIEW ==========
interface CommunicationFrequencyViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const CommunicationFrequencyView: React.FC<CommunicationFrequencyViewProps> = ({ relationship, onBack }) => (
    <div>
        <BackButton onClick={onBack} />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 32px 0' }}>
            Sentiment Analysis: {relationship.youthName} ↔ {relationship.elderlyName}
        </h1>

        {/* Frequent Statistics */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
            Frequent Statistics
        </h2>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            <StatBox value="30" label="Total Interaction" />
            <StatBox value="15" label="This Month" />
            <StatBox value="3.5" label="Avg/Week" />
            <StatBox value="↓ 45%" label="vs Last Month" valueColor="#EB8F80" />
        </section>

        {/* Communication Timeline */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
            Communication Timeline
        </h2>
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '60px 24px',
            border: '1px solid #f0f0f0',
            marginBottom: '40px',
            textAlign: 'center'
        }}>
            <span style={{ fontSize: '14px', color: '#888888' }}>📊 Frequency Graph: Daily/Weekly/Monthly Visualization</span>
        </div>

        {/* Stage Progression Timeline */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
            Stage Progression Timeline
        </h2>
        <div style={{ display: 'flex', gap: '16px' }}>
            <StageBox stage="Stage 1" status="Completed" color="#E8EFC8" />
            <StageBox stage="Stage 2" status="Completed" color="#D4E8A8" />
            <StageBox stage="Stage 3" status="65 days" color="#9DE2D0" active />
            <StageBox stage="Stage 4" status="Not Started" color="#ffffff" />
        </div>
    </div>
);

// ========== UPDATE RISK LEVEL VIEW ==========
interface UpdateRiskLevelViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const UpdateRiskLevelView: React.FC<UpdateRiskLevelViewProps> = ({ relationship, onBack }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return { bg: '#EB8F80', text: '#ffffff', label: 'CRITICAL' };
            case 'caution': return { bg: '#F4C542', text: '#1a1a1a', label: 'CAUTION' };
            case 'healthy': return { bg: '#9DE2D0', text: '#1a1a1a', label: 'HEALTHY' };
            default: return { bg: '#E9ECEF', text: '#495057', label: 'UNKNOWN' };
        }
    };
    const statusStyle = getStatusColor(relationship.status);

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
                <button style={{
                    padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: relationship.status === 'healthy' ? '#9DE2D0' : '#E8F5E8',
                    color: '#1a1a1a', border: 'none', cursor: 'pointer'
                }}>Healthy</button>
                <button style={{
                    padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: relationship.status === 'caution' ? '#F4C542' : '#FFF8E0',
                    color: '#1a1a1a', border: 'none', cursor: 'pointer'
                }}>CAUTION</button>
                <button style={{
                    padding: '16px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: relationship.status === 'critical' ? '#EB8F80' : '#FFE8E4',
                    color: relationship.status === 'critical' ? '#ffffff' : '#1a1a1a', border: 'none', cursor: 'pointer'
                }}>RED (You are in this state now!)</button>
            </div>

            {/* Stage Stagnation Alert */}
            <div style={{
                backgroundColor: '#FFF8E0',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: '4px solid #F4C542',
                marginBottom: '40px'
            }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
                    <strong>⚠ Stage Stagnation Alert:</strong> This family has been in Stage 3 for {relationship.stageDuration},
                    20 days longer than the 45-day average. Consider updating their risk level.
                </p>
            </div>

            {/* Back to Dashboard Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={onBack} style={{
                    padding: '14px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: '#555555', color: '#ffffff', border: 'none', cursor: 'pointer'
                }}>Back to Dashboard</button>
            </div>
        </div>
    );
};

// ========== RECOMMENDATIONS VIEW ==========
interface RecommendationsViewProps {
    relationship: Relationship;
    onBack: () => void;
}

const RecommendationsView: React.FC<RecommendationsViewProps> = ({ relationship, onBack }) => (
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
                <strong>🤖 AI Analysis Summary:</strong> Based on communication patterns, sentiment trends, stage progress,
                and current flags, the system has generated the following support recommendations to help improve this relationship.
            </p>
        </div>

        {/* Recommendations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <RecommendationCard
                number={1}
                title="Schedule Check-In Call with Youth"
                description="Alex Chen's response time has significantly increased and communication frequency has dropped 45% compared to last month. Consider reaching out to understand if there are external factors (work stress, personal issues) affecting engagement. A friendly check-in call from NGO staff may help identify barriers and provide support."
                priority="High"
                timeframe="Within 24 hours"
                assignTo="Family Advisor"
            />
            <RecommendationCard
                number={2}
                title="Organize Group Activity or Event"
                description={`The relationship shows signs of stagnation in Stage 3 (${relationship.stageDuration}). Organizing a group activity or community event could help re-energize the relationship and provide natural opportunities for interaction. Consider inviting them to an upcoming community gathering or suggesting a structured activity they can do together.`}
                priority="Medium"
                timeframe="Within 1 week"
                assignTo="Activity Coordinator"
            />
            <RecommendationCard
                number={3}
                title="Provide Communication Tips & Resources"
                description="Share resources on maintaining long-term intergenerational relationships, managing busy schedules, and keeping conversations engaging. Send youth user educational materials about the importance of consistent communication and practical tips for staying connected despite time constraints."
                priority="Medium"
                timeframe="Within 3 days"
                assignTo="Content Team"
            />
        </div>
    </div>
);

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

// ========== STAGE BOX COMPONENT ==========
interface StageBoxProps {
    stage: string;
    status: string;
    color: string;
    active?: boolean;
}

const StageBox: React.FC<StageBoxProps> = ({ stage, status, color, active }) => (
    <div style={{
        flex: 1,
        backgroundColor: color,
        borderRadius: '8px',
        padding: '16px',
        border: active ? 'none' : '1px solid #f0f0f0',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{stage}</div>
        <div style={{ fontSize: '12px', color: '#666666' }}>{status}</div>
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
