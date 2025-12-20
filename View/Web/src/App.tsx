// View/Web/src/App.tsx

import React, { useState, useMemo } from 'react';
import './App.css';

// Model & ViewModel imports
import { supabase, KeywordRepository, KeywordService } from '@home-sweet-home/model';
import { KeywordManagementViewModel, adminViewModel } from '@home-sweet-home/viewmodel';

// Components
import { NavigationBar } from './components/AdminUI/NavigationBar';
import { KeywordManagementScreen } from './components/AdminUI/KeywordManagementScreen';
import { RelationshipsScreen } from './components/AdminUI/RelationshipsScreen';

// Application & Report Components
import { ApplicationQueue } from './AdminUI/ApplicationQueue';
import { ApplicationDetails } from './AdminUI/ApplicationDetails';
import ReportPage from './AdminUI/ReportPage';

type PageType = 'relationships' | 'applications' | 'reports' | 'keyword-management';
type ApplicationView = 'queue' | 'details';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fff5f5', color: '#d32f2f' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('keyword-management');
  const [applicationView, setApplicationView] = useState<ApplicationView>('queue');

  // Initialize ViewModel for Keyword Management
  const keywordVM = useMemo(() => {
    const repo = new KeywordRepository(supabase);
    const service = new KeywordService(repo);
    return new KeywordManagementViewModel(service);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
    // Reset application view when navigating to applications
    if (page === 'applications') {
      setApplicationView('queue');
    }
  };

  // Handle selecting an application to view details
  const handleSelectApplication = async (appId: string) => {
    await adminViewModel.selectApplication(appId);
    setApplicationView('details');
  };

  // Handle going back to application queue
  const handleBackToQueue = () => {
    setApplicationView('queue');
  };

  // Handle application decision (approve, reject, request info)
  const handleApplicationDecision = async (action: 'approve' | 'reject' | 'request_info') => {
    const app = adminViewModel.selectedApplication;
    if (!app) return;

    try {
      if (action === 'approve') {
        await adminViewModel.approveApplication(app.id);
      } else if (action === 'reject') {
        await adminViewModel.rejectApplication(app.id, 'Application rejected by admin');
      } else if (action === 'request_info') {
        await adminViewModel.requestInfo(app.id, 'Please provide additional information');
      }
      // Go back to queue after decision
      setApplicationView('queue');
    } catch (error) {
      console.error('Error processing application decision:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
        <NavigationBar currentPage={currentPage} onNavigate={handleNavigate} />

        {/* Render the current page */}
        {currentPage === 'relationships' && <RelationshipsScreen onNavigate={handleNavigate} />}
        {currentPage === 'keyword-management' && <KeywordManagementScreen vm={keywordVM} onNavigate={handleNavigate} />}
        {currentPage === 'applications' && (
          <div style={{ padding: '32px' }}>
            {applicationView === 'queue' && (
              <ApplicationQueue onSelectApplication={handleSelectApplication} />
            )}
            {applicationView === 'details' && (
              <ApplicationDetails
                onBack={handleBackToQueue}
                onDecision={handleApplicationDecision}
              />
            )}
          </div>
        )}
        {currentPage === 'reports' && <ReportPage />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
