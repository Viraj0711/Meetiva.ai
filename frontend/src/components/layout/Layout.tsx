import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './Navbar';
import BottomNav from './BottomNav';
import { useIsMobile } from '@/hooks/useIsMobile';

const MESH_BG: React.CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),' +
    'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),' +
    '#FCFBFF',
};

const Layout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col md:flex-row" style={MESH_BG}>
      {/* Sidebar - desktop only */}
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 min-w-0 relative overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav - mobile only */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
