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
  );
}

export default App;
