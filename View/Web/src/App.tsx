// View/Web/src/App.tsx

import { useState } from 'react';
import './App.css';

// Components
import { NavigationBar } from './components/AdminUI/NavigationBar';

// Pages
import { KeywordManagementPage } from './pages/KeywordManagementPage';
import { RelationshipsScreen } from './components/AdminUI/RelationshipsScreen';

type PageType = 'relationships' | 'applications' | 'reports' | 'keyword-management';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('keyword-management');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9' }}>
      <NavigationBar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Render the current page */}
      {currentPage === 'relationships' && <RelationshipsScreen onNavigate={handleNavigate} />}
      {currentPage === 'keyword-management' && <KeywordManagementPage onNavigate={handleNavigate} />}
      {currentPage === 'applications' && <div style={{ padding: '32px' }}>Applications Page (Coming Soon)</div>}
      {currentPage === 'reports' && <div style={{ padding: '32px' }}>Reports Page (Coming Soon)</div>}
    </div>
  );
}

export default App;
