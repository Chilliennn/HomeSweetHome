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
  );
}

export default App;
