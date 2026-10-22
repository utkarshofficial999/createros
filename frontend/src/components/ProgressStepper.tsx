import React from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { SSEStageEvent } from '../hooks/useSSE';

interface ProgressStepperProps {
  stages: SSEStageEvent[];
  activeStage: string | null;
  isStreaming: boolean;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  stages,
  activeStage,
  isStreaming
}) => {
  // Extract state per stage
  const strategyStage = stages.filter(s => s.stage === 'strategy').slice(-1)[0];
  const writingStages = stages.filter(s => s.stage === 'writing');
  const reviewStages = stages.filter(s => s.stage === 'review');
  const visualStage = stages.filter(s => s.stage === 'visual').slice(-1)[0];
  const repurposingStage = stages.filter(s => s.stage === 'repurposing').slice(-1)[0];

  const steps = [
    {
      id: 'strategy',
      title: '1. Strategist',
      desc: 'Formulates angle, 3 hooks & cites Creator Model patterns',
      isCurrent: activeStage === 'strategy',
      isDone: !!strategyStage && strategyStage.status === 'done',
      event: strategyStage,
    },
    {
      id: 'writing',
      title: '2. Writer',
      desc: 'Drafts long-form post adhering to tone and structure',
      isCurrent: activeStage === 'writing',
      isDone: writingStages.some(s => s.status === 'done'),
      event: writingStages.slice(-1)[0],
      attempts: writingStages.length,
    },
    {
      id: 'review',
      title: '3. Quality Gate',
      desc: 'Grades hook, voice, clarity & triggers retry if score < 7.5',
      isCurrent: activeStage === 'review',
      isDone: reviewStages.some(s => s.status === 'done' && (s.score || 0) >= 7.5),
      event: reviewStages.slice(-1)[0],
      reviews: reviewStages,
    },
    {
      id: 'visual',
      title: '4. Visual Director',
      desc: 'Formulates matching image prompt & visual stopping-power',
      isCurrent: activeStage === 'visual',
      isDone: !!visualStage && visualStage.status === 'done',
      event: visualStage,
    },
    {
      id: 'repurposing',
      title: '5. Repurposer',
      desc: 'Generates LinkedIn post, X thread & Instagram caption',
      isCurrent: activeStage === 'repurposing',
      isDone: !!repurposingStage && repurposingStage.status === 'done',
      event: repurposingStage,
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-2xl relative overflow-hidden">
      {/* Background glow when active */}
      {isStreaming && (
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-creator-accent/15 rounded-full blur-3xl pointer-events-none animate-glow" />
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-creator-cyan" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Autonomous Pipeline Progress
          </h3>
        </div>
        {isStreaming ? (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-creator-cyan" />
            <span>Streaming Generation...</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Ready</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
        {steps.map((step, idx) => {
          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-4 transition-all duration-300 border ${
                step.isCurrent
                  ? 'bg-slate-800/80 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : step.isDone
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900/30 border-slate-800/80 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                  {step.title}
                </span>
                {step.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : step.isCurrent ? (
                  <Loader2 className="w-4 h-4 text-creator-cyan animate-spin" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                {step.desc}
              </p>

              {/* Quality Gate Highlight for Reviewer */}
              {step.id === 'review' && step.reviews && step.reviews.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  {step.reviews.map((r, rIdx) => (
                    <div
                      key={rIdx}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg font-mono ${
                        (r.score || 0) >= 7.5
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        {(r.score || 0) < 7.5 ? (
                          <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Attempt {rIdx + 1}:</span>
                      </div>
                      <span className="font-bold">
                        {r.score?.toFixed(1)}/10
                        {(r.score || 0) < 7.5 && ' (Retrying...)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview info for Strategist */}
              {step.id === 'strategy' && step.event?.preview && (
                <div className="mt-2 text-[10px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/40 truncate">
                  <span className="font-semibold text-slate-400">Angle: </span>
                  {step.event.preview}
                </div>
              )}

              {/* Attempts counter for writer */}
              {step.id === 'writing' && step.attempts && step.attempts > 1 && (
                <div className="mt-2 text-[11px] text-amber-300 font-mono flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Revision #{step.attempts} incorporating feedback</span>
                </div>
              )}

              {/* Status pill */}
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Status</span>
                <span className={step.isDone ? 'text-emerald-400' : step.isCurrent ? 'text-creator-cyan' : 'text-slate-500'}>
                  {step.isDone ? 'COMPLETED' : step.isCurrent ? 'PROCESSING' : 'PENDING'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
