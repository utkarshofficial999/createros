import React from 'react';
import { ModelRecord } from '../lib/api';
import { GitCommit, Clock, Check, Sparkles } from 'lucide-react';

interface ModelTimelineProps {
  models: ModelRecord[];
  activeVersion: number;
  onSelectVersion: (version: number) => void;
}

export const ModelTimeline: React.FC<ModelTimelineProps> = ({
  models,
  activeVersion,
  onSelectVersion,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-creator-border shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-5 h-5 text-creator-cyan" />
          <h4 className="text-sm font-bold text-white tracking-wide">
            Model Version Evolution
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {models.length} Versions Recorded
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {models.map((m) => {
          const isSelected = m.version === activeVersion;
          return (
            <div
              key={m.id}
              onClick={() => onSelectVersion(m.version)}
              className={`relative cursor-pointer transition-all duration-200 group`}
            >
              {/* Dot */}
              <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                isSelected
                  ? 'bg-creator-cyan border-white shadow-md shadow-creator-cyan/50 scale-110'
                  : 'bg-slate-900 border-slate-700 group-hover:border-indigo-400'
              }`} />

              <div className={`p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-800/90 border-creator-cyan/50 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-white">
                      Creator Model v{m.version}
                    </span>
                    {m.version === 0 ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Default Baseline
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Learned Strategy
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono">
                  <span>Grounding: <strong>{m.based_on_n_posts} posts</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span>Confidence: <strong>{Math.round(m.model.overall_confidence * 100)}%</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span>Patterns: <strong>{m.model.winning_patterns.length} win</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
