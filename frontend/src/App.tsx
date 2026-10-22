import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { IdeaStudio } from './pages/IdeaStudio';
import { Editor } from './pages/Editor';
import { Analytics } from './pages/Analytics';
import { Learning } from './pages/Learning';
import { Compare } from './pages/Compare';
import { Architecture } from './pages/Architecture';
import { AuditTrail } from './pages/AuditTrail';
import { api, CreatorProfile, ModelRecord } from './lib/api';
import { Sparkles, Terminal, Shield, GitCommit, Heart } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('ideas');
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [activeModel, setActiveModel] = useState<ModelRecord | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<any | null>(null);
  const [theme, setTheme] = useState<'white' | 'dark'>(() => {
    return (localStorage.getItem('creatoros_theme') as 'white' | 'dark') || 'white';
  });

  useEffect(() => {
    localStorage.setItem('creatoros_theme', theme);
    if (theme === 'white') {
      document.documentElement.classList.add('theme-white');
      document.body.classList.add('theme-white');
      document.documentElement.classList.remove('theme-dark');
      document.body.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-white');
      document.body.classList.remove('theme-white');
      document.documentElement.classList.add('theme-dark');
      document.body.classList.add('theme-dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'white' ? 'dark' : 'white');
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const creatorData = await api.getCreator();
      setCreator(creatorData);
    } catch (err) {
      console.warn("Backend not yet running or still booting", err);
    }

    try {
      const modelData = await api.getCurrentModel();
      setActiveModel(modelData);
    } catch (err) {
      console.warn("Model not yet initialized", err);
    }
  };

  const handlePostCreated = (postData: any) => {
    setLatestGeneration(postData);
  };

  const handleModelUpdated = (model: ModelRecord) => {
    setActiveModel(model);
  };

  return (
    <div className={`min-h-screen ${theme === 'white' ? 'theme-white bg-[#f8fafc] text-slate-900' : 'theme-dark bg-[#0b0f17] text-slate-100'} flex flex-col font-sans selection:bg-creator-accent selection:text-white transition-colors duration-200`}>
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        creator={creator}
        activeModel={activeModel}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Screen Views */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {currentTab === 'ideas' && (
          <IdeaStudio
            activeModel={activeModel}
            onPostCreated={handlePostCreated}
            onGoToEditor={() => setCurrentTab('editor')}
          />
        )}

        {currentTab === 'editor' && (
          <Editor
            latestGeneration={latestGeneration}
            onPostPublished={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'analytics' && (
          <Analytics
            onRelearnRequested={() => setCurrentTab('learning')}
          />
        )}

        {currentTab === 'learning' && (
          <Learning
            onModelUpdated={handleModelUpdated}
            onGoToCompare={() => setCurrentTab('compare')}
          />
        )}

        {currentTab === 'audit' && (
          <AuditTrail />
        )}

        {currentTab === 'compare' && (
          <Compare
            activeModel={activeModel}
          />
        )}

        {currentTab === 'architecture' && (
          <Architecture />
        )}
      </main>

      {/* Persistent Bottom Hackathon Demo Bar */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-mono text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>FastAPI Backend • Python Stats Engine • React SSE Frontend</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 font-mono">SQLite + SQLAlchemy</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentTab('compare')}
              className="text-creator-cyan hover:underline flex items-center space-x-1 font-mono font-bold"
            >
              <span>Demo Climax: Before / After</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setCurrentTab('audit')}
              className="hover:text-slate-200 transition-colors"
            >
              Audit Trail
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setCurrentTab('learning')}
              className="hover:text-slate-200 transition-colors"
            >
              Learning Center
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setCurrentTab('analytics')}
              className="hover:text-slate-200 transition-colors"
            >
              Analytics
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
