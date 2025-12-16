# HAS_URL Shortener

A high-performance, hyper-aesthetic URL shortener built with modern web technologies. This project focuses on minimalism, speed, and AI integration to provide a seamless user experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-purple)

## 🌟 The Vision

HAS_URL was conceptualized to break away from cluttered, utility-focused tools. The goal was to create an interface that feels like a developer tool from the future—strict monochrome palette, grid textures, and instant interactions.

## 🚀 Features

*   **Monochrome Aesthetic:** A strict black-and-white design language using Tailwind CSS, featuring subtle grid backgrounds and crisp typography (Inter, Space Grotesk, JetBrains Mono).
*   **Persistent Storage:** Integrates with **Supabase** for robust data persistence, click tracking, and history management.
*   **AI-Powered Smart Aliases:** Utilizes the **Google GenAI SDK (Gemini 2.5 Flash)** to analyze URLs and suggest creative, context-aware short codes automatically.
*   **Instant Redirection:** Optimized routing logic for minimal latency during URL resolution.
*   **Mock Mode:** Automatically degrades to an in-memory storage system if database credentials are not detected, allowing for instant testing.
*   **Clipboard Integration:** One-click copy with visual feedback animations.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19 (via Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Backend/Database:** Supabase (PostgreSQL)
*   **Artificial Intelligence:** Google Gemini API (`@google/genai`)
*   **Icons:** Lucide React

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/monishprasanna/URL-SHORT.git
    cd has-url
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You will need keys from [Supabase](https://supabase.com) and [Google AI Studio](https://aistudio.google.com).

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    API_KEY=your_google_gemini_api_key
    ```

4.  **Database Setup (Supabase)**
    Run the following SQL in your Supabase SQL Editor:

    ```sql
    create table urls (
      id uuid default gen_random_uuid() primary key,
      original_url text not null,
      short_code text unique not null,
      created_at timestamptz default now(),
      clicks int default 0,
      title text
    );
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🏗️ Architecture Note

The application uses a service-layer pattern (`urlService.ts`, `geminiService.ts`) to separate logic from the UI. This ensures that the application can switch between "Mock Mode" and "Production Mode" seamlessly without breaking the user interface.

## 🤝 Contribution

This project was architected by Monish Prasanna S with implementation assistance from AI. Pull requests are welcome.
