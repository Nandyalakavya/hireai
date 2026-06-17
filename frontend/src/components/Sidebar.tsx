import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Trophy,
  GitCompare,
  BarChart3,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Descriptions', path: '/job-descriptions', icon: FileText },
    { name: 'Candidates', path: '/candidates', icon: Users },
    { name: 'Rankings', path: '/rankings', icon: Trophy },
    { name: 'Compare', path: '/compare', icon: GitCompare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Copilot', path: '/copilot', icon: MessageSquare },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-card border-r border-card-border flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 border-b border-card-border gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-text-main tracking-wide whitespace-nowrap">
              HireAI
            </span>
          )}
        </div>

        {/* Menu Items */}
        <nav className="mt-6 px-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-text-muted hover:bg-background hover:text-text-main'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="px-2 pb-6 space-y-1">
        <button
          onClick={() => alert('Logout is handled locally in the UI.')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-background hover:text-danger transition-all duration-200 text-left"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <div className="pt-4 border-t border-card-border flex justify-start px-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-background text-text-muted hover:text-text-main transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
