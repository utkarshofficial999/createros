"""
CreatorOS Self-Improvement Benchmark
Agent Arena 2026 - Track 3 (Self-Improving Content Studio)
Sponsor: Mesh API (https://api.meshapi.ai)

Forwards to the official 32-sample benchmark suite in eval/run_eval.py.
"""

import sys
import asyncio
from pathlib import Path

# Ensure root is in path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from eval.run_eval import main

if __name__ == "__main__":
    asyncio.run(main())
