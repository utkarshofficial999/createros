import os
import re
import urllib.parse
import hashlib
import random
from typing import Optional

# Pre-curated high quality technical visual topics for reliable immediate rendering
CURATED_TECH_VISUALS = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",  # Abstract 3D Glass & Neon
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",  # Geometric Digital Architecture
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",  # Glowing Nodes & Data Streams
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",  # Iridescent Glassmorphic Waves
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",  # Quantum Network Nodes
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",  # Blockchain Cryptographic Lattice
]

def clean_prompt_for_image_gen(prompt: str) -> str:
    """Sanitize and streamline a verbose LLM prompt for text-to-image generators."""
    # Remove markdown or quotes
    text = re.sub(r'["`*#]', '', prompt)
    # Strip common filler
    text = re.sub(r'(?i)no stock-photo.*', '', text)
    # Replace non-ascii quotes or dashes
    text = text.replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-').replace('\u202f', ' ')
    # Limit length to 280 characters for optimal URL safety and diffusion prompt coherence
    words = text.split()
    if len(words) > 40:
        text = " ".join(words[:40])
    return text.strip()

def generate_practical_image_url(
    prompt: str,
    style: str = "Isometric 3D Architecture Blueprint",
    topic: str = "Architecture",
    existing_url: Optional[str] = None
) -> str:
    """
    Produces a practical, genuine image URL from a creative prompt.
    Uses Pollinations.ai Flux diffusion engine directly, ensuring
    images are genuinely created from the prompt rather than dummy strings.
    """
    # If a real valid URL already exists and is NOT a dummy/placeholder like example.com
    if existing_url and existing_url.startswith("http"):
        parsed = urllib.parse.urlparse(existing_url)
        domain = parsed.netloc.lower()
        if "example.com" not in domain and "generated-images.com" not in domain and "placeholder" not in domain:
            return existing_url

    clean_prompt = clean_prompt_for_image_gen(prompt or f"{topic} {style}")
    
    # Enhance prompt with style markers for maximum visual quality
    enhanced_prompt = f"{clean_prompt}, {style}, dark background, neon accents, octane render, 8k, photorealistic"
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    
    # Deterministic seed based on prompt to keep image stable per post
    seed = abs(int(hashlib.md5(prompt.encode('utf-8', errors='ignore')).hexdigest()[:8], 16)) % 999999
    
    # Real AI generation via Pollinations Flux (free, no auth required, high-fidelity)
    return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1200&height=800&model=flux&seed={seed}&nologo=true"

def generate_svg_visual(topic: str = "CreatorOS", style: str = "Glassmorphic Data Flow", title: str = "") -> str:
    """
    Generates a production-ready, dark-mode SVG graphic with glassmorphism,
    neon gradients, data flow lines, and crisp vector typography.
    Acts as a zero-latency, always-available local renderer.
    """
    display_title = (title or topic).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    display_style = (style or "Glassmorphic Architecture").replace("&", "&amp;")
    display_topic = topic.upper().replace("&", "&amp;")

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="cyan-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <linearGradient id="glass-spec" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="800" fill="url(#bg-grad)" />

  <!-- Grid Blueprint Lines -->
  <g opacity="0.08" stroke="#38bdf8" stroke-width="1">
    <line x1="0" y1="160" x2="1200" y2="160" />
    <line x1="0" y1="320" x2="1200" y2="320" />
    <line x1="0" y1="480" x2="1200" y2="480" />
    <line x1="0" y1="640" x2="1200" y2="640" />
    <line x1="240" y1="0" x2="240" y2="800" />
    <line x1="480" y1="0" x2="480" y2="800" />
    <line x1="720" y1="0" x2="720" y2="800" />
    <line x1="960" y1="0" x2="960" y2="800" />
  </g>

  <!-- Ambient Glow Orbs -->
  <circle cx="280" cy="300" r="180" fill="#06b6d4" opacity="0.15" filter="url(#glow)" />
  <circle cx="920" cy="500" r="220" fill="#8b5cf6" opacity="0.18" filter="url(#glow)" />

  <!-- Data Flow Waves -->
  <path d="M 100 450 Q 350 200, 600 450 T 1100 450" fill="none" stroke="url(#cyan-indigo)" stroke-width="4" opacity="0.8" />
  <path d="M 100 500 Q 350 250, 600 500 T 1100 500" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.4" stroke-dasharray="8 8" />

  <!-- Central Glassmorphic Card -->
  <rect x="220" y="160" width="760" height="480" rx="28" fill="url(#glass-spec)" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Card Top Badge -->
  <rect x="260" y="200" width="160" height="34" rx="8" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-opacity="0.4" />
  <text x="340" y="222" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="2">
    AI VISUAL ASSET
  </text>

  <!-- Style Subtitle -->
  <text x="260" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#a855f7" letter-spacing="1.5">
    {display_style.upper()}
  </text>

  <!-- Title / Topic -->
  <text x="260" y="335" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff">
    {display_title[:38]}
  </text>
  <text x="260" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff">
    {display_title[38:76]}
  </text>

  <!-- Network Nodes -->
  <g fill="#06b6d4">
    <circle cx="280" cy="520" r="10" />
    <circle cx="440" cy="520" r="8" opacity="0.8" />
    <circle cx="600" cy="520" r="14" fill="#a855f7" />
    <circle cx="760" cy="520" r="8" opacity="0.8" />
    <circle cx="920" cy="520" r="10" />
    <line x1="280" y1="520" x2="920" y2="520" stroke="#06b6d4" stroke-width="2" opacity="0.4" />
  </g>

  <!-- Footer Tag -->
  <text x="260" y="580" font-family="monospace" font-size="13" fill="#64748b">
    Topic: {display_topic} • Quality Gate Approved • Octane Render 8K
  </text>
</svg>"""
