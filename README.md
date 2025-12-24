# 🛡️ Expenzo: The AI Financial Guardian

![Expenzo Banner](https://via.placeholder.com/1280x640.png?text=Expenzo+Spatial+Dashboard)
<div align="center">

[![Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)]()
[![Version](https://img.shields.io/badge/Version-2.0.0_Spatial-blue?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Not just a tracker. A financial predictive engine.**

[**View Demo**](https://your-demo-link.com) · [**Report Bug**](https://github.com/abhirajkochale/Expenzo/issues) · [**Request Feature**](https://github.com/abhirajkochale/Expenzo/issues)

</div>

---

## 📖 Introduction

**Expenzo** redefines personal finance by moving beyond simple logging. It is an **AI-first "Guardian"** that actively monitors your financial health, predicts spending risks before they happen, and offers real-time strategic advice.

Built with a **Spatial UI** design philosophy, Expenzo provides a modern, glassmorphic interface that adapts to your device, making finance feel tangible and interactive. Under the hood, it leverages a custom **Inference Engine** to parse messy Indian bank statements and detect anomalies with high precision.

---

## ✨ Key Features

### 🧠 The Guardian Engine (AI Core)
Unlike basic apps that just sum up totals, Expenzo's `insightGenerator` runs 7-layer heuristic analysis on every transaction:
* **Anomaly Detection:** Flags single large purchases that deviate from your 30-day baseline.
* **Subscription Traps:** Identifies recurring patterns to spot forgotten subscriptions.
* **Velocity Checks:** Warns you if your spending *pace* (₹/day) is accelerating too fast for the month.
* **Confidence Scoring:** Every insight comes with an "Explainability Score" (Low/Medium/High) so you know why the AI flagged it.

### 📄 Smart Statement Parser
* **Universal Import:** Drag-and-drop support for **PDF, CSV, and Excel** statements.
* **Messy Data Cleaning:** Automatically cleans cryptic bank descriptions (e.g., `UPI/23498234/STARBUCKS-MUMBAI`) into clean merchants (`Starbucks`) and categories (`Food & Dining`).
* **Regex + AI Hybrid:** Uses regex for speed and LLMs for edge cases.

### 💬 "Ask Expenzo" Chatbot
* **Context-Aware:** The chatbot has read-access to your entire financial graph.
* **Natural Language Queries:** * *"Can I afford a PS5 this month?"*
    * *"How much did I spend on Swiggy vs Zomato?"*
    * *"Forecast my savings for December."*

### 📊 Spatial Dashboard
* **3D Tilt UI:** Interactive cards that respond to mouse movement.
* **Adaptive Glassmorphism:** Real-time background blurs that work in both Light and Dark modes.
* **Action Plans:** Generates 3 specific, actionable steps daily (e.g., *"Spend less than ₹400 today to stay green"*).

---

## 📸 Screenshots

| **Spatial Dashboard** | **Smart Import** |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/600x300?text=Dashboard+Preview) <br> *Real-time financial overview with 3D tilt cards.* | ![Import](https://via.placeholder.com/600x300?text=Import+Preview) <br> *Parsing complex Indian bank statements instantly.* |

| **Guardian Insights** | **AI Chatbot** |
|:---:|:---:|
| ![Insights](https://via.placeholder.com/600x300?text=Insights+Preview) <br> *AI detecting anomalies and celebrating wins.* | ![Chat](https://via.placeholder.com/600x300?text=Chat+Preview) <br> *Conversational finance with deep context.* |

---

## 🛠️ Tech Stack

### Frontend
* ![React](https://img.shields.io/badge/-React_18-61DAFB?logo=react&logoColor=black) **React 18** - Component architecture.
* ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) **TypeScript** - Strict type safety for financial data.
* ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) **Vite** - Blazing fast build tool.
* ![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) **Tailwind CSS** - Styling engine.
* ![Shadcn](https://img.shields.io/badge/-Shadcn_UI-000000?logo=shadcnui&logoColor=white) **Shadcn UI** - Premium component library.

### Backend & Services
* ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) **Supabase** - PostgreSQL database, Auth, and Storage.
* ![Gemini](https://img.shields.io/badge/-Google_Gemini-8E75B2?logo=googlebard&logoColor=white) **Google Gemini** - LLM for categorization and chat.

### Utilities
* **Recharts:** For data visualization.
* **Lucide React:** For beautiful iconography.
* **Date-fns:** For temporal logic and forecasting.

---

## 📂 Project Architecture

```bash
src/
├── components/
│   ├── chat/          # "Ask Expenzo" chatbot implementation
│   ├── dashboard/     # 3D Cards (Status, Insights, Forecasts)
│   ├── rules/         # Bank statement upload & parsing dialogs
│   └── ui/            # Reusable Shadcn UI components
├── hooks/             # Custom hooks (useGuardianInsight, useAuth)
├── services/          # API layers (Supabase, AI Service)
├── utils/             # 🧠 THE BRAIN
│   ├── aiConfidence.ts         # Math for calculating insight reliability
│   ├── bankStatementParser.ts  # Regex logic for HDFC/SBI/ICICI formats
│   ├── insightGenerator.ts     # The Heuristic Engine for anomalies
│   └── pdfUtils.ts             # Client-side PDF extraction
└── App.tsx            # Route definitions

🚀 Getting Started
Prerequisites
Node.js v18+

pnpm (recommended) or npm

Installation
Clone the repo

Bash

git clone [https://github.com/abhirajkochale/Expenzo.git](https://github.com/abhirajkochale/Expenzo.git)
cd Expenzo
Install packages

Bash

pnpm install
# or npm install
Setup Environment Create a .env file in the root:

Code snippet

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
Run Development Server

Bash

pnpm run dev
🔮 Future Roadmap
[ ] Voice Interface: Talk to Expenzo using WebSpeech API.

[ ] Multi-Currency: Automatic conversion for international travel.

[ ] OCR Receipt Scanning: Upload photos of bills directly.

[ ] Investment Tracking: Integration with Indian stock brokers.

🤝 Contributing
Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📜 License
Distributed under the MIT License. See LICENSE for more information.

<div align="center">

Built with ❤️ by Abhiraj Kochale

Star this repo if you find it useful! ⭐

</div>
