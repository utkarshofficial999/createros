import React from 'react';
import { 
  Lightbulb, 
  FileEdit, 
  BarChart3, 
  BrainCircuit, 
  GitCompare,
  Zap,
  Database,
  Sun,
  Moon,
  Network,
  ShieldCheck
} from 'lucide-react';
import { CreatorProfile, ModelRecord } from '../lib/api';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  creator: CreatorProfile | null;
  activeModel: ModelRecord | null;
  theme?: 'white' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  creator,
  activeModel,
  theme = 'white',
  onToggleTheme
}) => {
  const navItems = [
    { id: 'ideas', label: 'Idea Studio', icon: Lightbulb },
    { id: 'editor', label: 'Editor & Results', icon: FileEdit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'learning', label: 'Learning Center', icon: BrainCircuit },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, badge: 'Rubric 7' },
    { id: 'compare', label: 'Before / After', icon: GitCompare, badge: 'Hero Demo' },
    { id: 'architecture', label: 'Architecture', icon: Network, badge: 'Multi-Agent' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          className="flex items-center space-x-3 cursor-pointer select-none group" 
          onClick={() => setCurrentTab('ideas')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                CreatorOS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Closed-Loop Content Engine
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Segmented Control) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300' 
                      : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls & Creator Profile */}
        <div className="flex items-center space-x-2.5">
          
          {/* Active Model Badge */}
          {activeModel && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400">Model:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-cyan-400">v{activeModel.version}</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all"
              title={`Switch to ${theme === 'white' ? 'Dark Mode' : 'White Theme'}`}
            >
              {theme === 'white' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px]">Dark</span>
                </>
              )}
            </button>
          )}

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-indigo-500/20">
              AR
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {creator?.name.split(' ')[0] || 'Alex Rivera'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">@alexbuilds</p>
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Nav row for small screens */}
      <div className="md:hidden flex items-center space-x-1 overflow-x-auto pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 pb-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
