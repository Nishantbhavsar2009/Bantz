# Bantz — Private Butler-Styled Local AI Assistant

Bantz is a private, elegant system monitor and productivity concierge styled as a 1920s butler. Built using a FastAPI (Python) backend and a beautifully designed vanilla HTML/CSS/JS frontend, Bantz resides locally on your machine and helps you monitor system resources, conduct research briefings, and coordinate your daily schedule, all wrapped in a witty, formal butler persona.

---

## 🏛️ Project Architecture & Design

Following modern web design best practices, Bantz is built using a **Luxury Minimalist / Heritage Concierge** theme (deep warm charcoal background, antique brass/gold accents, elegant display headings, and smooth transitions).

```
                 +-----------------------------------+
                 |        Web Browser Frontend       |
                 |      (Vanilla HTML/CSS/JS)        |
                 +-----------------+-----------------+
                                   |
                         JSON REST | API Calls
                                   v
                 +-----------------+-----------------+
                 |          FastAPI Backend          |
                 |             (Python)              |
                 +----+-------------------------+----+
                      |                         |
         System Calls | (psutil)                | LLM APIs / Local
                      v                         v
         +------------+------------+     +------+------------------+
         |    System Diagnostics   |     | Gemini 2.5 Flash /      |
         | (CPU, Memory, Processes)|     | Ollama Local Fallback   |
         +-------------------------+     +-------------------------+
```

---

## ✨ Features

1. **Conversational Butler Chat**: Talk to Bantz. He responds with a high-class, formal, 1920s British butler persona ("Very good, sir. I have prepared your briefing..."). It uses the Gemini 2.5 Flash API with a seamless local Ollama fallback if offline.
2. **System Diagnostics**: Displays real-time CPU, RAM, and disk utilization along with logical process resource consumption.
3. **Research Bureau**: Input research queries. Bantz will perform a multi-source web search and summarize the findings into a clean executive dossier.
4. **Schedule & Inbox Manager**: Register simulated calendar items and catalog mock correspondence (emails), showing active schedules and custom items.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, Uvicorn, Psutil, Google Generative AI Python SDK, DuckDuckGo Search.
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom CSS custom variables, custom scrollbars, transitions), Vanilla Javascript ES6.
- **Testing**: Pytest, Fastapi TestClient.

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.10 or higher
- An internet connection (for Gemini API, fallback to mock butler if offline)
- (Optional) A local [Ollama](https://ollama.com/) instance running with `gemma:2b` or `llama3`.

### 1. Clone the repository and navigate inside
```bash
git clone https://github.com/Nishantbhavsar2009/Bantz.git
cd Bantz
```

### 2. Create and activate virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure API Keys (Optional but Recommended)
Set your Gemini API key to allow Bantz to connect to his cognitive core:
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```
*Note: If no API key is specified, Bantz will attempt to connect to a local Ollama instance. If that is unavailable, he will gracefully operate with his offline cognitive reserve module.*

---

## 💻 Running the Assistant

Start the local server by running:
```bash
python3 main.py
```

Open your web browser and navigate to:
```
http://127.0.0.1:8000
```
Your butler will greet you and await your instructions.

---

## 🧪 Running Validation Tests

Ensure all endpoints are active and functional by running the test suite:
```bash
PYTHONPATH=. pytest
```
All tests should pass successfully with active validation.
