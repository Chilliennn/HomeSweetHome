import React, { useState } from 'react';

// Color constants
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

const dismissalReasons = [
    'No advisor intervention needed',
    'Duplicate request',
    'Issue already resolved',
    'Incomplete information',
    'Request withdrawn by user',
    'Other',
];

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: colors.white,
        borderRadius: '24px',
        width: '90%',
        maxWidth: '500px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    header: {
        padding: '24px 28px',
        borderBottom: `2px solid ${colors.linen}`,
    },
    warningIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: colors.apricot,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '16px',
    },
    title: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '22px',
        color: colors.mineShaft,
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.doveGray,
        margin: 0,
    },
    content: {
        padding: '24px 28px',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '14px',
        color: colors.mineShaft,
        marginBottom: '8px',
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: `2px solid ${colors.silver}`,
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.mineShaft,
        background: colors.white,
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    },
    selectFocused: {
        borderColor: colors.morningGlory,
    },
    textarea: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: `2px solid ${colors.silver}`,
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: colors.mineShaft,
        background: colors.white,
        resize: 'vertical' as const,
        minHeight: '100px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box' as const,
    },
    textareaFocused: {
        borderColor: colors.morningGlory,
    },
    helperText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: colors.doveGray,
        margin: '6px 0 0 0',
    },
    warningText: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: colors.apricot,
        background: `${colors.apricot}15`,
        padding: '12px 16px',
        borderRadius: '8px',
        margin: 0,
        lineHeight: '1.5',
    },
    footer: {
        padding: '20px 28px',
        borderTop: `2px solid ${colors.linen}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },
    button: {
        padding: '12px 24px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 700,
        transition: 'all 0.2s ease',
    },
    cancelButton: {
        background: 'transparent',
        border: `2px solid ${colors.silver}`,
        color: colors.doveGray,
    },
    confirmButton: {
        background: colors.apricot,
        color: colors.white,
    },
    confirmButtonDisabled: {
        background: colors.silver,
        cursor: 'not-allowed',
    },
};

interface DismissalModalProps {
    onClose: () => void;
    onDismiss: (reason: string, notes: string) => void;
    requestId: string;
}

export const DismissalModal: React.FC<DismissalModalProps> = ({
    onClose,
    onDismiss,
    requestId,
}) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const isValid = reason !== '';

    const handleConfirm = () => {
        if (isValid) {
            onDismiss(reason, notes);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.warningIcon}>⚠️</div>
                    <h2 style={styles.title}>Dismiss Request</h2>
                    <p style={styles.subtitle}>
                        You are about to dismiss request {requestId}
                    </p>
                </div>

                <div style={styles.content}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Dismissal Reason *</label>
                        <select
                            style={{
                                ...styles.select,
                                ...(focusedField === 'reason' ? styles.selectFocused : {}),
                            }}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            onFocus={() => setFocusedField('reason')}
                            onBlur={() => setFocusedField(null)}
                        >
                            <option value="">Select a reason...</option>
                            {dismissalReasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Additional Notes</label>
                        <textarea
                            style={{
                                ...styles.textarea,
                                ...(focusedField === 'notes' ? styles.textareaFocused : {}),
                            }}
                            placeholder="Provide any additional context for this dismissal..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            onFocus={() => setFocusedField('notes')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <p style={styles.helperText}>
                            These notes will be logged for internal reference.
                        </p>
                    </div>

                    <p style={styles.warningText}>
                        ⚠️ The requester will be notified that their consultation request has been dismissed. This action cannot be undone.
                    </p>
                </div>

                <div style={styles.footer}>
                    <button style={{ ...styles.button, ...styles.cancelButton }} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        style={{
                            ...styles.button,
                            ...styles.confirmButton,
                            ...(!isValid ? styles.confirmButtonDisabled : {}),
                        }}
                        onClick={handleConfirm}
                        disabled={!isValid}
                    >
                        Dismiss Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DismissalModal;
