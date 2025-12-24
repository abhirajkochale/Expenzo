<div align="center">

  <img src="https://via.placeholder.com/120x120.png?text=🛡️" alt="logo" width="100" height="auto" />
  <h1>Expenzo: The AI Financial Guardian</h1>
  
  <p>
    <strong>Built for the Google Developer Hackathon 2025</strong>
  </p>
  <p>
    A Next-Gen Financial Operating System powered by <strong>Gemini 2.0</strong> and <strong>Flutter</strong>.
  </p>

  <p>
    <a href="https://flutter.dev/"><img src="https://img.shields.io/badge/Flutter-02569B?style=flat-square&logo=flutter&logoColor=white" alt="Flutter" /></a>
    <a href="https://dart.dev/"><img src="https://img.shields.io/badge/Dart-0175C2?style=flat-square&logo=dart&logoColor=white" alt="Dart" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Gemini_Pro-8E75B2?style=flat-square&logo=googlebard&logoColor=white" alt="Gemini AI" /></a>
    <a href="https://aistudio.google.com/"><img src="https://img.shields.io/badge/Tuned_with-Google_AI_Studio-4285F4?style=flat-square&logo=google&logoColor=white" alt="AI Studio" /></a>
    <a href="#"><img src="https://img.shields.io/badge/IDE-Google_Antigravity-34A853?style=flat-square&logo=googlecloud&logoColor=white" alt="Antigravity" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
  </p>

  <p>
    <a href="#-google-tech-implementation">🤖 Google Tech Inside</a> •
    <a href="#-key-features">✨ Features</a> •
    <a href="#-system-architecture">🏗️ Architecture</a> •
    <a href="#-getting-started">🚀 Getting Started</a>
  </p>

</div>

<br />

![Expenzo Showcase](image_48d13b.jpg)

---

## 📖 Introduction

**Expenzo** is an AI-first financial guardian designed to protect wealth, not just track it.

Unlike traditional banking apps that look backward, Expenzo looks forward. Built using **Flutter** for a beautiful native experience and **Google Gemini** for reasoning, it serves as a proactive analyst that parses messy Indian bank statements, detects subscription traps, and forecasts spending risks before they happen.

Developed using Google's cutting-edge **Antigravity IDE**, Expenzo represents the future of agentic app development.

---

## 🤖 Google Tech Implementation

We leveraged the full power of the Google Developer Ecosystem to build Expenzo:

| Technology | Usage in Expenzo |
| :--- | :--- |
| **Gemini API (Pro Vision)** | The core "Guardian Engine". It parses complex PDF bank statements (HDFC, SBI) and categorizes messy Indian transaction strings (e.g., `UPI/23498/VADAPAV`) with human-level accuracy. |
| **Google AI Studio** | Used to fine-tune system prompts for the "Ask Expenzo" chatbot, ensuring it answers financial queries ("Can I afford a trip?") without hallucinating numbers. |
| **Flutter** | Delivers a 60FPS Spatial UI with 3D tilt effects and adaptive glassmorphism that works flawlessly on Android, iOS, and Web. |
| **Google Antigravity** | The entire project was scaffolded and iterated upon using Google's new **Antigravity IDE**, utilizing AI agents to generate boilerplate code and refactor complex logic loops. |

---

## ✨ Key Features

### 🧠 1. The Guardian Engine (Gemini-Powered)
A local-first inference engine that monitors your financial graph 24/7.
* **Contextual Anomaly Detection:** Flags transactions that deviate from your personal baseline (not just generic rules).
* **Burn Rate Velocity:** Warns if your daily spending pace (₹/day) is accelerating too fast for the month.
* **AI Explainability:** Every insight comes with a "Confidence Score" and reasoning, so you trust the AI.

### 💬 2. "Ask Expenzo" Chatbot
Talk to your money using natural language.
* *"Forecast my savings for December based on last month."*
* *"How much did I spend on Swiggy vs Zomato in 2024?"*
* *"Identify recurring bills I might have forgotten."*

### 📄 3. Smart Statement Parser
* **Universal Import:** Drag & Drop PDF/CSV/Excel.
* **Privacy Sandbox:** Parsing logic runs client-side using Regex + Gemini Flash for speed and privacy.
* **Auto-Clean:** Sanitizes merchant names instantly.

### 📊 4. Spatial Flutter UI
* **3D Cards:** Dashboard elements respond to device accelerometer/mouse movement.
* **Smart Action Plans:** Generates 3 specific, actionable financial steps daily.

---

## 🏗️ System Architecture

Expenzo uses a hybrid AI architecture to balance latency and intelligence.

```mermaid
graph TD
    User[User] -->|Interacts| Flutter[Flutter UI Layer]
    
    subgraph "Google Cloud / AI Layer"
        Flutter -->|Chat Query| Gemini[Gemini Pro API]
        Flutter -->|Raw PDF| Vision[Gemini Vision (Parsing)]
        Gemini -->|Structured Data| AIStudio[Prompt Context (AI Studio)]
    end
    
    subgraph "Data & Logic"
        Flutter -->|Cache/Auth| Supabase[Supabase DB]
        Gemini -->|Insights| Guardian[Guardian Logic Engine]
    end
    
    Guardian -->|Alerts| Flutter
