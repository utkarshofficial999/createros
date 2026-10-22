const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface Pattern {
  feature: string;
  description: string;
  lift: number;
  n: number;
  confidence: number;
}

export interface Voice {
  tone: string;
  sentence_length: string;
  hook_style: string;
  cta_style: string;
}

export interface CreatorModel {
  winning_patterns: Pattern[];
  losing_patterns: Pattern[];
  preferred_topics: string[];
  avoid_topics: string[];
  voice: Voice;
  best_length: string;
  recommendations: string[];
  overall_confidence: number;
}

export interface ModelRecord {
  id: number;
  version: number;
  based_on_n_posts: number;
  created_at: string;
  model: CreatorModel;
}

export interface CreatorProfile {
  id: number;
  name: string;
  niche: string;
  audience: string;
  tone: string;
  platforms: string[];
}

export interface IdeaItem {
  id: string;
  title: string;
  angle: string;
  target_format: string;
  predicted_score: number;
  why_it_works: string;
  hook_preview: string;
}

export interface Strategy {
  angle: string;
  hooks: string[];
  format: string;
  structure: string[];
  why_this_works: string;
  opportunity_score: number;
}

export interface Review {
  hook_strength: number;
  voice_match: number;
  clarity: number;
  specificity: number;
  overall: number;
  feedback: string[];
}

export interface MetricData {
  id: number;
  post_id: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_score: number;
  is_simulated: boolean;
}

export interface PostVersion {
  id: number;
  post_id: number;
  version_number: number;
  content: string;
  source: string;
  quality_score?: number;
  created_at: string;
}

export interface DecisionItem {
  agent: string;
  decision: string;
  reason: string;
  timestamp: string;
}

export interface PostItem {
  id: number;
  creator_id: number;
  title: string;
  topic_tag: string;
  platform: string;
  format: string;
  body: string;
  status: string;
  published_at?: string;
  scheduled_for?: string;
  image_url?: string;
  image_prompt?: string;
  decision_trail?: DecisionItem[];
  word_count: number;
  hook_type: string;
  has_personal_story: boolean;
  has_code_example: boolean;
  created_at: string;
  metric?: MetricData;
  versions?: PostVersion[];
}

export interface FeatureLiftItem {
  feature_group: string;
  feature_name: string;
  count: number;
  group_avg_score: number;
  overall_avg_score: number;
  lift: number;
  confidence: number;
  verdict: 'winning' | 'losing' | 'neutral';
}

export interface AnalyticsOverview {
  total_posts: number;
  overall_avg_score: number;
  total_impressions: number;
  posts_data: Array<{
    id: number;
    title: string;
    topic_tag: string;
    format: string;
    word_count: number;
    hook_type: string;
    has_personal_story: boolean;
    has_code_example: boolean;
    status: string;
    published_at: string;
    engagement_score: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  }>;
  lift_table: FeatureLiftItem[];
  ai_insight: string;
}

export interface CompareResponse {
  topic: string;
  base_version: number;
  target_version: number;
  base_generation: {
    strategy: Strategy;
    content: string;
    review: Review;
  };
  target_generation: {
    strategy: Strategy;
    content: string;
    review: Review;
  };
  differences_summary: string[];
}

// API Functions
export const api = {
  async getCreator(): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/api/creator`);
    if (!res.ok) throw new Error("Failed to load creator profile");
    return res.json();
  },

  async generateIdeas(topic?: string, goal: string = "growth", platform: string = "linkedin"): Promise<{ model_version: number; ideas: IdeaItem[] }> {
    const res = await fetch(`${API_BASE}/api/ideas/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, goal, platform }),
    });
    if (!res.ok) throw new Error("Failed to generate ideas");
    return res.json();
  },

  async startPipeline(params: {
    topic: string;
    goal?: string;
    platform?: string;
    selected_hook?: string;
    model_version?: number;
  }): Promise<{ run_id: string; status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to start pipeline");
    return res.json();
  },

  streamPipelineUrl(runId: string): string {
    return `${API_BASE}/api/generate/${runId}/stream`;
  },

  async getPosts(): Promise<PostItem[]> {
    const res = await fetch(`${API_BASE}/api/posts`);
    if (!res.ok) throw new Error("Failed to load posts");
    return res.json();
  },

  async getPostDetail(id: number): Promise<PostItem> {
    const res = await fetch(`${API_BASE}/api/posts/${id}`);
    if (!res.ok) throw new Error("Failed to load post detail");
    return res.json();
  },

  async savePostVersion(postId: number, content: string): Promise<PostVersion> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to save post version");
    return res.json();
  },

  async publishPost(postId: number): Promise<PostItem> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/publish`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to publish post");
    return res.json();
  },

  async schedulePost(postId: number, minutesFromNow: number = 60): Promise<PostItem> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes_from_now: minutesFromNow }),
    });
    if (!res.ok) throw new Error("Failed to schedule post");
    return res.json();
  },

  async simulateEngagement(postId: number): Promise<MetricData> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/simulate-engagement`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to simulate engagement");
    return res.json();
  },

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/api/analytics/overview`);
    if (!res.ok) throw new Error("Failed to load analytics overview");
    return res.json();
  },

  async getCurrentModel(): Promise<ModelRecord> {
    const res = await fetch(`${API_BASE}/api/learning/model`);
    if (!res.ok) throw new Error("Failed to load active model");
    return res.json();
  },

  async getModelHistory(): Promise<ModelRecord[]> {
    const res = await fetch(`${API_BASE}/api/learning/model/history`);
    if (!res.ok) throw new Error("Failed to load model history");
    return res.json();
  },

  async relearnFromAnalytics(): Promise<ModelRecord> {
    const res = await fetch(`${API_BASE}/api/learning/relearn`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to relearn from analytics");
    return res.json();
  },

  async compareModels(topic: string, v_base: number = 0, v_target: number = 1): Promise<CompareResponse> {
    const res = await fetch(`${API_BASE}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, v_base, v_target }),
    });
    if (!res.ok) throw new Error("Failed to run comparison");
    return res.json();
  },

  async getAuditDecisions(params?: {
    run_id?: string;
    post_id?: number;
    agent?: string;
    strategy_version?: number;
  }): Promise<AuditDecisionRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.run_id) searchParams.set("run_id", params.run_id);
    if (params?.post_id) searchParams.set("post_id", String(params.post_id));
    if (params?.agent) searchParams.set("agent", params.agent);
    if (params?.strategy_version !== undefined) searchParams.set("strategy_version", String(params.strategy_version));

    const res = await fetch(`${API_BASE}/api/audit?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to load audit decisions");
    return res.json();
  },

  async explainPost(postId: number): Promise<ExplainOutputResponse> {
    const res = await fetch(`${API_BASE}/api/audit/explain/${postId}`);
    if (!res.ok) throw new Error("Failed to load explanation for post");
    return res.json();
  },
};

export interface AuditDecisionRecord {
  id: number;
  run_id: string;
  post_id?: number | null;
  agent: string;
  model_used: string;
  strategy_version: number;
  applied_rules: string[];
  inputs_summary?: string;
  decision: string;
  reason: string;
  outcome_score?: number | null;
  created_at: string;
}

export interface ExplainOutputResponse {
  post_id: number;
  title: string;
  strategy_version: number;
  applied_rules: Array<{
    rule_id: string;
    category?: string;
    directive: string;
    weight: number;
    rationale: string;
  }>;
  decision_trail: AuditDecisionRecord[];
  rag_sources: Array<{
    id?: number;
    title?: string;
    format?: string;
    engagement_score?: number;
    similarity?: number;
    excerpt?: string;
  }>;
  explanation: string;
}

