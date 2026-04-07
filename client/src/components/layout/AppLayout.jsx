import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} />
      <div className="app-main">
        <TopNav onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="page-content">{children}</main>
      </div>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
}
