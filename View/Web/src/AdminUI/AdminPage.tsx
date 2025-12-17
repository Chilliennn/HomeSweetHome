import React, { useState, Suspense } from 'react';
import { observer } from 'mobx-react-lite';
import { adminViewModel } from '@home-sweet-home/viewmodel';
import { AdminLayout } from '../components/ui';

const ApplicationQueue = React.lazy(() => import('./ApplicationQueue').then(m => ({ default: m.ApplicationQueue })));
const ApplicationDetails = React.lazy(() => import('./ApplicationDetails').then(m => ({ default: m.ApplicationDetails })));
const ApprovalModal = React.lazy(() => import('./ApprovalModal').then(m => ({ default: m.ApprovalModal })));
const RejectionModal = React.lazy(() => import('./RejectionModal').then(m => ({ default: m.RejectionModal })));
const RequestInfoModal = React.lazy(() => import('./RequestInfoModal').then(m => ({ default: m.RequestInfoModal })));

export const AdminPage: React.FC = observer(() => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);

  // Initialize admin ID (in real app, get from auth context)
  React.useEffect(() => {
    const adminId = localStorage.getItem('adminId') || 'admin-001';
    adminViewModel.setCurrentAdminId(adminId);
  }, []);

  const handleSelectApplication = async (appId: string) => {
    await adminViewModel.selectApplication(appId);
  };

  const handleBackToList = async () => {
    await adminViewModel.backToList();
  };

  const handleDecision = (action: 'approve' | 'reject' | 'request_info') => {
    if (action === 'approve') {
      setShowApprovalModal(true);
    } else if (action === 'reject') {
      setShowRejectionModal(true);
    } else if (action === 'request_info') {
      setShowRequestInfoModal(true);
    }
  };

  const handleApproveConfirm = async () => {
    await adminViewModel.approveApplication();
    setShowApprovalModal(false);
    if (adminViewModel.errorMessage) {
      alert('Error: ' + adminViewModel.errorMessage);
    }
  };

  const handleRejectConfirm = async (reason: string, feedback: string, notes: string) => {
    const fullNotes = feedback ? `${feedback}\n${notes}` : notes;
    await adminViewModel.rejectApplication(reason, fullNotes);
    setShowRejectionModal(false);
    if (adminViewModel.errorMessage) {
      alert('Error: ' + adminViewModel.errorMessage);
    } else {
      await handleBackToList();
    }
  };

  const handleRequestInfoConfirm = async (infoNeeded: string, notes: string) => {
    await adminViewModel.requestMoreInfo(infoNeeded, notes);
    setShowRequestInfoModal(false);
    if (adminViewModel.errorMessage) {
      alert('Error: ' + adminViewModel.errorMessage);
    } else {
      await handleBackToList();
    }
  };

  return (
    <AdminLayout title="Application Review Queue">
      <Suspense fallback={<div>Loading admin UI...</div>}>
        {!adminViewModel.selectedApplication ? (
          <ApplicationQueue onSelectApplication={handleSelectApplication} />
        ) : (
          <ApplicationDetails
            onBack={handleBackToList}
            onDecision={handleDecision}
          />
        )}

        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onConfirm={handleApproveConfirm}
        />

        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirm={handleRejectConfirm}
        />

        <RequestInfoModal
          isOpen={showRequestInfoModal}
          onClose={() => setShowRequestInfoModal(false)}
          onConfirm={handleRequestInfoConfirm}
        />
      </Suspense>
    </AdminLayout>
  );
});

export default AdminPage;
