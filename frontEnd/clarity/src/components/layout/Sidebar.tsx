'use client';

import React, { useEffect, useState } from 'react';
// Using standard <a> and <img> tags to avoid build errors

// --- Inline SVG Icons ---
const IconDashboard = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const IconLive = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h10c1.105 0 2 .895 2 2v8c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V8c0-1.105.895-2 2-2z" />
  </svg>
);
const IconCaptures = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 006.586 13H4" />
  </svg>
);
const IconChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const IconChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
// --- End SVG Icons ---

// Accept isCollapsed and onToggle from MainLayout
type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [pathname, setPathname] = useState('/');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side-only values
    setPathname(window.location.pathname);
    setIsClient(true);
  }, []);

  const getLinkClass = (path: string) => {
    if (!isClient) return "flex items-center text-gray-600"; // Default
    const isActive = pathname === path;
    return `flex items-center py-2.5 ${
      isCollapsed ? 'px-4 justify-center' : 'px-4'
    } ${
      isActive
        ? 'bg-gray-200 text-gray-800'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <div className={`fixed left-0 top-0 h-screen bg-gray-100 text-gray-800 border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center border-b border-gray-200 bg-gray-50 px-4">
        <div className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          {/* Logo */}
          <img 
            src="/clarity-logo.png" 
            alt="Clarity Logo" 
            className="w-8 h-8 flex-shrink-0"
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src='https://placehold.co/32x32/gray/white?text=C'; 
            }}
          />
          {/* Title (hidden when collapsed) */}
          <h1 className={`text-xl font-semibold text-gray-800 ml-2 ${isCollapsed ? 'hidden' : 'block'}`}>Clarity</h1>
        </div>
        
        {/* Toggle Button (Removed from here) */}
      </div>
      
      {/* Navigation */}
      <nav className="mt-6">
        {/* MENU Title and Collapse Button */}
        <div className={`flex items-center justify-between px-4 mb-3 ${isCollapsed ? 'hidden' : 'block'}`}>
          <h2 className="text-gray-500 uppercase text-xs font-medium tracking-wider">MENU</h2>
          {/* Toggle Button (Moved here) */}
          <button
            onClick={onToggle}
            className={`p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200`}
            aria-label="Collapse sidebar"
          >
            <IconChevronLeft className="h-6 w-6" />
          </button>
        </div>
        
        {/* Un-collapse button (shows when collapsed) */}
        {isCollapsed && (
          <button
            onClick={onToggle}
            className="w-full flex justify-center items-center py-2.5 text-gray-500 hover:bg-gray-200"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <IconChevronRight className="h-6 w-6" />
          </button>
        )}
        
        <a href="/" className={getLinkClass('/')} title="Dashboard">
          <IconDashboard className="h-5 w-5 flex-shrink-0" />
          <span className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>Dashboard</span>
        </a>
        
        <a href="/live" className={getLinkClass('/live')} title="Live Recording">
          <IconLive className="h-5 w-5 flex-shrink-0" />
          <span className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>Live Recording</span>
        </a>
        
        <a href="/captures" className={getLinkClass('/captures')} title="Saved Captures">
          <IconCaptures className="h-5 w-5 flex-shrink-0" />
          <span className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>Saved Captures</span>
        </a>
      </nav>
    </div>
  );
}

