// View/Web/src/App.tsx

import { useState } from 'react';
import './App.css';

// Pages
import { KeywordManagementPage } from './pages/KeywordManagementPage';
import { RelationshipsScreen } from './components/AdminUI/RelationshipsScreen';

type PageType = 'relationships' | 'applications' | 'reports' | 'keyword-management';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('keyword-management');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  // Render the current page
  switch (currentPage) {
    case 'relationships':
      return <RelationshipsScreen onNavigate={handleNavigate} />;
    case 'keyword-management':
    default:
      return <KeywordManagementPage onNavigate={handleNavigate} />;
  }
}

export default App;
