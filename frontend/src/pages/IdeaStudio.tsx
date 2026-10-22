import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Send, 
  Target, 
  ArrowRight, 
  Flame, 
  CheckCircle,
  Cpu,
  Layers,
  Check,
  TrendingUp,
  Globe
} from 'lucide-react';
import { api, IdeaItem, ModelRecord } from '../lib/api';
import { ProgressStepper } from '../components/ProgressStepper';
import { useSSE } from '../hooks/useSSE';

interface IdeaStudioProps {
  activeModel: ModelRecord | null;
  onPostCreated: (postData: any) => void;
  onGoToEditor: () => void;
}

export const IdeaStudio: React.FC<IdeaStudioProps> = ({
  activeModel,
  onPostCreated,
  onGoToEditor
}) => {
  const [topic, setTopic] = useState('Production RAG Architecture and Hallucination Reduction');
  const [goal, setGoal] = useState('authority');
  const [platform, setPlatform] = useState('linkedin');
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null);

  const { stages, activeStage, isStreaming, startStream } = useSSE();

  // Load 5 ideas powered by Creator Model
  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const res = await api.generateIdeas(topic, goal, platform);
      setIdeas(res.ideas);
      if (res.ideas.length > 0) {
        setSelectedIdea(res.ideas[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Launch Full Autonomous Generation Pipeline
  const handleStartPipeline = async () => {
    try {
      const res = await api.startPipeline({
        topic: selectedIdea ? selectedIdea.title : topic,
        goal,
        platform,
        selected_hook: selectedIdea?.hook_preview,
        model_version: activeModel?.version
      });

      startStream(api.streamPipelineUrl(res.run_id), (doneData) => {
        onPostCreated(doneData);
        setTimeout(() => {
          onGoToEditor();
        }, 1200);
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Idea Studio • Conditioned on Model v{activeModel?.version || 1}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Generate High-Performance Ideas & Drafts
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every suggestion cites verified statistical lift patterns from your analytics history and grounds strategy in Pinecone vector memory.
          </p>
        </div>

        {activeModel && (
          <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                Active Creator Model: v{activeModel.version}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {activeModel.model.winning_patterns.length} winning patterns active
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Input Control Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 dark:border-creator-border shadow-xl space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Topic */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Core Topic / Domain</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI Agents, Distributed Workers, Production RAG..."
              className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Goal */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Content Goal</span>
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="growth">Audience Growth & Reach</option>
              <option value="authority">Technical Authority & Depth</option>
              <option value="conversion">Product & Newsletter Signups</option>
              <option value="viral">Contrarian / High-Engagement</option>
            </select>
          </div>

          {/* Platform */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span>Primary Platform</span>
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="linkedin">LinkedIn (Professional Post)</option>
              <option value="x">X / Twitter (Thread Focus)</option>
              <option value="instagram">Instagram (Carousel / Visual)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-200/80 dark:border-slate-800">
          <button
            onClick={handleGenerateIdeas}
            disabled={isGeneratingIdeas || isStreaming}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-semibold text-xs transition-all shadow-sm hover:border-slate-300 disabled:opacity-50"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>{isGeneratingIdeas ? 'Synthesizing Ideas...' : 'Generate 5 Ideas via Creator Model'}</span>
          </button>

          <button
            onClick={handleStartPipeline}
            disabled={isStreaming}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Launch Autonomous Pipeline (SSE Stream)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* SSE Progress Stepper */}
      {(isStreaming || stages.length > 0) && (
        <ProgressStepper
          stages={stages}
          activeStage={activeStage}
          isStreaming={isStreaming}
        />
      )}

      {/* 5 Generated Ideas Grid */}
      {ideas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                5 Ideas Filtered by Creator Model v{activeModel?.version || 1}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Click a card to select for pipeline generation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => {
              const isSelected = selectedIdea?.id === idea.id;
              return (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={`rounded-2xl p-5 border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-slate-800/90 border-indigo-500 dark:border-creator-cyan shadow-xl ring-2 ring-indigo-500/30'
                      : 'bg-white dark:glass-panel border-slate-200 dark:border-creator-border hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                        {idea.target_format}
                      </span>
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-200/60 dark:border-emerald-500/20">
                        <span>Score: {idea.predicted_score.toFixed(1)}%</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                      {idea.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                      {idea.angle}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono mb-3">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Hook: </span>
                      "{idea.hook_preview}"
                    </div>
                  </div>

                  {/* Why it works grounded in patterns */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate mr-2">
                      ✓ {idea.why_it_works}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-creator-cyan text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
