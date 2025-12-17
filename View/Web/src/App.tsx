<<<<<<< HEAD
// View/Web/src/App.tsx

import { useState, useMemo } from 'react';
import './App.css';

// Model & ViewModel imports
import { supabase, KeywordRepository, KeywordService } from '@home-sweet-home/model';
import { KeywordManagementViewModel } from '@home-sweet-home/viewmodel';

// Components
import { NavigationBar } from './components/AdminUI/NavigationBar';
import { KeywordManagementScreen } from './components/AdminUI/KeywordManagementScreen';
import { RelationshipsScreen } from './components/AdminUI/RelationshipsScreen';

type PageType = 'relationships' | 'applications' | 'reports' | 'keyword-management';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
      <NavigationBar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Render the current page */}
      {currentPage === 'relationships' && <RelationshipsScreen onNavigate={handleNavigate} />}
      {currentPage === 'keyword-management' && <KeywordManagementScreen vm={keywordVM} onNavigate={handleNavigate} />}
      {currentPage === 'applications' && <div style={{ padding: '32px' }}>Applications Page (Coming Soon)</div>}
      {currentPage === 'reports' && <div style={{ padding: '32px' }}>Reports Page (Coming Soon)</div>}
    </div>
=======
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminUI/AdminLogin';
const AdminPage = React.lazy(() => import('./AdminUI/AdminPage'));
const ReportPage = React.lazy(() => import('./AdminUI/ReportPage'));

function RequireAuth({ children }: { children: React.ReactElement }) {
  const loggedIn = typeof window !== 'undefined' && !!localStorage.getItem('adminLoggedIn');
  if (!loggedIn) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="/admin/reports" element={<RequireAuth><ReportPage /></RequireAuth>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
>>>>>>> 6ab05c4d223822c3ae6bf6988dd8d60544db1330
  );
}

export default App;
