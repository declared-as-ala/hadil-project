import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
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
