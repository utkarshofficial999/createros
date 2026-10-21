import React from 'react';
import { Pattern } from '../lib/api';
import { TrendingUp, TrendingDown, Target, ShieldCheck } from 'lucide-react';

interface PatternCardProps {
  pattern: Pattern;
  type: 'winning' | 'losing';
}

export const PatternCard: React.FC<PatternCardProps> = ({ pattern, type }) => {
  const isWinning = type === 'winning';

  return (
    <div className={`rounded-xl p-4 border transition-all duration-200 glass-panel-hover ${
      isWinning
        ? 'bg-slate-900/70 border-emerald-500/20 hover:border-emerald-500/40'
        : 'bg-slate-900/70 border-rose-500/20 hover:border-rose-500/40'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isWinning ? (
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          )}
          <span className="font-semibold text-xs text-white">
            {pattern.feature}
          </span>
        </div>

        {/* Lift Badge */}
        <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-extrabold ${
          isWinning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
        }`}>
          {pattern.lift > 1 ? `+${pattern.lift}x Lift` : `${pattern.lift}x Penalty`}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {pattern.description}
      </p>

      {/* Stats Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Target className="w-3.5 h-3.5 text-slate-500" />
          <span>Sample: <strong className="text-slate-200">n = {pattern.n}</strong></span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Confidence:</span>
          <div className="flex items-center space-x-1">
            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${isWinning ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${pattern.confidence * 100}%` }}
              />
            </div>
            <span className="text-slate-200 font-bold">{Math.round(pattern.confidence * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
