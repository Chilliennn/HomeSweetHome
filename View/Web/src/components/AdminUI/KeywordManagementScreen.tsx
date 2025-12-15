// components/AdminUI/KeywordManagementScreen.tsx
"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { KeywordManagementViewModel } from "@home-sweet-home/viewmodel";
import { AddKeywordModal, EditKeywordModal, DeleteKeywordModal } from "./KeywordModals";

interface Props {
    vm: KeywordManagementViewModel;
    onNavigate?: (page: string) => void;
}

// Initial keyword data for display (matching the design)
const initialKeywordCategories: { [key: string]: string[] } = {
    "Financial Exploitation": ["bank details", "transfer money", "credit card", "credit card number", "PIN code", "ATM password", "online banking", "send money urgently", "wire transfer"],
    "Personal Information": ["home address", "phone number", "NRIC", "IC number", "passport number", "email password", "date of birth", "social security"],
    "Inappropriate Content": ["explicit photos", "nude pictures", "sexual content", "adult material", "pornography", "intimate photos", "kill", "murder", "assassinate", "headshot", "stab", "slash"],
    "Abuse & Harassment": ["threaten", "harass", "force you", "hurt you", "make you", "violence", "abuse"]
};

const categoryIcons: { [key: string]: string } = {
    "Financial Exploitation": "💰",
    "Personal Information": "👤",
    "Inappropriate Content": "⚠️",
    "Abuse & Harassment": "🚫"
};

// AI Suggestions data (hardcoded for now, will come from database later)
interface AISuggestion {
    id: string;
    keyword: string;
    description: string;
    category: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

const initialAISuggestions: AISuggestion[] = [
    {
        id: '1',
        keyword: 'bank details',
        description: 'Detected 12 times in concerning financial contexts over the past 7 days',
        category: 'Financial Exploitation',
        severity: 'Critical'
    },
    {
        id: '2',
        keyword: 'password reset',
        description: 'New pattern identified - potential phishing attempts detected',
        category: 'Personal Information',
        severity: 'High'
    },
    {
        id: '3',
        keyword: 'credit card number',
        description: 'Variation of existing keyword "credit card" - detected in 8 conversations',
        category: 'Financial Exploitation',
        severity: 'Critical'
    },
    {
        id: '4',
        keyword: 'send money urgently',
        description: 'Pattern detected in 5 manually flagged conversations - urgency + financial request',
        category: 'Financial Exploitation',
        severity: 'Critical'
    },
    {
        id: '5',
        keyword: 'NRIC copy',
        description: 'Detected 6 times - requests for identity document copies',
        category: 'Personal Information',
        severity: 'High'
    }
];

// Interface for audit log entries
interface ChangeLogEntry {
    id: string;
    timestamp: Date;
    action: 'added' | 'removed';
    keyword: string;
    category: string;
    severity?: string;
    source: string;
}

export const KeywordManagementScreen: React.FC<Props> = observer(({ vm, onNavigate }) => {
    // Local state for keywords by category
    const [keywordsByCategory, setKeywordsByCategory] = useState<{ [key: string]: string[] }>(initialKeywordCategories);
    const [keywordsAdded, setKeywordsAdded] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Success message state
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Remove confirmation modal state
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [keywordToRemove, setKeywordToRemove] = useState<{ category: string; keyword: string } | null>(null);

    // Recent changes audit log
    const [recentChanges, setRecentChanges] = useState<ChangeLogEntry[]>([]);

    // AI Suggestions state
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>(initialAISuggestions);

    // Local tab state
    const [activeTab, setActiveTab] = useState<'new' | 'current'>('new');

    // Selected sidebar category
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        vm.refreshAll();
    }, [vm]);

    // Auto-hide success message after 4 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Calculate total active keywords
    const totalActiveKeywords = Object.values(keywordsByCategory).reduce(
        (sum, keywords) => sum + keywords.length, 0
    );

    const categories = [
        "Financial Exploitation",
        "Personal Information",
        "Inappropriate Content",
        "Abuse & Harassment"
    ];

    // Handle accepting an AI suggestion
    const handleAcceptSuggestion = (suggestion: AISuggestion) => {
        // Add keyword to the category
        setKeywordsByCategory(prev => ({
            ...prev,
            [suggestion.category]: [...(prev[suggestion.category] || []), suggestion.keyword]
        }));

        // Remove from suggestions
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

        // Increment keywords added count
        setKeywordsAdded(prev => prev + 1);

        // Add to recent changes log
        const newChange: ChangeLogEntry = {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: 'added',
            keyword: suggestion.keyword,
            category: suggestion.category,
            severity: suggestion.severity,
            source: 'AI Suggestion'
        };
        setRecentChanges(prev => [newChange, ...prev]);

        // Show success message
        setSuccessMessage("Keyword list updated! Changes have been applied to the monitoring system.");
    };

    // Handle rejecting an AI suggestion
    const handleRejectSuggestion = (suggestionId: string) => {
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setSuccessMessage("Suggestion rejected and removed from the list.");
    };

    // Handle adding a new keyword
    const handleAddKeyword = async (keyword: string, category: string, severity: string) => {
        // Add keyword to the selected category
        setKeywordsByCategory(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), keyword]
        }));

        // Increment keywords added count
        setKeywordsAdded(prev => prev + 1);

        // Add to recent changes log
        const newChange: ChangeLogEntry = {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: 'added',
            keyword,
            category,
            severity,
            source: 'Manual Addition'
        };
        setRecentChanges(prev => [newChange, ...prev]);

        // Close the modal
        setIsAddModalOpen(false);

        // Show success message
        setSuccessMessage("Keyword list updated! Changes have been applied to the monitoring system.");

        // Also call the ViewModel method if available
        try {
            await vm.addKeyword(keyword, category, severity);
        } catch (e) {
            console.log("ViewModel update:", e);
        }
    };

    // Open remove confirmation modal
    const openRemoveConfirmation = (category: string, keyword: string) => {
        setKeywordToRemove({ category, keyword });
        setRemoveModalOpen(true);
    };

    // Handle confirming keyword removal
    const handleConfirmRemove = () => {
        if (keywordToRemove) {
            setKeywordsByCategory(prev => ({
                ...prev,
                [keywordToRemove.category]: prev[keywordToRemove.category].filter(k => k !== keywordToRemove.keyword)
            }));

            // Add to recent changes log
            const newChange: ChangeLogEntry = {
                id: Date.now().toString(),
                timestamp: new Date(),
                action: 'removed',
                keyword: keywordToRemove.keyword,
                category: keywordToRemove.category,
                source: 'Manual Removal'
            };
            setRecentChanges(prev => [newChange, ...prev]);

            // Show success message
            setSuccessMessage("Keyword list updated! Changes have been applied to the monitoring system.");
        }

        // Close modal and reset state
        setRemoveModalOpen(false);
        setKeywordToRemove(null);
    };

    // Handle canceling removal
    const handleCancelRemove = () => {
        setRemoveModalOpen(false);
        setKeywordToRemove(null);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#ffffff',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
            {/* ========== TOP HEADER ========== */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #f0f0f0',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                flexShrink: 0
            }}>
                {/* Logo - Left */}
                <div style={{ flex: '0 0 auto' }}>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#1a1a1a'
                    }}>HomeSweetHome</span>
                </div>

                {/* Navigation - Center */}
                <nav style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}>
                    {["Relationships", "Applications", "Reports"].map((label) => (
                        <span
                            key={label}
                            onClick={() => onNavigate?.(label.toLowerCase())}
                            style={{
                                fontSize: '14px',
                                fontWeight: 400,
                                color: '#666666',
                                cursor: 'pointer'
                            }}
                        >
                            {label}
                        </span>
                    ))}
                    <button style={{
                        padding: '8px 20px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: '#9DE2D0',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                    }}>
                        Keyword Management
                    </button>
                </nav>

                {/* Icons - Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#FFB347',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                    }}>
                        🔔
                    </div>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#9DE2D0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#ffffff'
                    }}>
                        SA
                    </div>
                </div>
            </header>

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
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#999999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px',
                        paddingLeft: '12px',
                        margin: '0 0 8px 0'
                    }}>
                        Keyword Categories
                    </h2>
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            setActiveTab('current');
                        }}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: selectedCategory === null && activeTab === 'current' ? 600 : 500,
                            backgroundColor: selectedCategory === null && activeTab === 'current' ? '#9DE2D0' : 'transparent',
                            color: '#1a1a1a',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: '2px'
                        }}>
                        All Keywords
                    </button>
                    {categories.map((label) => (
                        <button
                            key={label}
                            onClick={() => {
                                setSelectedCategory(label);
                                setActiveTab('current');
                                // Scroll to the category card
                                const element = document.getElementById(`category-${label.replace(/\s+/g, '-').replace(/&/g, 'and').toLowerCase()}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: selectedCategory === label ? 600 : 400,
                                backgroundColor: selectedCategory === label ? '#9DE2D0' : 'transparent',
                                color: '#1a1a1a',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </aside>

                {/* ========== MAIN CONTENT (SCROLLABLE) ========== */}
                <main style={{
                    flex: 1,
                    padding: '24px 32px',
                    backgroundColor: '#ffffff',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: 'calc(100vh - 60px)'
                }}>
                    {/* Title Section */}
                    <section style={{ marginBottom: '20px' }}>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#1a1a1a',
                            margin: '0 0 4px 0'
                        }}>Keyword Management</h1>
                        <p style={{
                            fontSize: '14px',
                            color: '#888888',
                            margin: 0
                        }}>
                            Manage safety keywords to protect users from harmful content and interactions
                        </p>
                    </section>

                    {/* SUCCESS MESSAGE BANNER */}
                    {successMessage && (
                        <div style={{
                            backgroundColor: '#D4EDDA',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: '1px solid #C3E6CB'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#28A745',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                            </div>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#155724'
                            }}>
                                {successMessage}
                            </span>
                        </div>
                    )}

                    {/* Stats Row - 4 cards horizontally */}
                    <section style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        marginBottom: '24px',
                        width: '100%'
                    }}>
                        <StatCard
                            value={totalActiveKeywords}
                            label="Active Keywords"
                            color="#9DE2D0"
                        />
                        <StatCard
                            value={keywordsAdded > 0 ? `+${keywordsAdded}` : "0"}
                            label="Keywords Added"
                            color="#F4C542"
                        />
                        <StatCard
                            value={23}
                            label="Detections Today"
                            color="#C8ADD6"
                        />
                        <StatCard
                            value={2}
                            label="Suggestions Remaining"
                            color="#EB8F80"
                        />
                    </section>

                    {/* Tab Row with Add Button */}
                    <section style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid #e0e0e0'
                        }}>
                            <button
                                onClick={() => setActiveTab('new')}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: activeTab === 'new' ? '#ffffff' : '#f5f5f5',
                                    color: activeTab === 'new' ? '#333333' : '#888888',
                                    textDecoration: activeTab === 'new' ? 'underline' : 'none'
                                }}
                            >
                                {aiSuggestions.length} New Suggestions
                            </button>
                            <button
                                onClick={() => setActiveTab('current')}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    border: 'none',
                                    borderLeft: '1px solid #e0e0e0',
                                    cursor: 'pointer',
                                    backgroundColor: activeTab === 'current' ? '#ffffff' : '#f5f5f5',
                                    color: activeTab === 'current' ? '#333333' : '#888888',
                                    textDecoration: activeTab === 'current' ? 'underline' : 'none'
                                }}
                            >
                                Current Keywords
                            </button>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 600,
                                backgroundColor: '#9DE2D0',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            + Add New Keyword
                        </button>
                    </section>

                    {/* ========== NEW SUGGESTIONS TAB CONTENT ========== */}
                    {activeTab === 'new' && (
                        <section style={{
                            backgroundColor: '#9DE2D0',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '40px'
                        }}>
                            {/* Header */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '20px' }}>✨</span>
                                    <h2 style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        margin: 0
                                    }}>AI Keyword Suggestions</h2>
                                </div>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: '#9DE2D0',
                                    color: '#ffffff',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    marginBottom: '12px'
                                }}>{aiSuggestions.length} New Suggestions</span>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#666666',
                                    margin: 0
                                }}>
                                    Based on recent safety alerts and detected patterns, we recommend adding the following keywords to enhance monitoring effectiveness.
                                </p>
                            </div>

                            {/* Suggestion Cards */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {aiSuggestions.map((suggestion) => (
                                    <AISuggestionCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        onAccept={() => handleAcceptSuggestion(suggestion)}
                                        onReject={() => handleRejectSuggestion(suggestion.id)}
                                    />
                                ))}
                                {aiSuggestions.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px',
                                        color: '#888888'
                                    }}>
                                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👋</span>
                                        <p style={{ margin: 0 }}>No new suggestions at this time.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ========== CURRENT KEYWORDS TAB CONTENT ========== */}
                    {activeTab === 'current' && (
                        <>

                            {/* Keyword Category Cards - 2x2 Grid */}
                            <section style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '20px',
                                marginBottom: '40px'
                            }}>
                                {categories.map((categoryName) => (
                                    <div
                                        key={categoryName}
                                        id={`category-${categoryName.replace(/\s+/g, '-').replace(/&/g, 'and').toLowerCase()}`}
                                    >
                                        <KeywordCategoryCard
                                            name={categoryName}
                                            icon={categoryIcons[categoryName]}
                                            count={keywordsByCategory[categoryName]?.length || 0}
                                            keywords={keywordsByCategory[categoryName] || []}
                                            onRemoveKeyword={(keyword) => openRemoveConfirmation(categoryName, keyword)}
                                        />
                                    </div>
                                ))}
                            </section>

                            {/* Recent Changes Section */}
                            {recentChanges.length > 0 && (
                                <section style={{
                                    marginBottom: '40px'
                                }}>
                                    <h2 style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        marginBottom: '16px'
                                    }}>Recent Changes</h2>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {recentChanges.map((change) => (
                                            <RecentChangeEntry key={change.id} entry={change} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {/* Extra space at bottom for scrolling */}
                    <div style={{ height: '40px' }}></div>

                    {/* Add Keyword Modal */}
                    <AddKeywordModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddKeyword}
                        isMutating={false}
                    />

                    {/* Remove Confirmation Modal */}
                    <RemoveConfirmationModal
                        isOpen={removeModalOpen}
                        keyword={keywordToRemove?.keyword || ""}
                        onConfirm={handleConfirmRemove}
                        onCancel={handleCancelRemove}
                    />

                    {/* Edit/Delete Modals from ViewModel */}
                    <EditKeywordModal
                        isOpen={vm.activeModal === "edit"}
                        onClose={() => vm.setModalState(null)}
                        keyword={vm.selectedKeyword}
                        onUpdate={(id, k, c, s) => vm.updateKeyword(id, k, c, s)}
                        isMutating={vm.isMutating}
                    />
                    <DeleteKeywordModal
                        isOpen={vm.activeModal === "delete"}
                        onClose={() => vm.setModalState(null)}
                        keyword={vm.selectedKeyword}
                        onDelete={(id) => vm.deleteKeyword(id)}
                        isMutating={vm.isMutating}
                    />
                </main>
            </div>
        </div>
    );
});

// ========== REMOVE CONFIRMATION MODAL ==========

interface RemoveConfirmationModalProps {
    isOpen: boolean;
    keyword: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const RemoveConfirmationModal: React.FC<RemoveConfirmationModalProps> = ({ isOpen, keyword, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        color: '#999999',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#C8ADD6'
                }}>Remove Keyword</h2>

                <p style={{
                    color: '#666666',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    margin: '0 0 24px 0'
                }}>
                    Are you sure you want to remove the keyword <span style={{ fontWeight: 700 }}>"{keyword}"</span>?
                    This action cannot be undone.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: '#666666',
                            border: '1px solid #e5e5e5',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#EB8F80',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========== RECENT CHANGE ENTRY ==========

interface RecentChangeEntryProps {
    entry: ChangeLogEntry;
}

const RecentChangeEntry: React.FC<RecentChangeEntryProps> = ({ entry }) => {
    // Format timestamp
    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options).replace(',', ' -');
    };

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #f0f0f0',
            borderLeft: '4px solid #9DE2D0'
        }}>
            <div style={{
                fontSize: '12px',
                color: '#888888',
                marginBottom: '6px'
            }}>
                {formatDate(entry.timestamp)}
            </div>
            <div style={{
                fontSize: '14px',
                color: '#333333'
            }}>
                Admin SA{' '}
                <span style={{
                    color: entry.action === 'added' ? '#28A745' : '#DC3545',
                    fontWeight: 600
                }}>
                    {entry.action}
                </span>
                {' '}keyword "{entry.keyword}" ({entry.category}
                {entry.severity ? ` - ${entry.severity}` : ''}) - Source: {entry.source}
            </div>
        </div>
    );
};

// ========== AI SUGGESTION CARD ==========

interface AISuggestionCardProps {
    suggestion: AISuggestion;
    onAccept: () => void;
    onReject: () => void;
}

const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ suggestion, onAccept, onReject }) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return { bg: '#F8D7DA', text: '#721C24' };
            case 'High': return { bg: '#FFE5D0', text: '#E85D04' };
            case 'Medium': return { bg: '#FFF3CD', text: '#856404' };
            case 'Low': return { bg: '#D4EDDA', text: '#155724' };
            default: return { bg: '#E9ECEF', text: '#495057' };
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Financial Exploitation': return { bg: '#E5D9ED', text: '#6B4C7B' };
            case 'Personal Information': return { bg: '#D4EDDA', text: '#155724' };
            case 'Inappropriate Content': return { bg: '#FFF3CD', text: '#856404' };
            case 'Abuse & Harassment': return { bg: '#F8D7DA', text: '#721C24' };
            default: return { bg: '#E9ECEF', text: '#495057' };
        }
    };

    const severityColors = getSeverityColor(suggestion.severity);
    const categoryColors = getCategoryColor(suggestion.category);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            border: '1px solid #e8e8e8'
        }}>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: '6px'
                }}>
                    "{suggestion.keyword}"
                </div>
                <p style={{
                    fontSize: '13px',
                    color: '#666666',
                    margin: '0 0 12px 0',
                    lineHeight: 1.5
                }}>
                    {suggestion.description}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: categoryColors.bg,
                        color: categoryColors.text
                    }}>
                        {suggestion.category}
                    </span>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: severityColors.bg,
                        color: severityColors.text
                    }}>
                        {suggestion.severity}
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginLeft: '20px', alignItems: 'center' }}>
                <button
                    onClick={onAccept}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: '#D4EDDA',
                        color: '#155724',
                        border: '1px solid #C3E6CB',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    ✓ Accept
                </button>
                <button
                    onClick={onReject}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#666666',
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    ✕ Reject
                </button>
            </div>
        </div>
    );
};

// ========== INLINE COMPONENTS ==========

interface StatCardProps {
    value: number | string;
    label: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color }) => (
    <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    }}>
        <span style={{
            fontSize: '32px',
            fontWeight: 600,
            color: color,
            lineHeight: 1.2
        }}>
            {value}
        </span>
        <span style={{
            fontSize: '13px',
            color: '#888888',
            fontWeight: 400
        }}>
            {label}
        </span>
    </div>
);

interface KeywordCategoryCardProps {
    name: string;
    icon: string;
    count: number;
    keywords: string[];
    onRemoveKeyword: (keyword: string) => void;
}

const KeywordCategoryCard: React.FC<KeywordCategoryCardProps> = ({ name, icon, count, keywords, onRemoveKeyword }) => (
    <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #f0f0f0'
    }}>
        {/* Header */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1a1a1a'
                }}>{name}</span>
            </div>
            <span style={{
                fontSize: '13px',
                color: '#888888'
            }}>{count} keywords</span>
        </div>

        {/* Keywords */}
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
        }}>
            {keywords.map((keyword) => (
                <KeywordTag
                    key={keyword}
                    keyword={keyword}
                    onRemove={() => onRemoveKeyword(keyword)}
                />
            ))}
        </div>
    </div>
);

interface KeywordTagProps {
    keyword: string;
    onRemove: () => void;
}

const KeywordTag: React.FC<KeywordTagProps> = ({ keyword, onRemove }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#F5F5F5',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '13px',
        color: '#555555',
        border: '1px solid #e8e8e8'
    }}>
        {keyword}
        <span
            onClick={onRemove}
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
);

interface TagPillProps {
    children: React.ReactNode;
    variant?: "category" | "severity";
}

const TagPill: React.FC<TagPillProps> = ({ children, variant = "category" }) => {
    const style = variant === "category"
        ? { backgroundColor: "#E5D9ED", color: "#6B4C7B" }
        : { backgroundColor: "#F6D5D1", color: "#A84F42" };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            ...style
        }}>
            {children}
        </span>
    );
};

interface SuggestionCardProps {
    keyword: string;
    description: string;
    category: string;
    severity: string;
    onAccept: () => void;
    onReject: () => void;
    disabled: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
    keyword,
    description,
    category,
    severity,
    onAccept,
    onReject,
    disabled
}) => (
    <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        border: '1px solid #e8e8e8'
    }}>
        <div style={{ flex: 1 }}>
            <div style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '4px'
            }}>
                "{keyword}"
            </div>
            <p style={{
                fontSize: '13px',
                color: '#888888',
                margin: '0 0 10px 0'
            }}>
                {description}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <TagPill variant="category">{category}</TagPill>
                <TagPill variant="severity">{severity}</TagPill>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', alignItems: 'center' }}>
            <button
                disabled={disabled}
                onClick={onAccept}
                style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#D4EDDA',
                    color: '#155724',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                ✓ Accept
            </button>
            <button
                disabled={disabled}
                onClick={onReject}
                style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                ✕ Reject
            </button>
        </div>
    </div>
);
