import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-text-main transition-colors duration-200">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <main className="flex-grow flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
export default AppLayout;
