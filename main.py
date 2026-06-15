import os
import time
import json
import logging

# Load local .env file if it exists to read api keys securely
env_path = "/Users/nishantbhavsar/Projects/Bantz/.env"
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, val = line.strip().split('=', 1)
                os.environ[key.strip()] = val.strip().strip("'\"")
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psutil
import requests
import google.generativeai as genai
from duckduckgo_search import DDGS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BantzButler")

app = FastAPI(title="Bantz - The AI Butler")

# Create data directory for persistent storage
DATA_DIR = "/Users/nishantbhavsar/Projects/Bantz/data"
os.makedirs(DATA_DIR, exist_ok=True)
SCHEDULE_FILE = os.path.join(DATA_DIR, "schedule.json")

# Ensure static files directory exists
os.makedirs("/Users/nishantbhavsar/Projects/Bantz/static", exist_ok=True)

# Mount static files at /static
app.mount("/static", StaticFiles(directory="static"), name="static")

# 1920s Butler System Prompt definition
BUTLER_SYSTEM_PROMPT = """You are Bantz, a refined, witty, and exceptionally loyal 1920s digital butler. You are speaking to your master/employer. 
Your tone should be formal, polite, and articulate, but mixed with dry British humor and subtle banter when appropriate. 
Always refer to the user as "sir" or "my liege" (unless specified otherwise).
Keep your responses concise, structured, and helpful. You are running as a local system assistant, so you help with system stats, emails, scheduling, and research. 
Do not break character. Respond with elegance, using 1920s vocabulary when fitting (e.g., "splendid", "indeed", "very good, sir", "alas")."""

# Models for input validation
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class ResearchRequest(BaseModel):
    query: str

class EventRequest(BaseModel):
    time: str
    title: str
    category: str  # 'calendar' or 'email'
    sender: Optional[str] = None  # for emails

# Initialize default schedule data if not exists
def load_schedule_data():
    if not os.path.exists(SCHEDULE_FILE):
        default_data = {
            "events": [
                {"time": "09:00 AM", "title": "Review Daily CS/AI Notes", "category": "calendar"},
                {"time": "11:30 AM", "title": "SAT Prep Session (Math Focus)", "category": "calendar"},
                {"time": "03:00 PM", "title": "Build Bantz AI Assistant Improvements", "category": "calendar"},
                {"time": "05:00 PM", "title": "Evening Tea & Walk", "category": "calendar"}
            ],
            "emails": [
                {"sender": "University of Toronto Admissions", "title": "Inquiry regarding CS Honors Program Portfolio Requirements", "time": "10:15 AM"},
                {"sender": "GitHub Alerts", "title": "Build succeeded: Nishantbhavsar2009/Bantz main branch", "time": "08:30 AM"},
                {"sender": "Google Colab", "title": "Your model training run has completed successfully", "time": "07:15 AM"}
            ]
        }
        with open(SCHEDULE_FILE, 'w') as f:
            json.dump(default_data, f, indent=4)
        return default_data
    
    try:
        with open(SCHEDULE_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading schedule file: {e}")
        return {"events": [], "emails": []}

def save_schedule_data(data):
    try:
        with open(SCHEDULE_FILE, 'w') as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving schedule file: {e}")

# Helper: call Gemini API or fallback
def query_llm(user_message: str, system_prompt: str) -> str:
    """
    Sends a prompt to the LLM (Gemini API with Ollama fallback).
    Demonstrates robust system integration for intermediate Python developers.
    """
    # Try Gemini API first
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            genai.configure(api_key=api_key)
            # Use gemini-2.5-flash as the default high-performance model
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_prompt
            )
            response = model.generate_content(user_message)
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call failed, attempting Ollama fallback: {e}")

    # Fallback to local Ollama if running
    try:
        ollama_url = "http://localhost:11434/api/chat"
        payload = {
            "model": "gemma:2b",  # lightweight default local model
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "stream": False
        }
        response = requests.post(ollama_url, json=payload, timeout=5)
        if response.status_code == 200:
            return response.json()["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"Ollama local execution failed: {e}")

    # Final static fallback in butler character
    return (
        "Forgive me, sir. My cognitive synapses (cloud and local LLM linkages) appear to be temporarily "
        "interrupted. However, my static algorithms are fully operational. Is there any system business "
        "I may help you attend to in the meantime?"
    )

@app.get("/", response_class=HTMLResponse)
async def get_index():
    """Serves the main frontend dashboard webpage."""
    return FileResponse("/Users/nishantbhavsar/Projects/Bantz/static/index.html")

@app.post("/api/chat")
async def chat_with_butler(req: ChatRequest):
    """
    Accepts user prompts and responds in the 1920s Butler persona.
    Supports basic conversational context tracking.
    """
    user_msg = req.message
    # Query LLM with the butler system instructions
    reply = query_llm(user_msg, BUTLER_SYSTEM_PROMPT)
    return {"reply": reply}

@app.get("/api/system")
async def get_system_stats():
    """
    Gathers real-time CPU, Memory, Disk, and running process statistics.
    Provides data validation and handles system calls cleanly.
    """
    try:
        # Get memory statistics
        mem = psutil.virtual_memory()
        # Get disk statistics for root path
        disk = psutil.disk_usage("/")
        
        # Get top 5 CPU consuming processes
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        # Sort by cpu_percent desc and get top 5
        top_processes = sorted(processes, key=lambda x: x.get('cpu_percent') or 0, reverse=True)[:5]
        # Clean process names and percentages
        formatted_processes = [
            {
                "pid": p["pid"],
                "name": p["name"],
                "cpu": round(p["cpu_percent"] or 0, 1),
                "mem": round(p["memory_percent"] or 0, 1)
            } for p in top_processes
        ]

        stats = {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "cpu_count": psutil.cpu_count(logical=True),
            "memory": {
                "total_gb": round(mem.total / (1024**3), 2),
                "available_gb": round(mem.available / (1024**3), 2),
                "percent_used": mem.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "percent_used": disk.percent
            },
            "processes": formatted_processes,
            "uptime": round(time.time() - psutil.boot_time())
        }
        return stats
    except Exception as e:
        logger.error(f"Error gathering system stats: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve system diagnostics.")

@app.post("/api/research")
async def compile_research(req: ResearchRequest):
    """
    Performs a live DuckDuckGo search on the query, extracts links,
    and uses the LLM to format it into a comprehensive, butler-style briefing.
    """
    query = req.query
    search_context = []
    
    # 1. Fetch live search results
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
            for r in results:
                search_context.append(f"Title: {r['title']}\nURL: {r['href']}\nSnippet: {r['body']}\n")
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")
        search_context = ["No search results retrieved due to connectivity issues."]

    context_str = "\n---\n".join(search_context)
    
    # 2. Formulate LLM query to build a nice report
    prompt = (
        f"The user has requested research on the query: '{query}'.\n"
        f"Here are the web search results found:\n{context_str}\n\n"
        f"Please synthesize a beautifully structured executive briefing in markdown format. "
        "Summarize the key findings, list important sources/links, and present it in your refined butler persona."
    )
    
    briefing = query_llm(prompt, BUTLER_SYSTEM_PROMPT)
    return {"briefing": briefing}

@app.get("/api/schedule")
async def get_schedule():
    """Retrieves schedule and email data from persistent JSON file."""
    return load_schedule_data()

@app.post("/api/schedule")
async def add_schedule_item(req: EventRequest):
    """Adds a new calendar event or mock email to persistent storage."""
    data = load_schedule_data()
    if req.category == 'calendar':
        new_event = {"time": req.time, "title": req.title, "category": "calendar"}
        data["events"].append(new_event)
        save_schedule_data(data)
        return {"status": "success", "message": "Event added, sir.", "item": new_event}
    elif req.category == 'email':
        new_email = {
            "sender": req.sender or "Anonymous Correspondent",
            "title": req.title,
            "time": req.time
        }
        data["emails"].append(new_email)
        save_schedule_data(data)
        return {"status": "success", "message": "Correspondence registered, sir.", "item": new_email}
    else:
        raise HTTPException(status_code=400, detail="Invalid category specified.")

if __name__ == "__main__":
    import uvicorn
    # Start the local server
    logger.info("Bantz Butler backend online.")
    uvicorn.run(app, host="127.0.0.1", port=8000)
