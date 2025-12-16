// components/AdminUI/KeywordManagementScreen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { KeywordManagementViewModel } from "@home-sweet-home/viewmodel";
import { AddKeywordModal, EditKeywordModal, DeleteKeywordModal } from "./KeywordModals";

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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
            {/* Left Sidebar */}
            <div style={{ width: '200px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        KEYWORD CATEGORIES
                    </h3>
                </div>

                <div
                    onClick={() => setSelectedCategory(null)}
                    style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === null ? '#9DE2D0' : 'transparent',
                        color: selectedCategory === null ? '#ffffff' : '#666666',
                        fontWeight: selectedCategory === null ? 600 : 400,
                        fontSize: '14px'
                    }}
                >
                    All Keywords
                </div>

                {categories.map(cat => (
                    <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            cursor: 'pointer',
                            backgroundColor: selectedCategory === cat ? '#9DE2D0' : 'transparent',
                            color: selectedCategory === cat ? '#ffffff' : '#666666',
                            fontWeight: selectedCategory === cat ? 600 : 400,
                            fontSize: '14px'
                        }}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '32px' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
                        Keyword Management
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666666' }}>
                        Manage safety keywords to protect users from harmful content and interactions
                    </p>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <StatCard value={vm.stats?.activeKeywordCount || 0} label="Active Keywords" color="#C8ADD6" />
                    <StatCard value={vm.stats?.suggestionsRemaining || 0} label="AI Suggestions" color="#9DE2D0" />
                    <StatCard value={vm.stats?.detectionsToday || 0} label="Detections Today" color="#EB8F80" />
                    <StatCard value={vm.stats?.keywordsAddedThisWeek || 0} label="Pending Changes" color="#FFB84D" />
                </div>

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
                    <div style={{ backgroundColor: '#D4F4E7', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333333' }}>AI Keyword Suggestions</h2>
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
                                        severity: kw.severity,
                                        is_active: true,
                                        created_at: '',
                                        updated_at: '',
                                        category_id: Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === category) || '1'
                                    })}
                                    onDeleteKeyword={(kw) => vm.setModalState("delete", {
                                        id: kw.id,
                                        keyword: kw.keyword,
                                        category: category,
                                        severity: kw.severity,
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
    );
});

// Stat Card Component
const StatCard: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: '32px', fontWeight: 600, color, lineHeight: 1.2 }}>{value}</span>
        <br />
        <span style={{ fontSize: '13px', color: '#888888' }}>{label}</span>
    </div>
);

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
