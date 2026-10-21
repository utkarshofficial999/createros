import React from 'react';
import { Review } from '../lib/api';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ScoreBarsProps {
  review?: Review | null;
}

export const ScoreBars: React.FC<ScoreBarsProps> = ({ review }) => {
  if (!review) return null;

  const metrics = [
    { label: 'Hook Strength', score: review.hook_strength, desc: 'Attention capture and curiosity gap' },
    { label: 'Voice Match', score: review.voice_match, desc: 'Authentic practitioner tone vs AI clichés' },
    { label: 'Clarity', score: review.clarity, desc: 'Crisp, unambiguous message structure' },
    { label: 'Specificity', score: review.specificity, desc: 'Concrete numbers, architecture & code' },
  ];

  const isPassing = review.overall >= 7.5;

  const getColor = (val: number) => {
    if (val >= 8) return 'bg-emerald-500 text-emerald-400';
    if (val >= 7) return 'bg-indigo-500 text-indigo-400';
    if (val >= 6) return 'bg-amber-500 text-amber-400';
    return 'bg-rose-500 text-rose-400';
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-creator-border shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          {isPassing ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <h4 className="text-sm font-bold text-white tracking-wide">
            Quality Gate Scorecard
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Overall:</span>
          <span className={`px-2.5 py-1 rounded-lg text-sm font-extrabold font-mono ${
            isPassing ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {review.overall.toFixed(1)} / 10
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">{m.label}</span>
              <span className="font-mono font-bold text-slate-300">{m.score}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getColor(m.score).split(' ')[0]}`}
                style={{ width: `${(m.score / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Reviewer Feedback Notes */}
      {review.feedback && review.feedback.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Reviewer Critique & Polish:
          </p>
          <ul className="space-y-1.5">
            {review.feedback.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                <span className="text-creator-cyan font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
