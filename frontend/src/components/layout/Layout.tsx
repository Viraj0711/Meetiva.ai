import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(48,213,246,0.12),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />
      <div className="absolute inset-0 opacity-40 fine-grid pointer-events-none" />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
