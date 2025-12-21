// components/AdminUI/KeywordManagementScreen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { KeywordManagementViewModel } from "@home-sweet-home/viewmodel";
import { AddKeywordModal, EditKeywordModal, DeleteKeywordModal } from "./KeywordModals";
import { StatCard } from "../components/ui";

interface Props {
    vm: KeywordManagementViewModel;
    onNavigate?: (page: string) => void;
}

// Category mapping
const CATEGORY_MAP: { [id: string]: string } = {
    "1": "Financial Exploitation",
    "2": "Personal Information",
    "3": "Inappropriate Content",
    "4": "Abuse & Harassment"
};

const CATEGORY_ICONS: { [name: string]: string } = {
    "Financial Exploitation": "💰",
    "Personal Information": "👤",
    "Inappropriate Content": "⚠️",
    "Abuse & Harassment": "🚫"
};

export const KeywordManagementScreen: React.FC<Props> = observer(({ vm, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'new' | 'current'>('new');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        vm.loadDashboard();
        vm.loadActiveKeywords();
        vm.loadSuggestions();
    }, [vm]);

    // Group keywords by category from ViewModel data
    const keywordsByCategory = useMemo(() => {
        const grouped: { [category: string]: Array<{ id: string; keyword: string; severity: string }> } = {
            "Financial Exploitation": [],
            "Personal Information": [],
            "Inappropriate Content": [],
            "Abuse & Harassment": []
        };

        vm.activeKeywords.forEach(kw => {
            const categoryName = CATEGORY_MAP[kw.category_id] || "Financial Exploitation";
            if (grouped[categoryName]) {
                grouped[categoryName].push({
                    id: kw.id,
                    keyword: kw.keyword,
                    severity: kw.severity
                });
            }
        });

        return grouped;
    }, [vm.activeKeywords]);

    const handleAddKeyword = async (keyword: string, category: string, severity: string) => {
        await vm.addKeyword(keyword, category, severity as any);
        vm.setModalState(null);
    };

    const handleEditKeyword = async (id: string, keyword: string, category: string, severity: string) => {
        await vm.updateKeyword(id, keyword, category, severity as any);
    };

    const handleDeleteKeyword = async (id: string) => {
        await vm.deleteKeyword(id);
    };

    const categories = ["Financial Exploitation", "Personal Information", "Inappropriate Content", "Abuse & Harassment"];

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
    };

    return (
        <div style={{ width: '100%', padding: '0' }}>
            {/* Page Title */}
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333', margin: '0 0 0.5rem 0' }}>
                Keyword Management
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem 0' }}>
                Manage safety keywords to protect users from harmful content and interactions
            </p>

            {/* Dashboard Stats - Top Row (like Application page) */}
            <div style={styles.dashboard}>
                <StatCard label="Active Keywords" value={vm.stats?.activeKeywordCount || 0} />
                <StatCard label="AI Suggestions" value={vm.stats?.suggestionsRemaining || 0} />
                <StatCard label="Detections Today" value={vm.stats?.detectionsToday || 0} />
            </div>

            {/* Main Container: Sidebar + Content (like Application page) */}
            <div style={styles.container}>
                {/* Sidebar - Category Filter */}
                <div style={styles.sidebar}>
                    <h4 style={styles.sectionTitle}>Keyword Categories</h4>
                    <div>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{
                                ...styles.filterBtn,
                                ...(selectedCategory === null ? styles.filterBtnActive : {}),
                            }}
                        >
                            All Keywords
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    ...styles.filterBtn,
                                    ...(selectedCategory === cat ? styles.filterBtnActive : {}),
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={styles.mainContent}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <button
                            onClick={() => setActiveTab('new')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                backgroundColor: activeTab === 'new' ? '#9DE2D0' : '#ffffff',
                                color: activeTab === 'new' ? '#ffffff' : '#666666',
                                border: '1px solid #e5e5e5',
                                cursor: 'pointer'
                            }}
                        >
                            {vm.suggestions.length} New Suggestions
                        </button>
                        <button
                            onClick={() => setActiveTab('current')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                backgroundColor: activeTab === 'current' ? '#9DE2D0' : '#ffffff',
                                color: activeTab === 'current' ? '#ffffff' : '#666666',
                                border: '1px solid #e5e5e5',
                                cursor: 'pointer'
                            }}
                        >
                            Current Keywords
                        </button>
                        {activeTab === 'current' && (
                            <button
                                onClick={() => vm.setModalState("add")}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    backgroundColor: '#9DE2D0',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginLeft: 'auto'
                                }}
                            >
                                + Add New Keyword
                            </button>
                        )}
                    </div>

                    {/* AI Suggestions Tab */}
                    {activeTab === 'new' && (
                        <div style={{ backgroundColor: '#9DE2D0', borderRadius: '12px', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🤖</span>
                                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333333' }}>AI Keyword Suggestions</h2>
                                </div>
                                <button
                                    onClick={() => vm.generateSuggestions()}
                                    disabled={vm.isMutating}
                                    style={{
                                        backgroundColor: '#9DE2D0',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        cursor: vm.isMutating ? 'not-allowed' : 'pointer',
                                        opacity: vm.isMutating ? 0.7 : 1,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {vm.isMutating ? 'Analyzing...' : '✨ Analyze Chats'}
                                </button>
                            </div>
                            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
                                Based on recent safety alerts and detected patterns, we recommend adding the following keywords to enhance monitoring effectiveness.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {vm.suggestions.map(suggestion => (
                                    <AISuggestionCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        onAccept={() => vm.acceptSuggestion(suggestion.id)}
                                        onReject={() => vm.rejectSuggestion(suggestion.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current Keywords Tab */}
                    {activeTab === 'current' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            {Object.entries(keywordsByCategory)
                                .filter(([category]) => !selectedCategory || category === selectedCategory)
                                .map(([category, keywords]) => (
                                    <KeywordCategoryCard
                                        key={category}
                                        name={category}
                                        icon={CATEGORY_ICONS[category]}
                                        count={keywords.length}
                                        keywords={keywords}
                                        onEditKeyword={(kw) => vm.setModalState("edit", {
                                            id: kw.id,
                                            keyword: kw.keyword,
                                            category: category,
                                            severity: kw.severity as 'low' | 'medium' | 'high' | 'critical',
                                            is_active: true,
                                            created_at: '',
                                            updated_at: '',
                                            category_id: Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === category) || '1'
                                        })}
                                        onDeleteKeyword={(kw) => vm.setModalState("delete", {
                                            id: kw.id,
                                            keyword: kw.keyword,
                                            category: category,
                                            severity: kw.severity as 'low' | 'medium' | 'high' | 'critical',
                                            is_active: true,
                                            created_at: '',
                                            updated_at: '',
                                            category_id: Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === category) || '1'
                                        })}
                                    />
                                ))}
                        </div>
                    )}
                </div>


                {/* Modals */}
                <AddKeywordModal
                    isOpen={vm.activeModal === "add"}
                    onClose={() => vm.setModalState(null)}
                    onAdd={handleAddKeyword}
                    isMutating={vm.isMutating}
                />

                <EditKeywordModal
                    isOpen={vm.activeModal === "edit"}
                    onClose={() => vm.setModalState(null)}
                    keyword={vm.selectedKeyword}
                    onUpdate={handleEditKeyword}
                    isMutating={vm.isMutating}
                />

                <DeleteKeywordModal
                    isOpen={vm.activeModal === "delete"}
                    onClose={() => vm.setModalState(null)}
                    keyword={vm.selectedKeyword}
                    onDelete={handleDeleteKeyword}
                    isMutating={vm.isMutating}
                />
            </div>
        </div>
    );
});

// AI Suggestion Card
const AISuggestionCard: React.FC<{
    suggestion: any;
    onAccept: () => void;
    onReject: () => void;
}> = ({ suggestion, onAccept, onReject }) => {

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return { bg: '#F8D7DA', text: '#721C24' };
            case 'High': return { bg: '#FFE5D0', text: '#E85D04' };
            case 'Medium': return { bg: '#FFF3CD', text: '#856404' };
            default: return { bg: '#D4EDDA', text: '#155724' };
        }
    };

    const colors = getSeverityColor(suggestion.severity);

    return (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
                        "{suggestion.keyword}"
                    </h3>
                    <p style={{ fontSize: '13px', color: '#666666', marginBottom: '12px' }}>
                        {suggestion.detectionSummary}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#E5D9ED',
                            color: '#6B4C7B'
                        }}>
                            {suggestion.category}
                        </span>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: colors.bg,
                            color: colors.text
                        }}>
                            {suggestion.severity}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                        onClick={onAccept}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            backgroundColor: '#9DE2D0',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={onReject}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: '#666666',
                            border: '1px solid #e0e0e0',
                            cursor: 'pointer'
                        }}
                    >
                        ✕ Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// Keyword Category Card Component
const KeywordCategoryCard: React.FC<{
    name: string;
    icon: string;
    count: number;
    keywords: Array<{ id: string; keyword: string; severity: string }>;
    onEditKeyword: (kw: { id: string; keyword: string; severity: string }) => void;
    onDeleteKeyword: (kw: { id: string; keyword: string; severity: string }) => void;
}> = ({ name, icon, count, keywords, onDeleteKeyword }) => (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333' }}>{name}</span>
            </div>
            <span style={{ fontSize: '13px', color: '#888888' }}>{count} keywords</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {keywords.map((kw) => (
                <span
                    key={kw.id}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: '#555555',
                        border: '1px solid #e8e8e8'
                    }}
                >
                    {kw.keyword}
                    <span
                        onClick={() => onDeleteKeyword(kw)}
                        style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#EB8F80',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </span>
                </span>
            ))}
        </div>
    </div>
);
