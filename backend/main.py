"""
pk-portfolio-backend  v3.0.0
FastAPI backend for pkowadkar-portfolio.

Endpoints:
  GET  /                  → root health check
  GET  /api/health        → UptimeRobot keep-alive ping
  POST /api/contact       → contact form → Gmail SMTP
  GET  /api/haiku         → dynamically generated haikus via RAG (24h cache)
  POST /api/chat          → Pai — Pranav's AI Guide (multi-model OpenRouter fallback)

AI Strategy (all via OpenRouter):
  Chat  fallback chain: gemini-3.1-pro-preview → claude-sonnet-4.6 → gpt-4.1
                        → qwen3-235b-a22b → openai/gpt-oss-120b:free
  Haiku fallback chain: gemini-3-flash-preview → gpt-4.1-mini → claude-haiku-4.5
                        → gpt-5-mini → mistral-small-3.1-24b-instruct:free
"""

import os
import json
import time
import smtplib
import logging
import random
import httpx
from pathlib import Path
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="pk-portfolio-backend", version="3.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────────────────────────────
SMTP_HOST        = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT        = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER        = os.getenv("SMTP_USER", "")
SMTP_PASS        = os.getenv("SMTP_PASS", "")
RECIPIENT_EMAIL  = os.getenv("RECIPIENT_EMAIL", "pranav.kowadkar@gmail.com")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GITHUB_PAT       = os.getenv("GITHUB_PAT", "")
GITHUB_USERNAME  = os.getenv("GITHUB_USERNAME", "p-kowadkar")
HAIKU_CACHE_TTL  = int(os.getenv("HAIKU_CACHE_TTL", "86400"))  # 24h default

OPENROUTER_BASE  = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_REFERER = "https://www.pkowadkar.com"
OPENROUTER_TITLE   = "pk-portfolio"

# ─── Model fallback chains ────────────────────────────────────────────────────
# Chat: pro-level models with 1M+ context, cascading to free fallbacks
CHAT_MODELS = [
    "google/gemini-3.1-pro-preview",    # Primary: 1M ctx, Google's latest
    "anthropic/claude-sonnet-4.6",       # Fallback 1: 1M ctx, Anthropic
    "openai/gpt-4.1",                    # Fallback 2: 1M ctx, OpenAI
    "qwen/qwen3-235b-a22b",              # Fallback 3: 131k ctx, Qwen
    "openai/gpt-oss-120b:free",          # Fallback 4: 131k ctx, free
]

# Haiku: fast/cheap flash-class models
HAIKU_MODELS = [
    "google/gemini-3-flash-preview",              # Primary: 1M ctx, fast
    "openai/gpt-4.1-mini",                        # Fallback 1: 1M ctx, cheap
    "anthropic/claude-haiku-4.5",                 # Fallback 2: 200k ctx
    "openai/gpt-5-mini",                          # Fallback 3: 400k ctx
    "mistralai/mistral-small-3.1-24b-instruct:free",  # Fallback 4: free
]

# ─── Data files ───────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"

def load_text(filename: str) -> str:
    path = DATA_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

# ─── Haiku cache ──────────────────────────────────────────────────────────────
_haiku_cache: dict = {"haikus": [], "generated_at": 0}

FALLBACK_HAIKUS = [
    {"id": "planes",    "lines": ["Fifteen planes take flight", "Balsa wood, midnight solder", "Belagavi dreams"],          "fact": "Built 15 RC planes + 4 quadcopters from scratch in college", "emoji": "✈️"},
    {"id": "parasail",  "lines": ["First paycheck arrives", "Twenty-two engineers soar", "Parasailing joy"],                "fact": "Celebrated first Cognizant paycheck by parasailing with 22 colleagues", "emoji": "🪂"},
    {"id": "scuba",     "lines": ["Underwater calm", "Fluid dynamics, felt not", "Dassault taught me this"],               "fact": "First scuba dive was a Dassault team event — experienced aerodynamics viscerally", "emoji": "🤿"},
    {"id": "goa",       "lines": ["Goa, four hours south", "Debug code on the beach", "Sunset clears the mind"],           "fact": "Regular Goa trips with the Belagavi crew — best debugging sessions happened on the beach", "emoji": "🏖️"},
    {"id": "anime",     "lines": ["Steins;Gate reruns", "Ghost in the Shell at 2 AM", "AI dreams take shape"],             "fact": "Steins;Gate & Ghost in the Shell directly influenced his AI philosophy", "emoji": "📺"},
    {"id": "workshop",  "lines": ["Seventy-two hours", "Seventy-two engineers", "Belagavi wakes"],                         "fact": "First RC plane workshop: 72 registrations in 72 hours — had to close signups", "emoji": "🛠️"},
    {"id": "stirling",  "lines": ["Heat becomes motion", "Stirling engine, half-built, proud", "Theory made real"],        "fact": "Built a Stirling engine in college — theoretically possible, practically challenging", "emoji": "⚙️"},
    {"id": "gre",       "lines": ["Pune, 2 AM", "Secret tricks for GRE math", "Students line the hall"],                   "fact": "Became so good at GRE math in Pune that students lined up for his tips", "emoji": "📐"},
    {"id": "newark",    "lines": ["Two suitcases packed", "Newark fog, September cold", "Dreams weigh nothing here"],       "fact": "Arrived in Newark with two suitcases and a scholarship — September 2022", "emoji": "🌁"},
    {"id": "sentinel",  "lines": ["Seven hours, one night", "Search Sentinel wins first place", "Snowstorm, NYC"],         "fact": "Built Search Sentinel in 7 hours during a NYC snowstorm — won 1st place at Pulse NYC", "emoji": "🏆"},
]


# ─── OpenRouter helper ────────────────────────────────────────────────────────
async def call_openrouter(
    model: str,
    messages: list[dict],
    temperature: float = 0.8,
    max_tokens: int = 8192,
    response_format: dict | None = None,
    timeout: float = 45.0,
) -> str:
    """
    Call OpenRouter with the given model and messages.
    Returns the assistant's text content.
    Raises httpx.HTTPStatusError or Exception on failure.
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": OPENROUTER_REFERER,
        "X-Title": OPENROUTER_TITLE,
        "Content-Type": "application/json",
    }

    payload: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        payload["response_format"] = response_format

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    # OpenRouter returns OpenAI-compatible response
    return data["choices"][0]["message"]["content"]


async def call_with_fallback(
    model_list: list[str],
    messages: list[dict],
    temperature: float = 0.8,
    max_tokens: int = 8192,
    response_format: dict | None = None,
    timeout: float = 45.0,
) -> tuple[str, str]:
    """
    Try each model in model_list until one succeeds.
    Returns (content, model_used).
    Raises RuntimeError if all models fail.
    """
    last_error = None
    for model in model_list:
        try:
            logger.info(f"Trying model: {model}")
            content = await call_openrouter(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format,
                timeout=timeout,
            )
            logger.info(f"Success with model: {model}")
            return content, model
        except Exception as e:
            logger.warning(f"Model {model} failed: {type(e).__name__}: {e}")
            last_error = e
            continue

    raise RuntimeError(f"All models failed. Last error: {last_error}")


# ─── GitHub context ───────────────────────────────────────────────────────────
async def fetch_github_context() -> str:
    """Fetch recent GitHub activity: own repos only (no forks), commits authored by Pranav."""
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_PAT:
        headers["Authorization"] = f"Bearer {GITHUB_PAT}"

    context_parts = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Own repos only — exclude forks
            resp = await client.get(
                f"https://api.github.com/users/{GITHUB_USERNAME}/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 30},
            )
            if resp.status_code == 200:
                repos = resp.json()
                repo_lines = []
                for r in repos:
                    if r.get("fork", False):
                        continue
                    desc = r.get("description") or ""
                    lang = r.get("language") or ""
                    stars = r.get("stargazers_count", 0)
                    repo_lines.append(f"- {r['name']}: {desc} [{lang}] ⭐{stars}")
                context_parts.append("GITHUB REPOS (own, non-forked):\n" + "\n".join(repo_lines))

            # Recent push events — only include commits authored by Pranav
            resp2 = await client.get(
                f"https://api.github.com/users/{GITHUB_USERNAME}/events/public",
                headers=headers,
                params={"per_page": 30},
            )
            if resp2.status_code == 200:
                events = resp2.json()
                event_lines = []
                for e in events:
                    etype = e.get("type", "")
                    repo_name = e.get("repo", {}).get("name", "")
                    if etype == "PushEvent":
                        commits = e.get("payload", {}).get("commits", [])
                        for c in commits[:2]:
                            author = c.get("author", {}).get("name", "").lower()
                            if GITHUB_USERNAME.lower() in author or "pranav" in author or "kowadkar" in author:
                                msg = c.get("message", "").split("\n")[0][:80]
                                event_lines.append(f"- Commit to {repo_name}: {msg}")
                    elif etype == "CreateEvent":
                        ref_type = e.get("payload", {}).get("ref_type", "")
                        ref = e.get("payload", {}).get("ref", "")
                        if ref_type == "repository":
                            event_lines.append(f"- Created new repo: {repo_name}")
                        elif ref and ref_type == "branch":
                            event_lines.append(f"- Created branch '{ref}' in {repo_name}")
                if event_lines:
                    context_parts.append("RECENT GITHUB ACTIVITY (Pranav's own commits):\n" + "\n".join(event_lines))
                else:
                    context_parts.append("RECENT GITHUB ACTIVITY: No recent public commits found.")

        except Exception as e:
            logger.warning(f"GitHub fetch failed: {e}")

    return "\n\n".join(context_parts)


# ─── Haiku generation ─────────────────────────────────────────────────────────
async def generate_haikus(context: str) -> list[dict]:
    """Generate 10 haikus via OpenRouter fallback chain."""
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not set — using fallback haikus")
        return random.sample(FALLBACK_HAIKUS, len(FALLBACK_HAIKUS))

    prompt = f"""You are generating hidden easter egg haikus for Pranav Kowadkar's portfolio website.
Each haiku encodes a real, specific, surprising fun fact about Pranav's life — drawn from the sources below.

SOURCES:
{context}

RULES:
1. Generate exactly 10 haikus. Each must be 5-7-5 syllables (strict).
2. Each haiku must encode ONE specific, real, verifiable fact from the sources above.
3. Prioritize surprising, personal, human facts — NOT generic tech facts.
4. Vary the sources: at least 4 from the journey doc, 2 from the resume, 2 from GitHub activity, 2 wildcard.
5. Each haiku must have a unique emoji that matches its theme.
6. The "fact" field must be a single sentence stating the actual fact the haiku encodes.
7. The "id" must be a short lowercase slug (e.g. "planes", "scuba", "sentinel").

Return ONLY valid JSON — an array of 10 objects with this exact schema:
[
  {{
    "id": "slug",
    "lines": ["line1 (5 syllables)", "line2 (7 syllables)", "line3 (5 syllables)"],
    "fact": "The real fun fact this haiku encodes.",
    "emoji": "🎋"
  }}
]

No markdown, no explanation, no code blocks — raw JSON array only."""

    messages = [{"role": "user", "content": prompt}]

    try:
        raw, model_used = await call_with_fallback(
            model_list=HAIKU_MODELS,
            messages=messages,
            temperature=0.9,
            max_tokens=2048,
            response_format={"type": "json_object"},
            timeout=30.0,
        )
        logger.info(f"Haikus generated by: {model_used}")

        # Some models wrap the array in an object — handle both cases
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            haikus = parsed
        elif isinstance(parsed, dict):
            # Try common wrapper keys
            for key in ("haikus", "result", "data", "items"):
                if key in parsed and isinstance(parsed[key], list):
                    haikus = parsed[key]
                    break
            else:
                # Last resort: grab the first list value
                haikus = next((v for v in parsed.values() if isinstance(v, list)), [])
        else:
            haikus = []

    except Exception as e:
        logger.error(f"Haiku generation failed across all models: {e}")
        return random.sample(FALLBACK_HAIKUS, len(FALLBACK_HAIKUS))

    # Validate structure
    validated = []
    for h in haikus:
        if (
            isinstance(h, dict)
            and "id" in h and "lines" in h and "fact" in h and "emoji" in h
            and isinstance(h["lines"], list) and len(h["lines"]) == 3
        ):
            validated.append(h)

    if len(validated) < 5:
        logger.warning(f"Only {len(validated)} valid haikus — supplementing with fallbacks")
        validated += random.sample(FALLBACK_HAIKUS, 10 - len(validated))

    return validated[:10]


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "pk-portfolio-backend", "version": "3.0.0"}


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    """UptimeRobot pings this every 5 min to prevent Render free tier sleep."""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/haiku")
async def get_haikus(refresh: bool = False):
    """
    Returns 10 dynamically generated haikus about Pranav.
    Generated via OpenRouter RAG over journey doc, resume, and GitHub activity.
    Cached for 24 hours (HAIKU_CACHE_TTL env var). Pass ?refresh=true to force regeneration.
    """
    now = time.time()
    cache_age = now - _haiku_cache["generated_at"]
    cache_valid = _haiku_cache["haikus"] and cache_age < HAIKU_CACHE_TTL and not refresh

    if cache_valid:
        logger.info(f"Serving cached haikus (age: {int(cache_age)}s)")
        return {
            "haikus": _haiku_cache["haikus"],
            "cached": True,
            "generated_at": datetime.utcfromtimestamp(_haiku_cache["generated_at"]).isoformat(),
        }

    logger.info("Generating fresh haikus via OpenRouter RAG...")

    journey = load_text("journey.txt")
    resume  = load_text("resume.txt")
    github  = await fetch_github_context()

    context = "\n\n".join(filter(None, [
        f"=== JOURNEY DOCUMENT ===\n{journey[:20000]}",
        f"=== MASTER RESUME ===\n{resume[:8000]}",
        f"=== GITHUB CONTEXT ===\n{github[:4000]}",
    ]))

    try:
        haikus = await generate_haikus(context)
        _haiku_cache["haikus"] = haikus
        _haiku_cache["generated_at"] = now
        logger.info(f"Generated {len(haikus)} haikus successfully")
        return {
            "haikus": haikus,
            "cached": False,
            "generated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Haiku generation failed: {e}")
        shuffled = random.sample(FALLBACK_HAIKUS, len(FALLBACK_HAIKUS))
        return {
            "haikus": shuffled,
            "cached": False,
            "generated_at": datetime.utcnow().isoformat(),
            "fallback": True,
        }


# ─── Pai Chat endpoint ────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

PAI_SYSTEM_PROMPT = """🎬 You are Pai — Pranav Kowadkar's AI Guide, embedded in his portfolio.
You are a vivid, articulate narrator of his professional journey. Speak with cinematic clarity,
grounded confidence, and human warmth. You are NOT Pranav himself — you are his assistant,
always speaking in third person about Pranav.

IDENTITY: If addressed as "Pranav" or asked if you ARE Pranav, respond:
"I'm Pai — Pranav's AI Guide. Let's explore his journey together."

Always speak in third person. Never impersonate Pranav. Never say "I" when referring to
Pranav's experiences. Never robotic. Never start responses with "Certainly!" or "Great question!"
— just answer naturally. Keep responses conversational and complete — never cut off mid-sentence.
Avoid bullet lists; write in flowing prose. Aim for 2-4 sentences for simple questions, a short
paragraph for complex ones. Occasionally drop a fun fact about Pranav's past when it's relevant.

CRITICAL RULES:
- ALWAYS speak in third person. Say "Pranav built" not "I built".
- Do NOT discuss technical implementation details of Project Poltergeist beyond its multi-agent architecture.
- If asked something off-topic: "We're drifting off-track — let's get back to Pranav's journey."
- If asked about visa/sponsorship: "Pranav will require future work authorization sponsorship. For specifics, contact him directly."
- If someone asks to contact Pranav, direct them to pk.kowadkar@gmail.com or LinkedIn (linkedin.com/in/pkowadkar).
- If you don't know something specific, say "I'm not sure about that one — reach out to Pranav directly."

EASTER EGGS:
- Hidden haiku poems are scattered throughout the portfolio. Trigger: Konami code (↑↑↓↓←→←→BA).
- If asked about easter eggs or haikus, confirm they exist and hint at the Konami code."""


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """
    Pai — Pranav's AI Guide.
    Does live RAG over journey doc, master resume, and GitHub activity.
    Uses OpenRouter multi-model fallback chain for conversational responses.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Build live context from all sources
    journey = load_text("journey.txt")
    resume  = load_text("resume.txt")
    github  = await fetch_github_context()

    context = "\n\n".join(filter(None, [
        f"=== PRANAV'S JOURNEY (complete) ===\n{journey[:25000]}",
        f"=== MASTER RESUME ===\n{resume[:8000]}",
        f"=== GITHUB ACTIVITY (live) ===\n{github[:4000]}",
    ]))

    system_with_context = f"{PAI_SYSTEM_PROMPT}\n\n{context}"

    # Build OpenAI-compatible message list (system + history + new message)
    # Convert "model" role (Gemini convention) → "assistant" (OpenAI convention)
    messages: list[dict] = [{"role": "system", "content": system_with_context}]
    for m in req.history[-10:]:
        role = "assistant" if m.role == "model" else m.role
        messages.append({"role": role, "content": m.content})
    messages.append({"role": "user", "content": req.message})

    try:
        reply, model_used = await call_with_fallback(
            model_list=CHAT_MODELS,
            messages=messages,
            temperature=0.8,
            max_tokens=8192,
            timeout=45.0,
        )
        logger.info(f"Chat response from: {model_used}")
        return {"reply": reply, "model": model_used}
    except Exception as e:
        logger.error(f"Chat error across all models: {e}")
        raise HTTPException(
            status_code=500,
            detail="Pai is having trouble connecting. All models are currently unavailable — try again shortly."
        )


# ─── Contact endpoint ─────────────────────────────────────────────────────────
class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str = "Portfolio Contact"
    message: str


@app.post("/api/contact")
async def contact(msg: ContactMessage):
    """Receives contact form submissions and forwards via Gmail SMTP."""
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP not configured — logging message only")
        logger.info(f"Contact from {msg.name} <{msg.email}>: {msg.subject}")
        return {"success": True, "message": "Message received (SMTP not configured)"}

    try:
        mime = MIMEMultipart("alternative")
        mime["Subject"] = f"[pk-portfolio] {msg.subject}"
        mime["From"]    = SMTP_USER
        mime["To"]      = RECIPIENT_EMAIL
        mime["Reply-To"] = msg.email

        html_body = f"""
        <html><body style="font-family:-apple-system,sans-serif;color:#1c1c1e;max-width:600px;">
          <div style="background:#0a0a0a;padding:20px;border-radius:12px;margin-bottom:20px;">
            <span style="color:#e50914;font-size:18px;font-weight:bold;">pk-portfolio</span>
            <span style="color:rgba(255,255,255,0.4);font-size:12px;margin-left:8px;">new message</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;width:100px;">From</td>
                <td style="padding:8px 0;font-weight:600;">{msg.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:{msg.email}">{msg.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Subject</td>
                <td style="padding:8px 0;">{msg.subject}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <div style="white-space:pre-wrap;line-height:1.6;">{msg.message}</div>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <p style="color:#999;font-size:12px;">Sent via pk-portfolio · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
        </body></html>"""

        mime.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, RECIPIENT_EMAIL, mime.as_string())

        logger.info(f"Email sent from {msg.name} <{msg.email}>")
        return {"success": True, "message": "Message sent successfully"}

    except Exception as e:
        logger.error(f"SMTP error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")
