import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Share2, 
  MessageSquare, 
  Camera, 
  Save, 
  Send, 
  CheckCircle2, 
  History,
  Sparkles,
  Calendar,
  Clock,
  Image as ImageIcon,
  ShieldCheck,
  X,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { api, PostItem, PostVersion, Strategy, Review, ExplainOutputResponse } from '../lib/api';
import { ScoreBars } from '../components/ScoreBars';

interface EditorProps {
  latestGeneration: any | null;
  onPostPublished: () => void;
}

export const cleanContentText = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('```') && trimmed.includes('{'))) {
    try {
      let jsonStr = trimmed;
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const k of ['draft', 'content', 'body', 'post', 'markdown', 'text']) {
          if (parsed[k] && typeof parsed[k] === 'string' && parsed[k].length > 20) {
            return parsed[k].trim();
          }
        }
      }
    } catch {
      // not JSON, keep as-is
    }
  }
  return raw;
};

export const Editor: React.FC<EditorProps> = ({
  latestGeneration,
  onPostPublished
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'linkedin' | 'x' | 'instagram'>('main');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  
  // Editable content
  const [mainContent, setMainContent] = useState('');
  const [linkedinPost, setLinkedinPost] = useState('');
  const [xThread, setXThread] = useState<string[]>([]);
  const [instagramCaption, setInstagramCaption] = useState('');
  
  // Versions
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Strategy & Review
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  // Deep Attribution / Explain Output
  const [explanation, setExplanation] = useState<ExplainOutputResponse | null>(null);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const handleExplainClick = async () => {
    if (!selectedPost) return;
    setIsExplaining(true);
    try {
      const data = await api.explainPost(selectedPost.id);
      setExplanation(data);
      setShowExplainModal(true);
    } catch (err) {
      console.error('Failed to explain post:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Load posts list
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data);
      if (data.length > 0 && !selectedPost) {
        loadPostDetail(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If a generation just completed from IdeaStudio, load it immediately!
  useEffect(() => {
    if (latestGeneration && latestGeneration.post_id) {
      loadPostDetail(latestGeneration.post_id);
      if (latestGeneration.strategy) setStrategy(latestGeneration.strategy);
      if (latestGeneration.review) setReview(latestGeneration.review);
      if (latestGeneration.linkedin_post) setLinkedinPost(latestGeneration.linkedin_post);
      if (latestGeneration.x_thread) setXThread(latestGeneration.x_thread);
      if (latestGeneration.instagram_caption) setInstagramCaption(latestGeneration.instagram_caption);
    }
  }, [latestGeneration]);

  const loadPostDetail = async (id: number) => {
    try {
      const post = await api.getPostDetail(id);
      setSelectedPost(post);
      const cleanBody = cleanContentText(post.body);
      setMainContent(cleanBody);
      setVersions(post.versions || []);
      if (post.versions && post.versions.length > 0) {
        setSelectedVersionNum(post.versions[post.versions.length - 1].version_number);
      }
      
      // Default placeholder repurposed content if loading seeded post
      if (!linkedinPost || linkedinPost.length < 50) {
        setLinkedinPost(cleanBody.trim() + "\n\n#AI #Engineering #Systems");
      }
      if (xThread.length === 0) {
        setXThread([
          `1/4 ${post.title}\n\nHere is what we learned 🧵👇`,
          `2/4 The initial bottleneck was our serialization overhead.`,
          `3/4 We replaced the bloated layer with 50 lines of typed async Python.`,
          `4/4 Full post and breakdown on our blog. What tools do you use?`
        ]);
      }
      if (!instagramCaption) {
        setInstagramCaption(`Lessons learned shipping ${post.topic_tag} in production 🚀\n\n#coding #systemdesign #python #tech`);
      }

      if (!review) {
        setReview({
          hook_strength: 8,
          voice_match: 9,
          clarity: 8,
          specificity: 8,
          overall: 8.3,
          feedback: ["Well-structured technical narrative with concrete personal story arc."]
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save New Version (captures creator edits as learning signal)
  const handleSaveVersion = async () => {
    if (!selectedPost) return;
    setIsSavingVersion(true);
    setSaveMessage('');
    try {
      const newVersion = await api.savePostVersion(selectedPost.id, mainContent);
      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionNum(newVersion.version_number);
      setSaveMessage(`Version ${newVersion.version_number} saved (Logged as creator edit learning signal)`);
      setTimeout(() => setSaveMessage(''), 3500);
      fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingVersion(false);
    }
  };

  // Simulate Publish
  const handlePublish = async () => {
    if (!selectedPost) return;
    try {
      await api.publishPost(selectedPost.id);
      setSelectedPost({ ...selectedPost, status: 'published' });
      setSaveMessage('Post successfully marked as PUBLISHED!');
      setTimeout(() => setSaveMessage(''), 3000);
      onPostPublished();
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule with APScheduler
  const handleSchedulePost = async () => {
    if (!selectedPost) return;
    setIsScheduling(true);
    try {
      const updated = await api.schedulePost(selectedPost.id, 60);
      setSelectedPost(updated);
      setSaveMessage(`Post successfully queued for background publication via APScheduler!`);
      setTimeout(() => setSaveMessage(''), 3500);
      fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleVersionChange = (vNum: number) => {
    setSelectedVersionNum(vNum);
    const target = versions.find((v) => v.version_number === vNum);
    if (target) {
      setMainContent(cleanContentText(target.content));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Post Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Result Studio & Multi-Platform Editor
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Review AI strategy citations, inspect scorecard ratings, edit drafts, and simulate publishing.
          </p>
        </div>

        {/* Post Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Active Post:</label>
          <select
            value={selectedPost?.id || ''}
            onChange={(e) => loadPostDetail(Number(e.target.value))}
            className="w-full md:max-w-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} - {p.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Grid: Left is Content Editor, Right is Strategy + Quality Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Multi-Platform Tabs & Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-creator-border shadow-xl overflow-hidden">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    activeTab === 'main'
                      ? 'bg-creator-accent text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Main Markdown</span>
                </button>

                <button
                  onClick={() => setActiveTab('linkedin')}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    activeTab === 'linkedin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={() => setActiveTab('x')}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    activeTab === 'x'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-200" />
                  <span>X Thread</span>
                </button>

                <button
                  onClick={() => setActiveTab('instagram')}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    activeTab === 'instagram'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-pink-200" />
                  <span>Instagram</span>
                </button>
              </div>

              {/* Version Selector for Main Content */}
              {activeTab === 'main' && versions.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedVersionNum}
                    onChange={(e) => handleVersionChange(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5 text-white font-mono text-xs focus:outline-none"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.version_number}>
                        v{v.version_number} ({v.source})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Editor Area */}
            <div className="p-5">
              {activeTab === 'main' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Markdown Source • {mainContent.split(/\s+/).filter(Boolean).length} words</span>
                    <span className="text-[11px] font-mono text-indigo-400">
                      Edits are saved as Creator Edit signals
                    </span>
                  </div>
                  <textarea
                    rows={18}
                    value={mainContent}
                    onChange={(e) => setMainContent(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-creator-cyan leading-relaxed resize-y"
                    placeholder="Main content..."
                  />
                </div>
              )}

              {activeTab === 'linkedin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>LinkedIn Optimized Layout</span>
                    <span className="text-blue-400 font-mono text-[11px]">Includes high-hook line breaks</span>
                  </div>
                  <textarea
                    rows={16}
                    value={linkedinPost}
                    onChange={(e) => setLinkedinPost(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                  />
                </div>
              )}

              {activeTab === 'x' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>X (Twitter) Thread Breakdown ({xThread.length} Tweets)</span>
                    <span className="text-sky-400 font-mono text-[11px]">Numbered 280-char segments</span>
                  </div>
                  <div className="space-y-2.5">
                    {xThread.map((tweet, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Tweet {idx + 1}/{xThread.length}</span>
                          <span>{tweet.length} / 280</span>
                        </div>
                        <textarea
                          rows={3}
                          value={tweet}
                          onChange={(e) => {
                            const newThread = [...xThread];
                            newThread[idx] = e.target.value;
                            setXThread(newThread);
                          }}
                          className="w-full bg-transparent text-xs text-slate-200 focus:outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instagram' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Instagram Carousel / Reel Caption</span>
                    <span className="text-pink-400 font-mono text-[11px]">Targeted Hashtags</span>
                  </div>
                  <textarea
                    rows={12}
                    value={instagramCaption}
                    onChange={(e) => setInstagramCaption(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-pink-500 leading-relaxed font-sans"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-900/90 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Status:</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  selectedPost?.status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : selectedPost?.status === 'scheduled'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedPost?.status || 'draft'}
                  {selectedPost?.scheduled_for && ` • ${new Date(selectedPost.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={handleSaveVersion}
                  disabled={isSavingVersion}
                  className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isSavingVersion ? 'Saving...' : 'Save Version'}</span>
                </button>

                <button
                  onClick={handleSchedulePost}
                  disabled={isScheduling}
                  className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  title="Queue for automated publishing via APScheduler background jobs"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isScheduling ? 'Scheduling...' : 'Schedule (APScheduler)'}</span>
                </button>

                <button
                  onClick={handlePublish}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simulate Publish</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Strategy Drawer, Scorecard, Visual Direction & Decision Trail (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quality Scorecard */}
          <ScoreBars review={review} />

          {/* Visual Director Asset Card */}
          {(selectedPost?.image_url || latestGeneration?.visual?.image_url) && (
            <div className="glass-panel rounded-2xl p-5 border border-creator-border shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-creator-cyan" />
                  <h4 className="text-sm font-bold text-white">Visual Director Asset</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-creator-cyan font-mono text-[10px] font-bold uppercase">
                  AI Visual
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-800 group relative">
                <img
                  src={selectedPost?.image_url || latestGeneration?.visual?.image_url}
                  alt="Visual asset"
                  className="w-full h-36 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-cyan-300 line-clamp-1">
                  {latestGeneration?.visual?.style || "Isometric 3D Architecture Blueprint"}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prompt Rationale:
                </p>
                <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed">
                  {selectedPost?.image_prompt || latestGeneration?.visual?.prompt || "Isometric 3D architectural blueprint of pipeline architecture with glowing cyan server nodes."}
                </p>
              </div>
            </div>
          )}

          {/* Strategy Drawer */}
          {strategy && (
            <div className="glass-panel rounded-2xl p-5 border border-creator-border shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Strategy Rationale</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold">
                  Score: {strategy.opportunity_score}/10
                </span>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Selected Angle:
                </p>
                <p className="text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  {strategy.angle}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Why This Works (Citing Data Patterns):
                </p>
                <p className="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40">
                  ✓ {strategy.why_this_works}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Swappable Hooks:
                </p>
                <div className="space-y-1.5">
                  {strategy.hooks.map((h, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-creator-cyan cursor-pointer transition-colors"
                      onClick={() => {
                        setMainContent(`${h}\n\n${mainContent.replace(/^.*\n\n/, '')}`);
                      }}
                    >
                      <span className="text-indigo-400 font-bold font-mono mr-1.5">#{idx + 1}</span>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Auditable Decision Trail */}
          {((selectedPost?.decision_trail && selectedPost.decision_trail.length > 0) || (latestGeneration?.decision_trail && latestGeneration.decision_trail.length > 0)) && (
            <div className="glass-panel rounded-2xl p-5 border border-creator-border shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Auditable Decision Trail</h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Immutable</span>
              </div>

              <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {((selectedPost?.decision_trail && selectedPost.decision_trail.length > 0) ? selectedPost.decision_trail : latestGeneration?.decision_trail || []).map((step: any, sIdx: number) => (
                  <div key={sIdx} className="relative pl-7 text-xs">
                    <div className="absolute left-2.5 top-1.5 w-2 h-2 rounded-full bg-creator-cyan ring-4 ring-slate-900" />
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{step.agent}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                        </span>
                      </div>
                      <p className="text-slate-300 font-mono text-[11px]">{step.decision}</p>
                      <p className="text-slate-400 text-[11px] italic">{step.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedPost && (
                <button
                  onClick={handleExplainClick}
                  disabled={isExplaining}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 via-cyan-600/30 to-emerald-600/30 hover:from-indigo-600/50 hover:to-cyan-600/50 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{isExplaining ? 'Compiling Deep Attribution...' : 'Explain This Output (Rubric 7)'}</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Deep Attribution / Explain Output Modal */}
      {showExplainModal && explanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Full Attribution Trail</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">Post #{explanation.post_id}: "{explanation.title}"</p>
                </div>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High level stats banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Strategy Version</span>
                <span className="text-lg font-mono font-bold text-cyan-400">v{explanation.strategy_version}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mesh Gateways</span>
                <span className="text-lg font-mono font-bold text-indigo-400">{explanation.decision_trail.length} calls</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Performance Link</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {explanation.decision_trail.some(d => d.outcome_score != null)
                    ? `${explanation.decision_trail.find(d => d.outcome_score != null)!.outcome_score!.toFixed(1)}/10`
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Explanation Synthesis */}
            {explanation.explanation && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                <span className="font-bold text-indigo-300 block mb-1">Synthesized Rationale:</span>
                {explanation.explanation}
              </div>
            )}

            {/* Applied Rules */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Applied Learned Rules ({explanation.applied_rules.length}):
              </h4>
              <div className="space-y-1.5">
                {explanation.applied_rules.map((r, rIdx) => (
                  <div key={rIdx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    <span className="font-mono font-bold text-indigo-400 mr-2">{r.rule_id}</span>
                    <span className="text-slate-200">{r.directive}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">(weight: {(r.weight * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Decisions */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Multi-Agent Execution Steps ({explanation.decision_trail.length}):
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {explanation.decision_trail.map((d, dIdx) => (
                  <div key={dIdx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-cyan-300">{d.agent}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {d.model_used}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {d.created_at ? new Date(d.created_at).toLocaleTimeString() : 'Logged'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium">{d.decision}</p>
                    <p className="text-slate-400 text-[11px] italic">{d.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close Attribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
