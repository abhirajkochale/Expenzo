# 🛡️ Expenzo: AI-Powered Financial Guardian

![Expenzo Banner](https://via.placeholder.com/1200x400.png?text=Expenzo+Dashboard+Preview)
> **Your personal AI financial analyst that predicts trends, detects anomalies, and helps you build wealth.**

[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🌟 Introduction

**Expenzo** is not just an expense tracker; it's a financial **Guardian**. Unlike traditional apps that just log data, Expenzo uses local AI models to analyze your bank statements, predict future spending risks, and offer real-time conversational insights.

Whether you're trying to spot subscription traps, forecast your month-end balance, or just chat with your data, Expenzo makes it effortless.

## 🚀 Key Features

### 🤖 Guardian AI & Chatbot
* **Conversational Finance:** Ask *"Can I afford a vacation next month?"* or *"How much did I spend on food vs. travel?"* and get instant, data-backed answers.
* **Anomaly Detection:** The Guardian Engine scans transaction patterns to flag unusual spending or recurring billing spikes.

### 📄 Smart Statement Parser
* **Universal Upload:** Drag & drop PDF or CSV bank statements (HDFC, SBI, ICICI, etc.).
* **AI Categorization:** Automatically cleans messy bank descriptions (e.g., `POS 45223 STARBUCKS`) into clean categories like **Food & Dining**.

### 📊 Predictive Dashboard
* **Spending Forecast:** Uses linear regression to predict if you will go over budget before it happens.
* **Action Plans:** Generates actionable "Smart Steps" (e.g., *"Reduce dining out by ₹500 to stay on track"*).
* **3D Spatial UI:** A beautiful, modern interface built with **Shadcn UI** and glassmorphism effects.

## 🛠️ Tech Stack

* **Frontend:** React (Vite) + TypeScript
* **Styling:** Tailwind CSS + Shadcn UI + Lucide Icons
* **Backend / DB:** Supabase (PostgreSQL + Auth)
* **AI Logic:** Custom TypeScript Inference Engine (`src/utils/aiService.ts`)
* **State Management:** React Context API + Custom Hooks

## 📂 Project Structure

```bash
src/
├── components/
│   ├── chat/          # Guardian Chatbot components
│   ├── dashboard/     # Insight Cards, Charts, Status widgets
│   ├── rules/         # Transaction parsing logic
│   └── ui/            # Reusable Shadcn UI components
├── hooks/             # Custom hooks (useGuardianInsight, etc.)
├── pages/             # Main application views (Dashboard, Transactions)
├── services/          # AI Service integration layers
├── utils/             # Core logic engines
│   ├── bankStatementParser.ts  # Regex & Logic for PDFs
│   ├── insightGenerator.ts     # The "Brain" of Guardian
│   └── aiConfidence.ts         # Explainability scoring
└── App.tsx            # Main entry point
