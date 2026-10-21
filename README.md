# CreatorOS — Self-Learning AI Content Studio

> **Demo Thesis:** The same prompt returns a different, measurably better output after the system learns from performance data. If the demo does not show that moment, the project is just another ChatGPT wrapper.

CreatorOS is an AI content studio that closes the loop between **publishing, analytics, and strategy synthesis**. It computes deterministic statistics in pure Python (scores, lift, confidence) and feeds them into an active **Creator Model**, ensuring the LLM never does arithmetic while dynamically adapting future generation.

---

## 🌟 Key Features & Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 React + Vite Frontend                  │
                  │   Idea Studio • Editor • Analytics • Learning • Hero   │
                  └───────────────▲────────────────────────▲───────────────┘
                                  │ REST (JSON)            │ SSE Stream
                  ┌───────────────▼────────────────────────┴───────────────┐
                  │                    FastAPI Backend                     │
                  │  Routers: generate, posts, analytics, learning, compare│
                  └───────────────┬────────────────────────┬───────────────┘
                                  │                        │
            ┌─────────────────────▼───────┐        ┌───────▼─────────────────┐
            │       Pipeline Service      │        │     Learner Service     │
            │ Strategist → Writer ⇄ Review│◄───────┤ Pure Python Stats Engine│
            │      → Repurposer           │ Creator│  Lift, Score, Confidence│
            └──────────────┬──────────────┘  Model └───────▲─────────────────┘
                           │                               │
                           ▼                               │
                  ┌────────────────────────────────────────┴───────────────┐
                  │            SQLite / SQLAlchemy Database                │
                  │ 6 Core Tables: creators, posts, versions, metrics...   │
                  └────────────────────────────────────────────────────────┘
```

1. **Deterministic Stats Engine (Pure Python, No LLM Math)**:
   - **Engagement Score**:
     $$\text{Score} = \frac{1 \cdot \text{likes} + 4 \cdot \text{comments} + 6 \cdot \text{shares} + 5 \cdot \text{saves}}{\text{impressions}} \times 100$$
   - **Lift Calculation**:
     $$\text{Lift} = \frac{\text{Group Average Score}}{\text{Overall Average Score}}$$
   - **Statistical Confidence**:
     $$\text{Confidence} = \min\left(1.0, \frac{n}{5}\right) \quad (\text{Requires } n \ge 3 \text{ to assert patterns})$$

2. **Autonomous 4-Stage Pipeline with Visible Quality Gate**:
   - **Strategist**: Analyzes topic, goal, platform, and cites Creator Model patterns.
   - **Writer**: Drafts content tailored to voice guidelines.
   - **Reviewer**: Strict critic rubric (`hook_strength`, `voice_match`, `clarity`, `specificity`). If score $< 7.5$, triggers a visible retry that judges can observe live on screen!
   - **Repurposer**: Generates tailored LinkedIn post, X (Twitter) thread, and Instagram caption.
   - **SSE Progress Streaming**: Real-time stage progression and score updates.

3. **5 Hero Screens**:
   - **Idea Studio**: Topic and goal inputs, "Generate 5 Ideas" filtered by Creator Model, live SSE progress stepper.
   - **Result & Editor**: Platform switcher (Markdown, LinkedIn, X Thread, Instagram), strategy drawer, quality scorecard, inline editing with version history, and "Simulate Publish".
   - **Analytics**: Recharts bar chart colored by pattern category, lift matrix table, and "Simulate Engagement".
   - **Learning Center**: Current Creator Model cards, voice profile, version timeline, and the one-click **"Re-learn from Analytics"** button.
   - **Before / After Comparison**: Side-by-side view comparing identical prompts across model versions (v0 vs v1/v2) with highlighted differences and score deltas.

4. **Seeded Dataset & Realistic Distribution**:
   - 20 seeded posts with clear performance bifurcation:
     - **Build-in-public stories (6 posts)**: ~5-6% engagement
     - **Practical deep-dives with code (5 posts)**: ~3.5-4.5% engagement
     - **Generic tutorials (6 posts)**: ~1.5-2.5% engagement
     - **Opinion / Listicles (3 posts)**: ~2.5-3.5% engagement

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
# From workspace root
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

pip install -r backend/requirements.txt

# Run database seeder (initializes 20 posts, metrics, v0 and v1 models)
python -m backend.app.seed.seed

# Run backend unit & integration tests
pytest backend/tests/test_api.py -v

# Start FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🎯 3-4 Minute Hackathon Demo Script

1. **Hook (15s)**: Show that creators post blindly, and conventional AI tools forget everything the moment a tab closes.
2. **Before (40s)**: Go to **Before / After** or **Idea Studio** on model v0 (baseline). Show generic definitions ("What is X?") with low quality scores (6.5/10).
3. **Analytics (30s)**: Switch to **Analytics**. Show the 20 seeded posts in the Recharts bar chart and the lift matrix: personal build stories have **+2.45x lift**, while generic tutorials suffer a **0.42x penalty**.
4. **Learn (40s)**: Go to **Learning Center**. Click **"Re-learn from Analytics"** and watch Creator Model v1 upgrade to v2 with a 95% statistical confidence rating and newly formulated rules.
5. **After (60s)**: Return to **Idea Studio** or **Before / After**. Run the exact same prompt. Observe the live SSE pipeline stream with the visible quality gate retry (attempt 1 score 6.8 $\rightarrow$ regenerating with code & metrics $\rightarrow$ attempt 2 score 8.8!). Show the repurposed LinkedIn and X thread variants.
6. **Close the Loop (30s)**: Click "Simulate Publish", then in Analytics click "Simulate Engagement" to watch the new post join the performance chart.
7. **Production Roadmap (15s)**: Live platform API ingestion (LinkedIn/YouTube/X), pgvector long-term memory, LangGraph durable agent execution, and A/B hook testing.
