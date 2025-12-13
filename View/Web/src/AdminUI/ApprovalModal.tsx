import React from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../components/ui';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const styles = {
  successMessage: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#9DE2D0',
    color: '#ffffff',
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f0f0f0',
  },
  summaryLabel: {
    color: '#666',
    fontWeight: 500,
  },
  summaryValue: {
    color: '#333',
    fontWeight: 600,
  },
  approvedValue: {
    color: '#9DE2D0',
    fontWeight: 600,
  },
  nextSteps: {
    marginTop: '1rem',
  },
  nextStepsList: {
    paddingLeft: '1.5rem',
    lineHeight: 1.8,
    color: '#555',
  },
};

export const ApprovalModal: React.FC<ApprovalModalProps> = observer(({ isOpen, onClose, onConfirm }) => {
  if (!isOpen || !adminViewModel.selectedApplication) {
    return null;
  }

  const app = adminViewModel.selectedApplication;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <ModalHeader onClose={onClose}>Application Approved ✓</ModalHeader>

      <ModalBody>
        <div style={styles.successMessage}>
          <div style={styles.successIcon}>✓</div>
          <p>The application has been successfully approved!</p>
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Approval Summary</h4>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Application ID:</span>
            <span style={styles.summaryValue}>{app.id.substring(0, 12)}...</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Youth Applicant:</span>
            <span style={styles.summaryValue}>{app.youth.full_name}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Elderly Applicant:</span>
            <span style={styles.summaryValue}>{app.elderly.full_name}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Approved By:</span>
            <span style={styles.summaryValue}>{adminViewModel.currentAdminId}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Approved Time:</span>
            <span style={styles.summaryValue}>{new Date().toLocaleString()}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Status:</span>
            <span style={styles.approvedValue}>Approved</span>
          </div>
        </div>

        <div style={styles.nextSteps}>
          <h4 style={{ marginBottom: '0.5rem' }}>What Happens Next</h4>
          <ol style={styles.nextStepsList}>
            <li>Notification sent to youth applicant</li>
            <li>Elderly will be notified to review the application</li>
            <li>Both parties must accept before relationship begins</li>
            <li>Pre-chat session will be arranged if both accept</li>
          </ol>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={() => { onClose(); adminViewModel.backToList(); }}>
          Back to Queue
        </Button>
        <Button variant="primary" onClick={() => { onClose(); onConfirm(); }}>
          Review Next Application
        </Button>
      </ModalFooter>
    </Modal>
  );
});
