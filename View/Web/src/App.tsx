// View/Web/src/App.tsx

import React, { Suspense, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Model & ViewModel imports
import { supabase, KeywordRepository, KeywordService } from '@home-sweet-home/model';
import { KeywordManagementViewModel } from '@home-sweet-home/viewmodel';

// Components
import { NavigationBar } from './components/AdminUI/NavigationBar';
import { KeywordManagementScreen } from './components/AdminUI/KeywordManagementScreen';
import { RelationshipsScreen } from './components/AdminUI/RelationshipsScreen';

// Lazy load heavy pages (from teammate's code)
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));

type PageType = 'relationships' | 'applications' | 'reports' | 'keyword-management';

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

// Auth guard component (placeholder - implement based on your auth flow)
function RequireAuth({ children }: { children: React.ReactNode }) {
  // TODO: Check actual auth status from AuthViewModel
  const isAuthenticated = true; // Replace with real auth check
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('keyword-management');

  // Initialize ViewModel for Keyword Management
  const keywordVM = useMemo(() => {
    const repo = new KeywordRepository(supabase);
    const service = new KeywordService(repo);
    return new KeywordManagementViewModel(service);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Teammate's routes */}
            <Route path="/" element={<AdminLogin />} />
            <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
            <Route path="/admin/reports" element={<RequireAuth><ReportPage /></RequireAuth>} />

            {/* Your keyword management route */}
            <Route path="/admin/keywords" element={
              <RequireAuth>
                <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
                  <NavigationBar currentPage={currentPage} onNavigate={handleNavigate} />
                  <KeywordManagementScreen vm={keywordVM} onNavigate={handleNavigate} />
                </div>
              </RequireAuth>
            } />

            {/* Your relationships route */}
            <Route path="/admin/relationships" element={
              <RequireAuth>
                <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
                  <NavigationBar currentPage={currentPage} onNavigate={handleNavigate} />
                  <RelationshipsScreen onNavigate={handleNavigate} />
                </div>
              </RequireAuth>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
