import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../components/ui';

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (infoNeeded: string, notes: string) => void;
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
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  importantNote: {
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    borderLeft: '4px solid #9DE2D0',
    fontSize: '0.9rem',
    color: '#666',
  },
};

export const RequestInfoModal: React.FC<RequestInfoModalProps> = observer(({ isOpen, onClose, onConfirm }) => {
  const [infoNeeded, setInfoNeeded] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !adminViewModel.selectedApplication) {
    return null;
  }

  const handleConfirm = () => {
    if (!infoNeeded.trim()) {
      alert('Please specify what information is needed');
      return;
    }
    onConfirm(infoNeeded, notes);
    setInfoNeeded('');
    setNotes('');
  };

  const handleClose = () => {
    setInfoNeeded('');
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="500px">
      <ModalHeader onClose={handleClose}>Request Additional Information</ModalHeader>

      <ModalBody>
        <div style={styles.formGroup}>
          <label style={styles.label}>What Information Do You Need? *</label>
          <textarea
            value={infoNeeded}
            onChange={(e) => setInfoNeeded(e.target.value)}
            placeholder="Please specify what additional information is required from the applicant..."
            style={styles.textarea}
            rows={4}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Detailed Request / Important Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context or guidance..."
            style={styles.textarea}
            rows={4}
          />
        </div>

        <div style={styles.importantNote}>
          <strong>Note:</strong> The applicant will be notified with these details and asked to provide the information and resubmit their application.
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!infoNeeded.trim() || adminViewModel.isRequestingInfo}
          loading={adminViewModel.isRequestingInfo}
        >
          Send Request
        </Button>
      </ModalFooter>
    </Modal>
  );
});
