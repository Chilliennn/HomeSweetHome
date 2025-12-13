import React from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import { Button, Card } from '../components/ui';

interface ApplicationDetailsProps {
  onBack: () => void;
  onDecision: (action: 'approve' | 'reject' | 'request_info') => void;
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    color: '#9DE2D0',
    cursor: 'pointer',
    fontWeight: 600,
  },
  content: {
    padding: '2rem',
  },
  section: {
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    color: '#333',
  },
  profilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  profileCard: {
    backgroundColor: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover' as const,
    marginBottom: '1rem',
    border: '2px solid #9DE2D0',
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid #e0e0e0',
  },
  label: {
    fontWeight: 600,
    color: '#666',
    fontSize: '0.9rem',
  },
  value: {
    color: '#333',
    fontSize: '0.95rem',
  },
  verified: {
    color: '#4caf50',
    fontWeight: 600,
  },
  unverified: {
    color: '#f44336',
    fontWeight: 600,
  },
  motivationLetter: {
    backgroundColor: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '6px',
    borderLeft: '4px solid #9DE2D0',
    lineHeight: 1.6,
    maxHeight: '300px',
    overflowY: 'auto' as const,
    marginBottom: '1rem',
  },
  letterStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  valid: {
    color: '#4caf50',
    fontWeight: 600,
  },
  invalid: {
    color: '#f44336',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  infoItemLabel: {
    fontWeight: 600,
    color: '#666',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  infoItemValue: {
    color: '#333',
    fontSize: '1rem',
    backgroundColor: '#f9f9f9',
    padding: '0.75rem',
    borderRadius: '6px',
    borderLeft: '3px solid #9DE2D0',
  },
  additionalInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  infoBlock: {
    backgroundColor: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  infoBlockTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
  },
  stars: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  star: {
    color: '#ddd',
    transition: 'all 0.3s ease',
  },
  starFilled: {
    color: '#ffc107',
  },
  starNote: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#666',
    fontStyle: 'italic',
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #9DE2D0, #C8ADD6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'width 0.3s ease',
  },
  decisionSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e0e0e0',
  },
  decisionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
};

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = observer(({ onBack, onDecision }) => {
  const app = adminViewModel.selectedApplication;

  if (!app) {
    return <div>No application selected</div>;
  }

  const commitmentLevel = calculateCommitmentLevel(app);
  const profileCompleteness = calculateProfileCompleteness(app);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Queue</button>
        <h2 style={{ margin: 0 }}>Review Application: {app.youth.full_name}</h2>
      </div>

      <div style={styles.content}>
        {/* Application Details */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Application Details</h3>

          <div style={styles.profilesGrid}>
            {/* Youth Profile */}
            <div style={styles.profileCard}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Youth Profile</h4>
              {app.youth.avatar_url && (
                <img src={app.youth.avatar_url} alt={app.youth.full_name} style={styles.profileAvatar} />
              )}
              <div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Full Name:</span>
                  <span style={styles.value}>{app.youth.full_name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>User ID:</span>
                  <span style={styles.value}>{app.youth.id.substring(0, 12)}...</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Age:</span>
                  <span style={styles.value}>{app.youth.age}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Occupation:</span>
                  <span style={styles.value}>{app.youth.occupation || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Education:</span>
                  <span style={styles.value}>{app.youth.education || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Location:</span>
                  <span style={styles.value}>{app.youth.location || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Age Verified:</span>
                  <span style={app.youth.age_verified ? styles.verified : styles.unverified}>
                    {app.youth.age_verified ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Account Created:</span>
                  <span style={styles.value}>
                    {app.youth.created_at ? new Date(app.youth.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Elderly Profile */}
            <div style={styles.profileCard}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Elderly Profile</h4>
              {app.elderly.avatar_url && (
                <img src={app.elderly.avatar_url} alt={app.elderly.full_name} style={styles.profileAvatar} />
              )}
              <div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Full Name:</span>
                  <span style={styles.value}>{app.elderly.full_name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>User ID:</span>
                  <span style={styles.value}>{app.elderly.id.substring(0, 12)}...</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Age:</span>
                  <span style={styles.value}>{app.elderly.age}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Occupation:</span>
                  <span style={styles.value}>{app.elderly.occupation || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Education:</span>
                  <span style={styles.value}>{app.elderly.education || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Location:</span>
                  <span style={styles.value}>{app.elderly.location || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Age Verified:</span>
                  <span style={app.elderly.age_verified ? styles.verified : styles.unverified}>
                    {app.elderly.age_verified ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motivation Letter */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Motivation Letter</h3>
          <div style={styles.motivationLetter}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{app.motivation_letter}</p>
          </div>
          <div style={styles.letterStats}>
            <span>Length: {app.motivation_letter.length} characters</span>
            <span style={app.motivation_letter.length >= 50 && app.motivation_letter.length <= 1000 ? styles.valid : styles.invalid}>
              {app.motivation_letter.length >= 50 && app.motivation_letter.length <= 1000 ? '✓ Valid' : '✗ Invalid (50-1000 chars)'}
            </span>
          </div>
        </section>

        {/* Application Information */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Application Information</h3>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <label style={styles.infoItemLabel}>Submission Date</label>
              <span style={styles.infoItemValue}>{new Date(app.applied_at).toLocaleDateString()}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.infoItemLabel}>Submission Time</label>
              <span style={styles.infoItemValue}>{new Date(app.applied_at).toLocaleTimeString()}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.infoItemLabel}>Waiting Time</label>
              <span style={styles.infoItemValue}>{adminViewModel.getWaitingTime(app.applied_at)}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.infoItemLabel}>Status</label>
              <span style={styles.infoItemValue}>{adminViewModel.getDisplayStatus(app.status)}</span>
            </div>
          </div>

          <div style={styles.additionalInfo}>
            <div style={styles.infoBlock}>
              <h4 style={styles.infoBlockTitle}>Commitment Level</h4>
              <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={star <= commitmentLevel ? { ...styles.star, ...styles.starFilled } : styles.star}>
                    ★
                  </span>
                ))}
              </div>
              <p style={styles.starNote}>
                {commitmentLevel === 1 && 'Low commitment'}
                {commitmentLevel === 2 && 'Below average commitment'}
                {commitmentLevel === 3 && 'Average commitment'}
                {commitmentLevel === 4 && 'Good commitment'}
                {commitmentLevel === 5 && 'Excellent commitment'}
              </p>
            </div>

            <div style={styles.infoBlock}>
              <h4 style={styles.infoBlockTitle}>Profile Completeness</h4>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${profileCompleteness}%` }}>
                  {profileCompleteness}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Decision Buttons */}
        <section style={styles.decisionSection}>
          <h3 style={styles.sectionTitle}>Make a Decision</h3>
          <div style={styles.decisionButtons}>
            <Button
              variant="danger"
              onClick={() => onDecision('reject')}
              disabled={adminViewModel.isRejecting}
              loading={adminViewModel.isRejecting}
            >
              Reject Application
            </Button>
            <Button
              variant="warning"
              onClick={() => onDecision('request_info')}
              disabled={adminViewModel.isRequestingInfo}
              loading={adminViewModel.isRequestingInfo}
            >
              Request More Info
            </Button>
            <Button
              variant="primary"
              onClick={() => onDecision('approve')}
              disabled={adminViewModel.isApproving}
              loading={adminViewModel.isApproving}
            >
              Approve Application
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
});

function calculateCommitmentLevel(app: any): number {
  const letterLength = app.motivation_letter?.length || 0;
  if (letterLength < 100) return 1;
  if (letterLength < 200) return 2;
  if (letterLength < 400) return 3;
  if (letterLength < 700) return 4;
  return 5;
}

function calculateProfileCompleteness(app: any): number {
  let complete = 0;
  let total = 8;

  if (app.youth.full_name) complete++;
  if (app.youth.age) complete++;
  if (app.youth.occupation) complete++;
  if (app.youth.education) complete++;
  if (app.youth.age_verified) complete++;
  if (app.elderly.full_name) complete++;
  if (app.elderly.age) complete++;
  if (app.motivation_letter) complete++;

  return Math.round((complete / total) * 100);
}
