import React from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import type { ApplicationWithProfiles } from '@home-sweet-home/model';
import { StatCard, Button } from '../components/ui';

interface ApplicationQueueProps {
  onSelectApplication: (appId: string) => void;
}

const styles = {
  // Dashboard stats at top
  dashboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  // Main container with sidebar and content
  container: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '1.5rem',
  },
  containerMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  // Sidebar
  sidebar: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    height: 'fit-content',
  },
  filterSection: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    textTransform: 'uppercase' as const,
    color: '#666',
    fontWeight: 600,
  },
  filterButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
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
  },
  filterBtnActive: {
    border: '2px solid #9DE2D0',
    backgroundColor: '#9DE2D0',
    color: '#ffffff',
  },
  // Main content
  queueMain: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  queueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e0e0e0',
  },
  queueTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
  },
  totalCount: {
    fontSize: '1rem',
    color: '#9DE2D0',
    fontWeight: 600,
  },
  errorBanner: {
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#ffe0e0',
    color: '#d32f2f',
    borderRadius: '6px',
    borderLeft: '4px solid #d32f2f',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#999',
    fontSize: '1.1rem',
  },
  applicationsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  // Application card
  applicationCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.25rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
  },
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  youthProfile: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    flex: 1,
    minWidth: '250px',
  },
  youthAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '2px solid #9DE2D0',
  },
  youthInfo: {
    flex: 1,
  },
  applicationId: {
    fontSize: '0.8rem',
    color: '#999',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
  },
  youthName: {
    fontSize: '1.05rem',
    fontWeight: 'bold',
    color: '#333',
    margin: '0.25rem 0',
  },
  submittedInfo: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.15rem 0',
  },
  waitingTime: {
    fontSize: '0.9rem',
    color: '#9DE2D0',
    fontWeight: 600,
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  waitingTimeAlert: {
    color: '#EB8F80',
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    minWidth: '120px',
  },
};

export const ApplicationQueue: React.FC<ApplicationQueueProps> = observer(({ onSelectApplication }) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 900);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load applications and stats on mount - data binding from ViewModel
  React.useEffect(() => {
    adminViewModel.loadApplications();
    adminViewModel.loadStats();
  }, []);

  // Reload when filter/sort changes - data binding reactivity
  React.useEffect(() => {
    adminViewModel.loadApplications();
  }, [adminViewModel.filter, adminViewModel.sortBy, adminViewModel.currentPage]);

  const handleFilterChange = (filter: 'all' | 'pending' | 'info_requested') => {
    adminViewModel.setFilter(filter);
  };

  const handleSortChange = (sortBy: 'oldest' | 'newest') => {
    adminViewModel.setSortBy(sortBy);
  };

  // Status badge colors matching UC499 design
  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      pending_review: { bg: '#FADE9F', text: '#7A4F00' },      // Yellow
      info_requested: { bg: '#D4E5AE', text: '#4A5D23' },     // Green
      approved: { bg: '#9DE2D0', text: '#333333' },            // Teal
      rejected: { bg: '#EB8F80', text: '#FFFFFF' },            // Red
      locked: { bg: '#C8ADD6', text: '#333333' },              // Purple
    };
    return colors[status] || { bg: '#CCCCCC', text: '#666666' };
  };

  const formatWaitingTime = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderApplicationCard = (app: ApplicationWithProfiles) => {
    // Data binding: reading from ViewModel methods
    const waitingTime = adminViewModel.getWaitingTime(app.applied_at);
    const isAlert = adminViewModel.isWaitingAlert(app.applied_at);

    return (
      <div key={app.id} style={styles.applicationCard}>
        <div style={styles.cardContent}>
          <div style={styles.youthProfile}>
            {app.youth.avatar_url && (
              <img src={app.youth.avatar_url} alt={app.youth.full_name} style={styles.youthAvatar} />
            )}
            <div style={styles.youthInfo}>
              <div style={styles.applicationId}>App ID: {app.id.substring(0, 8)}</div>
              <div style={styles.youthName}>{app.youth.full_name}</div>
              <div style={styles.submittedInfo}>
                Submitted: {new Date(app.applied_at).toLocaleDateString()} {new Date(app.applied_at).toLocaleTimeString()}
              </div>
              <div style={styles.submittedInfo}>Youth Age: {app.youth.age}</div>
              <div style={{ ...styles.waitingTime, ...(isAlert ? styles.waitingTimeAlert : {}) }}>
                Waiting: {waitingTime}
                {isAlert && <span>⚠️</span>}
              </div>
            </div>
          </div>
          <div style={styles.cardActions}>
            {(() => {
              // Check if locked by another admin
              const isLocked = !!app.locked_by;
              const displayStatus = isLocked ? 'locked' : app.status;
              const statusColors = getStatusColor(displayStatus);

              // Map admin IDs to admin names for display
              const getAdminName = (adminId: string): string => {
                const adminNames: { [key: string]: string } = {
                  '00000000-0000-0000-0000-000000000001': 'Admin001',
                  '00000000-0000-0000-0000-000000000002': 'Admin002',
                };
                return adminNames[adminId] || 'Admin';
              };

              const statusLabel = isLocked
                ? `🔒 Locked by ${getAdminName(app.locked_by!)}`
                : adminViewModel.getDisplayStatus(app.status);

              return (
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: statusColors.bg,
                  color: statusColors.text
                }}>
                  {!isLocked && displayStatus === 'pending_review' && '⏳ '}
                  {!isLocked && displayStatus === 'info_requested' && '📋 '}
                  {statusLabel}
                </div>
              );
            })()}
            <Button
              variant="primary"
              onClick={() => onSelectApplication(app.id)}
              disabled={adminViewModel.isLoading}
            >
              More Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Dashboard Stats - Top Row */}
      <div style={styles.dashboard}>
        <StatCard
          label="Pending Review"
          value={adminViewModel.stats?.pendingReview || 0}
        />
        <StatCard
          label="Approved Today"
          value={adminViewModel.stats?.approvedToday || 0}
        />
        <StatCard
          label="Avg Waiting Time"
          value={adminViewModel.stats ? formatWaitingTime(adminViewModel.stats.avgWaitingTimeHours) : '-'}
          alert={(adminViewModel.stats?.avgWaitingTimeHours || 0) >= 72}
        />
      </div>

      {/* Main Container: Sidebar + Content */}
      <div style={isMobile ? styles.containerMobile : styles.container}>
        {/* Sidebar - Filter & Sort */}
        <div style={styles.sidebar}>
          <div style={styles.filterSection}>
            <h4 style={styles.sectionTitle}>Filter By Status</h4>
            <div style={styles.filterButtons}>
              {(['all', 'pending', 'info_requested'] as const).map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.filterBtn,
                    ...(adminViewModel.filter === f ? styles.filterBtnActive : {}),
                  }}
                  onClick={() => handleFilterChange(f)}
                >
                  {f === 'all' ? 'All Applications' :
                    f === 'pending' ? 'Pending Review' : 'Info Requested'}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <h4 style={styles.sectionTitle}>Sort By</h4>
            <div style={styles.filterButtons}>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(adminViewModel.sortBy === 'oldest' ? styles.filterBtnActive : {}),
                }}
                onClick={() => handleSortChange('oldest')}
              >
                Oldest First
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(adminViewModel.sortBy === 'newest' ? styles.filterBtnActive : {}),
                }}
                onClick={() => handleSortChange('newest')}
              >
                Newest First
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Application Queue */}
        <div style={styles.queueMain}>
          <div style={styles.queueHeader}>
            <h3 style={styles.queueTitle}>Application Review Queue</h3>
            <div style={styles.totalCount}>Total: {adminViewModel.applications?.length ?? 0}</div>
          </div>

          {/* Error display - data binding to ViewModel.errorMessage */}
          {adminViewModel.errorMessage && (
            <div style={styles.errorBanner}>{adminViewModel.errorMessage}</div>
          )}

          {/* Loading state - data binding to ViewModel.isLoading */}
          {adminViewModel.isLoading && !(adminViewModel.applications?.length) && (
            <div style={styles.emptyState}>Loading applications...</div>
          )}

          {/* Empty state */}
          {!adminViewModel.isLoading && (adminViewModel.applications?.length ?? 0) === 0 && (
            <div style={styles.emptyState}>No applications to review</div>
          )}

          {/* Applications list - data binding to ViewModel.applications */}
          <div style={styles.applicationsList}>
            {(adminViewModel.applications ?? []).map(renderApplicationCard)}
          </div>
        </div>
      </div>
    </div>
  );
});
