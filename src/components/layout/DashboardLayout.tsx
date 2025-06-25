// src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Washington Capitals Analytics</h1>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#team" className="hover:bg-red-500 px-3 py-2 rounded-md text-sm font-medium">
                  Team Overview
                </a>
                <a href="#players" className="hover:bg-red-500 px-3 py-2 rounded-md text-sm font-medium">
                  Players
                </a>
                <a href="#games" className="hover:bg-red-500 px-3 py-2 rounded-md text-sm font-medium">
                  Games
                </a>
                <a href="#advanced" className="hover:bg-red-500 px-3 py-2 rounded-md text-sm font-medium">
                  Advanced Stats
                </a>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};