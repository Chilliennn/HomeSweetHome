"use client";

import React, { useState, useEffect } from "react";
import { type KeywordRecord } from "../../../../../Model/Repository/AdminRepository/KeywordRepository";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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
                    onClick={onClose}
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
                    marginBottom: '20px',
                    color: '#C8ADD6'
                }}>{title}</h2>
                {children}
            </div>
        </div>
    );
};

// Shared input styles
const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    padding: '12px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#555555',
    marginBottom: '6px'
};

interface AddKeywordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (keyword: string, category: string, severity: any) => Promise<void>;
    isMutating: boolean;
}

export const AddKeywordModal: React.FC<AddKeywordModalProps> = ({ isOpen, onClose, onAdd, isMutating }) => {
    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("Financial Exploitation");
    const [severity, setSeverity] = useState("Low");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAdd(keyword, category, severity);
        // Reset form
        setKeyword("");
        setCategory("Financial Exploitation");
        setSeverity("Low");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Keyword">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={labelStyle}>Keyword</label>
                    <input
                        type="text"
                        required
                        style={inputStyle}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g. risky phrase"
                    />
                </div>
                <div>
                    <label style={labelStyle}>Category</label>
                    <select
                        style={inputStyle}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option>Financial Exploitation</option>
                        <option>Personal Information</option>
                        <option>Inappropriate Content</option>
                        <option>Abuse & Harassment</option>
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Severity</label>
                    <select
                        style={inputStyle}
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                    <button
                        disabled={isMutating}
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#9DE2D0',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isMutating ? 'not-allowed' : 'pointer',
                            opacity: isMutating ? 0.6 : 1
                        }}
                    >
                        {isMutating ? "Adding..." : "Add Keyword"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface EditKeywordModalProps {
    isOpen: boolean;
    onClose: () => void;
    keyword: KeywordRecord | null;
    onUpdate: (id: string, keyword: string, category: string, severity: any) => Promise<void>;
    isMutating: boolean;
}

export const EditKeywordModal: React.FC<EditKeywordModalProps> = ({ isOpen, onClose, keyword, onUpdate, isMutating }) => {
    const [text, setText] = useState("");
    const [category, setCategory] = useState("");
    const [severity, setSeverity] = useState("");

    useEffect(() => {
        if (keyword) {
            setText(keyword.keyword);
            setCategory(keyword.category);
            // Capitalize first letter of severity if strict matches required
            setSeverity(keyword.severity.charAt(0).toUpperCase() + keyword.severity.slice(1));
        }
    }, [keyword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword) return;
        await onUpdate(keyword.id, text, category, severity);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Keyword">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={labelStyle}>Keyword</label>
                    <input
                        type="text"
                        required
                        style={inputStyle}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Category</label>
                    <select
                        style={inputStyle}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option>Financial Exploitation</option>
                        <option>Personal Information</option>
                        <option>Inappropriate Content</option>
                        <option>Abuse & Harassment</option>
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Severity</label>
                    <select
                        style={inputStyle}
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                    <button
                        disabled={isMutating}
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#9DE2D0',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isMutating ? 'not-allowed' : 'pointer',
                            opacity: isMutating ? 0.6 : 1
                        }}
                    >
                        {isMutating ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface DeleteKeywordModalProps {
    isOpen: boolean;
    onClose: () => void;
    keyword: KeywordRecord | null;
    onDelete: (id: string) => Promise<void>;
    isMutating: boolean;
}

export const DeleteKeywordModal: React.FC<DeleteKeywordModalProps> = ({ isOpen, onClose, keyword, onDelete, isMutating }) => {
    const handleDelete = async () => {
        if (!keyword) return;
        await onDelete(keyword.id);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Remove Keyword">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#666666', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                    Are you sure you want to remove the keyword <span style={{ fontWeight: 700 }}>"{keyword?.keyword}"</span>?
                    This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                    <button
                        onClick={onClose}
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
                        onClick={handleDelete}
                        disabled={isMutating}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#EB8F80',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isMutating ? 'not-allowed' : 'pointer',
                            opacity: isMutating ? 0.6 : 1
                        }}
                    >
                        {isMutating ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
