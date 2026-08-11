import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MobilePage } from './components/MobilePage';

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'mobile'>('dashboard');

  useEffect(() => {
    // Auto-detect mobile route
    if (window.location.pathname === '/mobile') {
      setPage('mobile');
    }
  }, []);

  return page === 'mobile' ? <MobilePage /> : <Dashboard />;
}
