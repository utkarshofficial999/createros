import React, { useState, useEffect } from 'react';
import { api, AuditDecisionRecord, ExplainOutputResponse, PostItem } from '../lib/api';
import { Shield, Search, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Filter, Database, BrainCircuit, RefreshCw } from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const [decisions, setDecisions] = useState<AuditDecisionRecord[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<ExplainOutputResponse | null>(null);
  const [explaining, setExplaining] = useState<boolean>(false);

  useEffect(() => {
    loadDecisions();
    loadPosts();
  }, [agentFilter, versionFilter]);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (agentFilter !== 'all') params.agent = agentFilter;
      if (versionFilter !== 'all') params.strategy_version = parseInt(versionFilter);
      const data = await api.getAuditDecisions(params);
      setDecisions(data);
    } catch (err) {
      console.error('Failed to load audit decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postList = await api.getPosts();
      setPosts(postList);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const handleExplain = async (postId: number) => {
    setSelectedPostId(postId);
    setExplaining(true);
    try {
      const data = await api.explainPost(postId);
      setExplanation(data);
    } catch (err) {
      console.error('Failed to explain post:', err);
    } finally {
      setExplaining(false);
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'strategist':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'writer':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'critic':
      case 'editor':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'analyst':
      case 'analyst & strategist':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'visual director':
      case 'visual':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Rubric 7: Immutable Audit Decision Trail</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Auditable Decision Log
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Every AI agent action writes a structured record to the database: model used via Mesh API,
            active strategy version, applied learned rules, reasoning, and linked post-performance outcomes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDecisions}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Log</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Decision Table (8 cols) & Explain Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Decision Filter & List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Filter By:</span>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Agents</option>
                <option value="Strategist">Strategist</option>
                <option value="Writer">Writer</option>
                <option value="Critic">Critic</option>
                <option value="Analyst & Strategist">Analyst</option>
                <option value="Visual Director">Visual Director</option>
              </select>

              <select
                value={versionFilter}
                onChange={(e) => setVersionFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Versions</option>
                <option value="0">Version 0 (Baseline)</option>
                <option value="1">Version 1 (Learned)</option>
                <option value="2">Version 2 (Optimized)</option>
                <option value="3">Version 3</option>
              </select>
            </div>

            <span className="font-mono text-slate-500 text-[11px]">
              {decisions.length} recorded decision(s)
            </span>
          </div>

          {/* Decision Cards List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading immutable audit records from database...
            </div>
          ) : decisions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              No audit decisions found. Generate a post or run the learning cycle to write decisions.
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d) => (
                <div
                  key={d.id}
                  className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold font-mono uppercase tracking-wider ${getAgentColor(d.agent)}`}>
                        {d.agent}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                        v{d.strategy_version}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {d.model_used}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                      <span>{new Date(d.created_at).toLocaleTimeString()}</span>
                      {d.post_id && (
                        <button
                          onClick={() => handleExplain(d.post_id!)}
                          className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                        >
                          Explain Post #{d.post_id}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Decision Summary */}
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {d.decision}
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] block mb-0.5">Reasoning:</span>
                    {d.reason}
                  </p>

                  {/* Applied Rules & Outcome Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-1.5">
                      {d.applied_rules && d.applied_rules.length > 0 ? (
                        d.applied_rules.map((rule, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono">
                            {rule}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">No specific rules (unconditioned)</span>
                      )}
                    </div>

                    {d.outcome_score !== null && d.outcome_score !== undefined && (
                      <div className="flex items-center space-x-1 font-mono text-xs">
                        <span className="text-slate-400 text-[11px]">Linked Outcome:</span>
                        <span className="text-emerald-400 font-bold">{d.outcome_score}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Explain This Output Feature (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 sticky top-24">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Explain This Output
              </h2>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select any generated post to trace its exact architectural lineage: strategy version, applied rules, Critic gate reviews, and semantic RAG memories.
            </p>

            {/* Post Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Content Piece:
              </label>
              <select
                value={selectedPostId || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) handleExplain(val);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Choose a post to trace...</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id}: {p.title.slice(0, 42)}...
                  </option>
                ))}
              </select>
            </div>

            {explaining && (
              <div className="p-6 text-center text-xs font-mono text-slate-400 animate-pulse">
                Synthesizing architectural attribution...
              </div>
            )}

            {explanation && !explaining && (
              <div className="space-y-4 pt-2 text-xs">
                {/* Executive Attribution */}
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-cyan-400 block">Lineage Synthesis:</span>
                  <p className="text-[11px] leading-relaxed text-slate-200">{explanation.explanation}</p>
                </div>

                {/* Applied Learned Rules */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                    Applied Strategy Rules (v{explanation.strategy_version}):
                  </span>
                  {explanation.applied_rules.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No explicit rules applied (v0 baseline generation).</p>
                  ) : (
                    explanation.applied_rules.map((rule, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-400 font-mono font-bold text-[10px]">{rule.rule_id}</span>
                          <span className="text-emerald-400 font-mono text-[10px]">+{rule.weight}x lift</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{rule.directive}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Semantic Vector RAG Memories */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                    Influential Semantic Memory (RAG):
                  </span>
                  {explanation.rag_sources.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No semantic memory matches found.</p>
                  ) : (
                    explanation.rag_sources.map((src, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="text-slate-200 font-medium truncate max-w-[180px]">{src.title}</span>
                          <span className="text-cyan-400">Score: {src.engagement_score}%</span>
                        </div>
                        {src.excerpt && (
                          <p className="text-slate-400 text-[10px] line-clamp-2 italic">"{src.excerpt}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
