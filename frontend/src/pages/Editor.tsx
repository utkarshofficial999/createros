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
  Sparkles
} from 'lucide-react';
import { api, PostItem, PostVersion, Strategy, Review } from '../lib/api';
import { ScoreBars } from '../components/ScoreBars';

interface EditorProps {
  latestGeneration: any | null;
  onPostPublished: () => void;
}

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
  const [saveMessage, setSaveMessage] = useState('');

  // Strategy & Review
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [review, setReview] = useState<Review | null>(null);

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
      setMainContent(post.body);
      setVersions(post.versions || []);
      if (post.versions && post.versions.length > 0) {
        setSelectedVersionNum(post.versions[post.versions.length - 1].version_number);
      }
      
      // Default placeholder repurposed content if loading seeded post
      if (!linkedinPost || linkedinPost.length < 50) {
        setLinkedinPost(post.body.slice(0, 500) + "\n\n#AI #Engineering #Systems");
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

  const handleVersionChange = (vNum: number) => {
    setSelectedVersionNum(vNum);
    const target = versions.find((v) => v.version_number === vNum);
    if (target) {
      setMainContent(target.content);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Post Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Result Studio & Multi-Platform Editor
          </h1>
          <p className="text-xs text-slate-400">
            Review AI strategy citations, inspect scorecard ratings, edit drafts, and simulate publishing.
          </p>
        </div>

        {/* Post Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-medium">Active Post:</label>
          <select
            value={selectedPost?.id || ''}
            onChange={(e) => loadPostDetail(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white max-w-xs truncate focus:outline-none focus:border-creator-cyan"
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
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Grid: Left is Content Editor, Right is Strategy + Quality Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Multi-Platform Tabs & Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-2xl border border-creator-border shadow-xl overflow-hidden">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  selectedPost?.status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedPost?.status || 'draft'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveVersion}
                  disabled={isSavingVersion}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isSavingVersion ? 'Saving...' : 'Save New Version'}</span>
                </button>

                <button
                  onClick={handlePublish}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simulate Publish</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Strategy Drawer & Quality Scorecard (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quality Scorecard */}
          <ScoreBars review={review} />

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
                        // Prepend or swap in editor
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

        </div>

      </div>
    </div>
  );
};
