import React, { useState } from 'react';
import type { Theme } from '../context/ThemeContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getThemeIcon = (t: Theme) => {
    switch (t) {
      case 'light':
        return <Sun className="w-4 h-4 text-warning" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-primary" />;
      default:
        return <Monitor className="w-4 h-4 text-text-muted" />;
    }
  };

  const themeOptions: Array<{ value: Theme; label: string }> = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'system', label: 'System Theme' },
  ];

  return (
    <header className="h-16 border-b border-card-border bg-card px-8 flex items-center justify-between z-10 select-none">
      <div>
        <h1 className="text-xl font-bold text-text-main m-0 p-0 leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-text-muted mt-1 leading-none">
            {subtitle}
          </p>
        )}
      </div>

      {/* Theme Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-card-border bg-card hover:bg-background text-sm font-medium text-text-main transition-colors"
        >
          {getThemeIcon(theme)}
          <span className="capitalize">{theme} Theme</span>
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-card-border bg-card shadow-lg py-1 z-20">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-background text-text-main transition-colors ${
                    theme === opt.value ? 'bg-primary-light font-semibold' : ''
                  }`}
                >
                  {getThemeIcon(opt.value)}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
