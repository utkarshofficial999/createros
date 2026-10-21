import { 
  Sparkles, 
  Lightbulb, 
  FileEdit, 
  BarChart3, 
  BrainCircuit, 
  GitCompare,
  Zap,
  Database
} from 'lucide-react';
import { CreatorProfile, ModelRecord } from '../lib/api';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  creator: CreatorProfile | null;
  activeModel: ModelRecord | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  creator,
  activeModel
}) => {
  const navItems = [
    { id: 'ideas', label: 'Idea Studio', icon: Lightbulb },
    { id: 'editor', label: 'Editor & Results', icon: FileEdit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'learning', label: 'Learning Center', icon: BrainCircuit },
    { id: 'compare', label: 'Before / After', icon: GitCompare, badge: 'Hero Demo' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-creator-border/80 px-6 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('ideas')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-creator-accent via-indigo-500 to-creator-cyan p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-creator-dark rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-creator-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                CreatorOS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Self-Learning Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">Posts get better with every publish</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-creator-accent to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-creator-cyan/20 text-creator-cyan'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Model Status & Creator Pill */}
        <div className="flex items-center space-x-3">
          {/* Pinecone Live Badge */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Database className="w-3.5 h-3.5 text-creator-cyan" />
            <span className="text-slate-400">Pinecone:</span>
            <span className="font-mono font-bold text-emerald-400">21 Vectors</span>
          </div>

          {/* Groq LLM Engine Badge */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">LLM:</span>
            <span className="font-mono font-bold text-amber-300">Groq (Live)</span>
          </div>

          {activeModel && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400">Model:</span>
              <span className="font-mono font-bold text-creator-cyan">v{activeModel.version}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {Math.round(activeModel.model.overall_confidence * 100)}% conf
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
              AR
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {creator?.name.split(' ')[0] || 'Alex Rivera'}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">@alexbuilds</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
