# HAS_URL Shortener

A high-performance, hyper-aesthetic URL shortener built with modern web technologies. This project focuses on minimalism, speed, and AI integration to provide a seamless user experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-Database-orange)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-purple)

## 🌟 The Vision

HAS_URL was conceptualized to break away from cluttered, utility-focused tools. The goal was to create an interface that feels like a developer tool from the future—strict monochrome palette, grid textures, and instant interactions.

## 🚀 Features

*   **Monochrome Aesthetic:** A strict black-and-white design language using Tailwind CSS, featuring subtle grid backgrounds and crisp typography (Inter, Space Grotesk, JetBrains Mono).
*   **Persistent Storage:** Integrates with **Firebase Firestore** for robust data persistence, click tracking, and history management.
*   **AI-Powered Smart Aliases:** Utilizes the **Google GenAI SDK (Gemini 2.5 Flash)** to analyze URLs and suggest creative, context-aware short codes automatically.
*   **Instant Redirection:** Optimized routing logic for minimal latency during URL resolution.
*   **Mock Mode:** Automatically degrades to an in-memory storage system if database credentials are not detected, allowing for instant testing.
*   **Clipboard Integration:** One-click copy with visual feedback animations.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 18 (via Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Backend/Database:** Firebase Firestore
*   **Artificial Intelligence:** Google Gemini API (`@google/genai`)
*   **Icons:** Lucide React

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/monishprasanna/URL-SHORT.git
    cd URL-SHORT
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You will need keys from [Firebase Console](https://console.firebase.google.com) and [Google AI Studio](https://aistudio.google.com).

    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    API_KEY=your_google_gemini_api_key
    ```

4.  **Firestore Setup**
    - Go to [Firebase Console](https://console.firebase.google.com)
    - Create a new project or use existing one
    - Enable Cloud Firestore
    - Create a collection named `urls`
    - Set security rules (for demo, allow public read/write; for production, add authentication)

    **Firestore Collection Schema:**
    ```
    Collection: urls
    
    Document Fields:
      - id: string (UUID)
      - original_url: string
      - short_code: string (create index for queries)
      - created_at: timestamp
      - clicks: number
      - title: string (nullable)
    ```

    **Recommended Security Rules (Demo):**
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /urls/{document=**} {
          allow read, write: if request.auth == null;
        }
      }
    }
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🏗️ Architecture Note

- **Frontend:** React + TypeScript with Vite for instant HMR and optimized builds.
- **Backend:** Firebase Firestore for real-time data sync and scalability.
- **Service Layer:** `services/urlService.ts` handles all database operations with fallback to mock mode.
- **Components:** Minimal, single-file React component structure for simplicity.

## 🔄 Migration from Supabase

This project was migrated from Supabase to Firebase. The main changes:

- Replaced `@supabase/supabase-js` with `firebase` SDK
- Updated `firebaseClient.ts` for Firebase initialization
- Refactored `services/urlService.ts` to use Firestore operations
- Updated environment variables to Firebase config

## 📝 License

MIT
