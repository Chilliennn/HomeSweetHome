import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../components/ui';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, feedback: string, notes: string) => void;
}

const styles = {
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 600,
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    backgroundColor: '#fff',
    color: '#333',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
    color: '#333',
  },
  importantNote: {
    padding: '1rem',
    backgroundColor: '#fff5f5',
    borderRadius: '6px',
    borderLeft: '4px solid #EB8F80',
    fontSize: '0.9rem',
    color: '#666',
  },
};

export const RejectionModal: React.FC<RejectionModalProps> = observer(({ isOpen, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !adminViewModel.selectedApplication) {
    return null;
  }

  const handleConfirm = () => {
    if (!selectedReason) {
      alert('Please select a rejection reason');
      return;
    }
    if (selectedReason === 'Other (requires detailed explanation)' && !feedback) {
      alert('Please provide detailed explanation for "Other" reason');
      return;
    }
    onConfirm(selectedReason, feedback, notes);
    setSelectedReason('');
    setFeedback('');
    setNotes('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setFeedback('');
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="500px">
      <ModalHeader onClose={handleClose}>Reject Application</ModalHeader>

      <ModalBody>
        <div style={styles.formGroup}>
          <label style={styles.label}>Rejection Reason *</label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Select a reason --</option>
            {adminViewModel.rejectionReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other (requires detailed explanation)' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Detailed Explanation *</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please explain the reason for rejection..."
              style={styles.textarea}
              rows={4}
            />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Additional Feedback</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes or guidance for the applicant..."
            style={styles.textarea}
            rows={4}
          />
        </div>

        <div style={styles.importantNote}>
          <strong>Important:</strong> The applicant will receive this feedback and can reapply after addressing the concerns.
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!selectedReason || adminViewModel.isRejecting}
          loading={adminViewModel.isRejecting}
        >
          Confirm Rejection
        </Button>
      </ModalFooter>
    </Modal>
  );
});
