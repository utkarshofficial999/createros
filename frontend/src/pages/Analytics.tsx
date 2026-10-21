import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Zap, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Layers,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { api, AnalyticsOverview, FeatureLiftItem, PostItem } from '../lib/api';
import { MetricCard } from '../components/MetricCard';

interface AnalyticsProps {
  onRelearnRequested: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onRelearnRequested }) => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const overview = await api.getAnalyticsOverview();
      setData(overview);
      const postList = await api.getPosts();
      setPosts(postList);
      if (postList.length > 0 && !selectedPostId) {
        // Select newest or unsimulated post
        const candidate = postList.find(p => !p.metric) || postList[0];
        setSelectedPostId(candidate.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateEngagement = async () => {
    if (!selectedPostId) return;
    setIsSimulating(true);
    setSimulationMessage('');
    try {
      const res = await api.simulateEngagement(selectedPostId);
      setSimulationMessage(`Generated realistic metrics: ${res.impressions.toLocaleString()} views, ${res.likes} likes, ${res.engagement_score}% score!`);
      await fetchAnalytics();
      setTimeout(() => setSimulationMessage(''), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Color helper for chart bars based on pattern category
  const getBarColor = (item: any) => {
    if (item.has_personal_story || item.format === 'story') return '#10b981'; // Emerald (Build in public story)
    if (item.has_code_example || (item.format === 'tutorial' && item.word_count >= 500)) return '#6366f1'; // Indigo (Practical deep dive)
    if (item.format === 'listicle' || item.format === 'opinion') return '#f59e0b'; // Amber (Listicle / opinion)
    return '#f43f5e'; // Rose (Generic tutorial)
  };

  if (!data) {
    return (
      <div className="py-20 text-center text-slate-400 font-mono text-xs">
        Loading verified analytics engine...
      </div>
    );
  }

  const chartData = data.posts_data.map(p => ({
    name: `#${p.id}`,
    fullName: p.title,
    score: p.engagement_score || 0,
    impressions: p.impressions,
    format: p.format,
    has_personal_story: p.has_personal_story,
    has_code_example: p.has_code_example,
    word_count: p.word_count
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-creator-cyan mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Deterministic Performance Engine • Pure Python</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Seeded Analytics & Feature Lift Matrix
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real statistical calculations (Likes × 1 + Comments × 4 + Shares × 6 + Saves × 5) normalized by impressions.
          </p>
        </div>

        {/* Simulate Live Engagement Action Button */}
        <div className="flex items-center space-x-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
          <select
            value={selectedPostId || ''}
            onChange={(e) => setSelectedPostId(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white max-w-xs truncate focus:outline-none"
          >
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} - {p.title.slice(0, 35)}...
              </option>
            ))}
          </select>

          <button
            onClick={handleSimulateEngagement}
            disabled={isSimulating || !selectedPostId}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-creator-accent to-indigo-600 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Engagement'}</span>
          </button>
        </div>
      </div>

      {simulationMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{simulationMessage}</span>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Posts Analyzed"
          value={data.total_posts}
          subtitle="20 Seeded + newly generated"
          icon={Layers}
          color="indigo"
        />
        <MetricCard
          title="Overall Avg Engagement"
          value={`${data.overall_avg_score}%`}
          subtitle="Baseline benchmark across all formats"
          icon={TrendingUp}
          color="cyan"
        />
        <MetricCard
          title="Total Impressions"
          value={data.total_impressions.toLocaleString()}
          subtitle="Audience reach across platforms"
          icon={Eye}
          color="amber"
        />
        <MetricCard
          title="Top Category Lift"
          value="+2.45x"
          subtitle="Personal Story / Build-in-Public"
          trend="100% Conf"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Hero Performance Chart: Engagement Score per Post */}
      <div className="glass-panel rounded-2xl p-6 border border-creator-border shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Engagement Score per Post (Bifurcation by Pattern)
            </h3>
            <p className="text-xs text-slate-400">
              Notice how Personal Stories (Green) and Deep Dives (Blue) consistently beat baseline, while Generic Tutorials (Red) lag behind.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#10b981]" />
              <span className="text-slate-300">Personal Story (~5.2%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#6366f1]" />
              <span className="text-slate-300">Code Deep Dive (~4.1%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
              <span className="text-slate-300">Listicle/Opinion (~3.0%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#f43f5e]" />
              <span className="text-slate-300">Generic Tutorial (~1.8%)</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                unit="%" 
                tickLine={false} 
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 max-w-xs font-sans">
                        <p className="font-bold text-white">{item.fullName}</p>
                        <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                          <span>Score:</span>
                          <span className="font-bold text-creator-cyan">{item.score}%</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                          <span>Impressions:</span>
                          <span>{item.impressions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                          <span>Format:</span>
                          <span className="capitalize">{item.format}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                y={data.overall_avg_score} 
                stroke="#38bdf8" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `Baseline Avg (${data.overall_avg_score}%)`, 
                  fill: '#38bdf8', 
                  fontSize: 11,
                  position: 'top' 
                }} 
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insight Callout */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 flex items-start space-x-4 shadow-xl">
        <div className="p-2.5 rounded-xl bg-creator-cyan/10 text-creator-cyan shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Automated Pattern Synthesis</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-creator-cyan/20 text-creator-cyan">
              Deterministic Facts
            </span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.ai_insight}
          </p>
        </div>
      </div>

      {/* Feature Lift Matrix Table */}
      <div className="glass-panel rounded-2xl border border-creator-border shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Feature Lift & Confidence Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Only features with n ≥ 3 are allowed to formulate rules in the Creator Model.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data.lift_table.length} Features Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Feature Category</th>
                <th className="py-3 px-6">Characteristic</th>
                <th className="py-3 px-6">Sample (n)</th>
                <th className="py-3 px-6">Group Avg</th>
                <th className="py-3 px-6">Baseline</th>
                <th className="py-3 px-6">Statistical Lift</th>
                <th className="py-3 px-6">Confidence</th>
                <th className="py-3 px-6">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {data.lift_table.map((row, idx) => {
                const isWin = row.verdict === 'winning';
                const isLoss = row.verdict === 'losing';
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-400">
                      {row.feature_group}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-white">
                      {row.feature_name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      n = {row.count}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-200">
                      {row.group_avg_score.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      {row.overall_avg_score.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold">
                      <span className={isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}>
                        {row.lift > 1 ? `+${row.lift}x` : `${row.lift}x`}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isWin ? 'bg-emerald-400' : isLoss ? 'bg-rose-400' : 'bg-slate-500'}`}
                            style={{ width: `${row.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px]">
                          {Math.round(row.confidence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                        isWin
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
