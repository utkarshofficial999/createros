import React, { useState } from 'react';
import { 
  Network, 
  Cpu, 
  Database, 
  Sparkles, 
  PenTool, 
  ShieldCheck, 
  Image as ImageIcon, 
  Share2, 
  Clock, 
  BarChart3, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Code2, 
  Sliders, 
  Zap,
  Activity,
  Server,
  Lock,
  GitBranch
} from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  type: 'agent' | 'datastore' | 'engine' | 'scheduler';
  description: string;
  inputs: string[];
  outputs: string[];
  formulaOrRule?: string;
  codeSnippet?: string;
}

export const Architecture: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('strategist');

  const nodes: AgentNode[] = [
    {
      id: 'pinecone',
      name: 'Pinecone Vector DB (RAG)',
      role: 'Semantic Vector Memory',
      type: 'datastore',
      description: 'Serverless vector database indexing past published posts as 1024-dimensional semantic embeddings. Queries top-k semantically relevant winning posts to ground the Strategist in proven creator patterns.',
      inputs: ['Topic query string', 'Top-k semantic similarity parameter (default k=2)'],
      outputs: ['Top-k historical posts with engagement scores and extracted feature vectors'],
      formulaOrRule: 'Cosine Similarity: cos(θ) = (A · B) / (||A|| ||B||)',
      codeSnippet: `from pinecone import Pinecone\npc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))\nindex = pc.Index("creatoros-posts")\nmatches = index.query(vector=topic_embedding, top_k=2, include_metadata=True)`
    },
    {
      id: 'strategist',
      name: '1. Strategist Agent',
      role: 'Angle & Angle Opportunity Scoring',
      type: 'agent',
      description: 'Analyzes user brief, audience profile, and semantically similar high-lift posts from Pinecone. Formulates optimal angles, 3 swappable hooks, content structure, and cites active statistical lift from the Creator Model.',
      inputs: ['User topic & brief', 'Creator voice profile', 'Pinecone RAG context', 'Active Creator Model (v0/v1/v2)'],
      outputs: ['Strategy JSON: angle, 3 hooks, structure outline, why_this_works, opportunity_score (1-10)'],
      formulaOrRule: 'Opportunity Score = min(10.0, Base Score (7.0) + (Lift - 1.0) * 1.5)',
      codeSnippet: `class Strategy(BaseModel):\n    angle: str\n    hooks: List[str]\n    format: str\n    structure: List[str]\n    why_this_works: str\n    opportunity_score: float`
    },
    {
      id: 'writer',
      name: '2. Writer Agent',
      role: 'Platform-Native Drafting',
      type: 'agent',
      description: 'Composes long-form platform native drafts adhering to creator tone, chosen hook, and outline. Employs battle-tested patterns (personal story openings, concrete benchmarks, and real code snippets).',
      inputs: ['Strategy angle & hook', 'Structure outline', 'Creator voice guidelines', 'Reviewer feedback (if on retry loop)'],
      outputs: ['Complete long-form technical draft in Markdown format with extracted metadata'],
      formulaOrRule: 'Target length: 800-1200 words for deep-dive authority pieces.',
      codeSnippet: `writer_prompt = f"Topic: {topic}\\nAngle: {strategy.angle}\\nHook: {chosen_hook}\\nVoice: {voice}"\nif feedback:\n    writer_prompt += f"\\nFix previous critique: {feedback}"`
    },
    {
      id: 'editor',
      name: '3. Quality Gate (Editor Agent)',
      role: 'Deterministic Rubric Critique',
      type: 'agent',
      description: 'Rigorous critique agent evaluating drafts on 4 objective axes: Hook Strength, Voice Match, Clarity, and Specificity. If overall score is < 7.5, rejects the draft and compels Writer to revise with structured critique.',
      inputs: ['Draft content', 'Target goal', 'Topic brief'],
      outputs: ['Review JSON: hook_strength, voice_match, clarity, specificity, overall (1-10), feedback[], passed (bool)'],
      formulaOrRule: 'Quality Gate Rule: Overall Score >= 7.5 ? PASS : RETRY (max 1 automatic revision loop)',
      codeSnippet: `class Review(BaseModel):\n    hook_strength: int\n    voice_match: int\n    clarity: int\n    specificity: int\n    overall: float\n    feedback: List[str]\n    passed: bool`
    },
    {
      id: 'visual',
      name: '4. Visual Director Agent',
      role: 'Stopping-Power Visual Asset Synthesis',
      type: 'agent',
      description: 'Formulates matching 3D isometric blueprint prompts and visual stopping-power rationale tailored to technical social feeds, delivering visual authority alongside written content.',
      inputs: ['Draft topic', 'Strategy angle', 'Chosen hook', 'Target platform'],
      outputs: ['VisualDirection JSON: prompt, style, visual_rationale, image_url'],
      formulaOrRule: 'Style standard: Isometric 3D architectural render with glowing server nodes and dark glass.',
      codeSnippet: `class VisualDirection(BaseModel):\n    prompt: str\n    style: str\n    visual_rationale: str\n    image_url: str`
    },
    {
      id: 'repurposer',
      name: '5. Multi-Platform Repurposer',
      role: 'Parallel Cross-Format Distribution',
      type: 'agent',
      description: 'Transforms verified piece into 3 native platform formats: LinkedIn post with high-converting line breaks, numbered X (Twitter) thread with 280-char limits, and Instagram caption with targeted hashtags.',
      inputs: ['Approved long-form draft', 'Platform target'],
      outputs: ['RepurposedContent JSON: linkedin_post, x_thread (list of strings), instagram_caption'],
      formulaOrRule: 'X Thread rule: Tweet 1 has hook + thread emoji, max 280 chars per segment.',
      codeSnippet: `class RepurposedContent(BaseModel):\n    linkedin_post: str\n    x_thread: List[str]\n    instagram_caption: str`
    },
    {
      id: 'scheduler',
      name: '6. Background Scheduler (APScheduler)',
      role: 'AsyncIO Background Queueing',
      type: 'scheduler',
      description: 'Non-blocking AsyncIOScheduler service in FastAPI. Enqueues posts for future publication windows, publishes them at the designated timestamp, generates simulated metrics, and syncs Pinecone.',
      inputs: ['post_id', 'target publication datetime'],
      outputs: ['Status transition to "published", auto-generated engagement metrics, Pinecone vector upsert'],
      formulaOrRule: 'APScheduler date trigger: run_date = now + timedelta(minutes=N)',
      codeSnippet: `scheduler.add_job(\n    publish_scheduled_post_job,\n    trigger="date",\n    run_date=run_at,\n    args=[post_id],\n    id=f"publish_post_{post_id}"\n)`
    },
    {
      id: 'stats',
      name: '7. Deterministic Stats Engine',
      role: 'Lift & Confidence Computation',
      type: 'engine',
      description: 'Mathematical engine calculating weighted engagement scores across posts and calculating feature lift multipliers and Bayesian confidence scores without black-box estimation.',
      inputs: ['Raw engagement signals: impressions, likes, comments, shares, saves, clicks'],
      outputs: ['Engagement score (%), feature lift multiplier, confidence (0.0 to 1.0), verdict (winning/losing)'],
      formulaOrRule: 'Engagement = (1*L + 4*C + 6*S + 5*V) / Impressions * 100\nLift = Group_Avg / Overall_Avg\nConfidence = 1.0 - (1.0 / sqrt(n))',
      codeSnippet: `def calculate_engagement_score(likes, comments, shares, saves, impressions):\n    weighted = (1.0 * likes) + (4.0 * comments) + (6.0 * shares) + (5.0 * saves)\n    return round((weighted / impressions) * 100.0, 2)\n\ndef compute_lift_and_confidence(group_avg, overall_avg, n):\n    lift = round(group_avg / overall_avg, 2)\n    confidence = round(1.0 - (1.0 / (n ** 0.5)), 2)\n    return {"lift": lift, "confidence": min(1.0, max(0.0, confidence))}`
    },
    {
      id: 'model',
      name: '8. Creator Model (v0 ➔ v1 ➔ v2)',
      role: 'Active Self-Improving Weights',
      type: 'engine',
      description: 'Persistent creator mental model stored in SQLite. Holds verified winning patterns, losing patterns, preferred topics, and voice rules. Injected into every Strategist and Writer run to close the learning loop.',
      inputs: ['Aggregated feature lift table from Stats Engine'],
      outputs: ['Updated Creator Model JSON record: winning_patterns[], losing_patterns[], voice, confidence'],
      formulaOrRule: 'Closed Loop: Performance Feedback -> Model Upgrade (v1 -> v2) -> Future Output Alignment',
      codeSnippet: `class CreatorModel(BaseModel):\n    winning_patterns: List[Pattern]\n    losing_patterns: List[Pattern]\n    voice: VoiceProfile\n    overall_confidence: float`
    }
  ];

  const activeNodeData = nodes.find(n => n.id === selectedNode) || nodes[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-creator-cyan mb-1.5">
            <Network className="w-4 h-4 shrink-0" />
            <span>Autonomous Multi-Agent System Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            CreatorOS Closed-Loop Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Specialized autonomous agents coordinated by a pipeline director, backed by Pinecone RAG semantic search, deterministic stats computation, and continuous model updating.
          </p>
        </div>

        {/* Live Infrastructure Status Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-500 dark:text-slate-400">Mesh API:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-emerald-400">Primary Gateway</span>
          </div>

          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500 dark:text-slate-400">Vector DB:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-cyan-300">Pinecone Serverless</span>
          </div>

          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-slate-500 dark:text-slate-400">Scheduler:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-indigo-300">APScheduler Async</span>
          </div>
        </div>
      </div>

      {/* Main Architecture Diagram Canvas */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-creator-border shadow-xl space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-indigo-600 dark:text-creator-cyan shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              End-to-End Orchestration Pipeline & Feedback Loop
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Click any component to inspect implementation schemas</span>
        </div>

        {/* Visual Pipeline Stage Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Phase 1: Strategic Grounding */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Phase 1: Grounding</span>
            </div>

            <div 
              onClick={() => setSelectedNode('pinecone')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'pinecone'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <Database className="w-4 h-4 text-cyan-600 dark:text-creator-cyan" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Pinecone Vector DB</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Top-k semantic RAG retrieval from 1024-d past post vectors.
              </p>
            </div>

            <div 
              onClick={() => setSelectedNode('strategist')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'strategist'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">1. Strategist Agent</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Selects angle, 3 hooks & cites Creator Model winning patterns.
              </p>
            </div>
          </div>

          {/* Phase 2: Drafting & Critique Loop */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Phase 2: Refinement</span>
            </div>

            <div 
              onClick={() => setSelectedNode('writer')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'writer'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">2. Writer Agent</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Drafts long-form piece adhering to tone and code examples.
              </p>
            </div>

            <div 
              onClick={() => setSelectedNode('editor')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'editor'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">3. Quality Gate (Editor)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Grades draft (Score &lt; 7.5 triggers automatic revision loop).
              </p>
            </div>
          </div>

          {/* Phase 3: Visual & Multi-Platform */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>Phase 3: Distribution</span>
            </div>

            <div 
              onClick={() => setSelectedNode('visual')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'visual'
                  ? 'bg-cyan-50/80 dark:bg-cyan-950/60 border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-creator-cyan" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">4. Visual Director</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Synthesizes isometric 3D visual prompt & stopping rationale.
              </p>
            </div>

            <div 
              onClick={() => setSelectedNode('repurposer')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'repurposer'
                  ? 'bg-cyan-50/80 dark:bg-cyan-950/60 border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <Share2 className="w-4 h-4 text-pink-500" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">5. Repurposer</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Parallel format adaptation (LinkedIn, X Thread, Instagram).
              </p>
            </div>
          </div>

          {/* Phase 4: Closed Loop Learning */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Phase 4: Feedback Loop</span>
            </div>

            <div 
              onClick={() => setSelectedNode('scheduler')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'scheduler'
                  ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-500 shadow-md ring-2 ring-purple-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">6. APScheduler</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Background asyncio publication queue & simulation triggers.
              </p>
            </div>

            <div 
              onClick={() => setSelectedNode('model')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNode === 'model'
                  ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-500 shadow-md ring-2 ring-purple-500/30'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">7. Active Creator Model</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Upgraded from analytics (v0 ➔ v1 ➔ v2) injected into next runs.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Deep-Dive Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Component Details (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 dark:border-creator-border shadow-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-5 h-5 text-indigo-600 dark:text-creator-cyan" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeNodeData.name}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                {activeNodeData.type}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeNodeData.description}
            </p>

            {/* Inputs & Outputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Input Contract:
                </span>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {activeNodeData.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Output Contract:
                </span>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {activeNodeData.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mathematical Rule / Law */}
            {activeNodeData.formulaOrRule && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Governing Math / Operational Rule:
                </span>
                <p className="font-mono text-xs text-indigo-900 dark:text-indigo-200 whitespace-pre-line leading-relaxed">
                  {activeNodeData.formulaOrRule}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right: Code Schema Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 dark:border-creator-border shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Production Python Schema
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Pydantic v2</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              <code>{activeNodeData.codeSnippet || '# Schema loaded dynamically from backend/app/schemas.py'}</code>
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
