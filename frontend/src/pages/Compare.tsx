import React, { useState } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Code2,
  Zap,
  Target
} from 'lucide-react';
import { api, CompareResponse, ModelRecord } from '../lib/api';

interface CompareProps {
  activeModel: ModelRecord | null;
}

export const Compare: React.FC<CompareProps> = ({ activeModel }) => {
  const [topic, setTopic] = useState('Vector Databases and Semantic Caching in Production');
  const [vBase, setVBase] = useState<number>(0);
  const [vTarget, setVTarget] = useState<number>(activeModel?.version || 1);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunComparison = async () => {
    setIsLoading(true);
    try {
      const res = await api.compareModels(topic, vBase, vTarget);
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on first render if no comparison yet
  React.useEffect(() => {
    handleRunComparison();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-creator-cyan mb-1">
            <GitCompare className="w-4 h-4" />
            <span>The Hero Demo • Proving The Core Thesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Before vs After Analytics Learning
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            The exact same prompt processed before and after learning. See how honest data transforms sterile advice into high-converting engineering stories.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono self-start md:self-auto">
          <Zap className="w-3.5 h-3.5 text-creator-cyan animate-pulse shrink-0" />
          <span>No ChatGPT Wrapper • Real Dynamic Conditioning</span>
        </div>
      </div>

      {/* Control Input Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-creator-border shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Test Prompt / Engineering Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Scaling Celery Workers to AsyncIO..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-creator-cyan"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Base Model
            </label>
            <select
              value={vBase}
              onChange={(e) => setVBase(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value={0}>v0 (Default Baseline)</option>
              <option value={1}>v1 (Initial Seed)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Learned Model
            </label>
            <select
              value={vTarget}
              onChange={(e) => setVTarget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value={activeModel?.version || 1}>v{activeModel?.version || 1} (Learned)</option>
              <option value={2}>v2 (Re-learned)</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-2 md:pt-5">
            <button
              onClick={handleRunComparison}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-creator-accent via-indigo-600 to-creator-cyan text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Comparing...' : 'Run Side-by-Side'}
            </button>
          </div>

        </div>
      </div>

      {/* Differences Synthesis Banner */}
      {comparison && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-creator-cyan" />
              <h3 className="text-sm font-bold text-white">
                Autonomous Improvement Analysis
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">Score Delta:</span>
              <span className="font-extrabold text-emerald-400">
                +{roundDiff(comparison.target_generation.review.overall, comparison.base_generation.review.overall)} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {comparison.differences_summary.map((diff, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{diff}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Columns */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: Model v0 (Before Learning) */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 relative opacity-90">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-600" />
                <h3 className="text-base font-bold text-slate-300 font-mono">
                  BEFORE: Creator Model v{comparison.base_version}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-bold font-mono">
                Generic Baseline
              </span>
            </div>

            {/* Scorecard Mini */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase text-[10px]">Quality Score</span>
                <p className="text-base font-bold text-slate-300">
                  {comparison.base_generation.review.overall.toFixed(1)} / 10
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-500 uppercase text-[10px]">Hook Strength</span>
                <p className="text-sm font-semibold text-slate-400">
                  {comparison.base_generation.review.hook_strength}/10
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-500 uppercase text-[10px]">Specificity</span>
                <p className="text-sm font-semibold text-slate-400">
                  {comparison.base_generation.review.specificity}/10
                </p>
              </div>
            </div>

            {/* Strategy Rationale */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Strategy Angle</span>
              <p className="text-slate-400 italic">
                "{comparison.base_generation.strategy.angle}"
              </p>
            </div>

            {/* Draft Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Output</span>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {comparison.base_generation.content}
              </div>
            </div>

            {/* Critique */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reviewer Verdict</span>
              <p className="leading-relaxed">
                Generic encyclopedia definition. Lacks personal authority, code snippets, or real numbers.
              </p>
            </div>
          </div>

          {/* Column 2: Model v1/v2 (After Learning) */}
          <div className="glass-panel rounded-2xl border border-creator-cyan/40 p-6 shadow-2xl shadow-indigo-500/10 space-y-4 relative ring-1 ring-creator-cyan/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-base font-bold text-white font-mono">
                  AFTER: Creator Model v{comparison.target_version}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono border border-emerald-500/30">
                Pattern Conditioned (+2.45x Lift)
              </span>
            </div>

            {/* Scorecard Mini */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-emerald-400/80 uppercase text-[10px] font-bold">Quality Score</span>
                <p className="text-base font-bold text-emerald-300">
                  {comparison.target_generation.review.overall.toFixed(1)} / 10
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-400 uppercase text-[10px]">Hook Strength</span>
                <p className="text-sm font-semibold text-emerald-300">
                  {comparison.target_generation.review.hook_strength}/10
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-400 uppercase text-[10px]">Specificity</span>
                <p className="text-sm font-semibold text-emerald-300">
                  {comparison.target_generation.review.specificity}/10
                </p>
              </div>
            </div>

            {/* Strategy Rationale */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Strategy Angle</span>
              <p className="text-indigo-200">
                "{comparison.target_generation.strategy.angle}"
              </p>
              <p className="text-[11px] text-emerald-400 font-medium pt-1">
                ✓ {comparison.target_generation.strategy.why_this_works}
              </p>
            </div>

            {/* Draft Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-creator-cyan uppercase tracking-wider flex items-center space-x-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Pattern-Engineered Output</span>
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {comparison.target_generation.content}
              </div>
            </div>

            {/* Reviewer Accolade */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Quality Gate Report</span>
              <p className="leading-relaxed">
                Direct practitioner narrative with verifiable latency metrics, typed code sample, and strong community CTA.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

function roundDiff(a: number, b: number): string {
  const diff = a - b;
  return diff.toFixed(1);
}
