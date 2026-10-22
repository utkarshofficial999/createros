import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Layers,
  Award,
  Hash,
  Clock
} from 'lucide-react';
import { api, ModelRecord, CreatorModel } from '../lib/api';
import { PatternCard } from '../components/PatternCard';
import { ModelTimeline } from '../components/ModelTimeline';

interface LearningProps {
  onModelUpdated: (model: ModelRecord) => void;
  onGoToCompare: () => void;
}

export const Learning: React.FC<LearningProps> = ({
  onModelUpdated,
  onGoToCompare
}) => {
  const [activeModel, setActiveModel] = useState<ModelRecord | null>(null);
  const [modelHistory, setModelHistory] = useState<ModelRecord[]>([]);
  const [isRelearning, setIsRelearning] = useState(false);
  const [relearnNotification, setRelearnNotification] = useState('');

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const current = await api.getCurrentModel();
      const history = await api.getModelHistory();
      setActiveModel(current);
      setModelHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Re-learn: Stats Engine recalculates and Learner creates vNext
  const handleRelearn = async () => {
    setIsRelearning(true);
    setRelearnNotification('');
    try {
      const updated = await api.relearnFromAnalytics();
      setActiveModel(updated);
      setRelearnNotification(`Success! Re-learned strategy model: Creator Model v${updated.version} created with ${Math.round(updated.model.overall_confidence * 100)}% confidence.`);
      onModelUpdated(updated);
      await fetchModels();
      setTimeout(() => setRelearnNotification(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRelearning(false);
    }
  };

  const handleSelectVersion = (vNum: number) => {
    const selected = modelHistory.find(m => m.version === vNum);
    if (selected) {
      setActiveModel(selected);
    }
  };

  if (!activeModel) {
    return (
      <div className="py-20 text-center text-slate-400 font-mono text-xs">
        Loading active Creator Model...
      </div>
    );
  }

  const model: CreatorModel = activeModel.model;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Re-learn Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-creator-cyan mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>Self-Optimizing Strategy Brain • Active Model v{activeModel.version}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Creator Model & Pattern Rules
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Synthesized directly from deterministic engagement lift metrics. Zero hallucinated rules.
          </p>
        </div>

        {/* Re-learn Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRelearn}
            disabled={isRelearning}
            className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-creator-accent via-indigo-600 to-creator-cyan text-white font-extrabold text-xs shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRelearning ? 'animate-spin' : ''}`} />
            <span>{isRelearning ? 'Computing Stats & Re-learning...' : `Re-learn from Analytics (v${activeModel.version} → v${activeModel.version + 1})`}</span>
          </button>
        </div>
      </div>

      {relearnNotification && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{relearnNotification}</span>
          </div>
          <button
            onClick={onGoToCompare}
            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold font-mono transition-colors"
          >
            Compare in Before/After →
          </button>
        </div>
      )}

      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-creator-border">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Version</span>
          <p className="text-2xl font-black text-white font-mono mt-1">v{activeModel.version}</p>
          <p className="text-xs text-slate-400 mt-1">Grounding: {activeModel.based_on_n_posts} verified posts</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-creator-border">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statistical Confidence</span>
          <p className="text-2xl font-black text-creator-cyan font-mono mt-1">
            {Math.round(model.overall_confidence * 100)}%
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-creator-cyan" style={{ width: `${model.overall_confidence * 100}%` }} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-creator-border">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Winning Patterns</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{model.winning_patterns.length}</p>
          <p className="text-xs text-slate-400 mt-1">Lift ≥ 1.15x with n ≥ 3</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-creator-border">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Content Length</span>
          <p className="text-xl font-black text-indigo-300 font-mono mt-1">{model.best_length}</p>
          <p className="text-xs text-slate-400 mt-1">Yields maximum save ratio</p>
        </div>
      </div>

      {/* Main Grid: Left is Patterns (Winning & Losing), Right is Voice & Evolution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Patterns (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Winning Patterns */}
          <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Winning Patterns (Double Down)
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-semibold">
                {model.winning_patterns.length} Active Rules
              </span>
            </div>

            <div className="space-y-3">
              {model.winning_patterns.length === 0 ? (
                <p className="text-xs text-slate-400">No winning patterns identified yet.</p>
              ) : (
                model.winning_patterns.map((p, idx) => (
                  <PatternCard key={idx} pattern={p} type="winning" />
                ))
              )}
            </div>
          </div>

          {/* Losing Patterns */}
          <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Losing Patterns & Anti-Patterns (Avoid)
                </h3>
              </div>
              <span className="text-xs text-rose-400 font-mono font-semibold">
                {model.losing_patterns.length} Penalties
              </span>
            </div>

            <div className="space-y-3">
              {model.losing_patterns.length === 0 ? (
                <p className="text-xs text-slate-400">No losing patterns detected.</p>
              ) : (
                model.losing_patterns.map((p, idx) => (
                  <PatternCard key={idx} pattern={p} type="losing" />
                ))
              )}
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-creator-cyan" />
              <span>Learned Strategic Directives</span>
            </h3>
            <ul className="space-y-2">
              {model.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Voice Guidelines & Evolution Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Voice Guidelines */}
          <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <MessageSquare className="w-5 h-5 text-creator-cyan" />
              <h3 className="text-sm font-bold text-white">
                Learned Voice Profile
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Practitioner Tone</span>
                <p className="text-slate-200 leading-relaxed">{model.voice.tone}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hook Style</span>
                <p className="text-indigo-300 leading-relaxed font-mono">{model.voice.hook_style}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cadence & Length</span>
                <p className="text-slate-200 leading-relaxed">{model.voice.sentence_length}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Call to Action (CTA)</span>
                <p className="text-slate-200 leading-relaxed">{model.voice.cta_style}</p>
              </div>
            </div>

            {/* Topic Affinities */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Topics</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {model.preferred_topics.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                      +{t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avoided Topics</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {model.avoid_topics.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium">
                      -{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Model Evolution Timeline */}
          <ModelTimeline
            models={modelHistory}
            activeVersion={activeModel.version}
            onSelectVersion={handleSelectVersion}
          />

        </div>

      </div>
    </div>
  );
};
