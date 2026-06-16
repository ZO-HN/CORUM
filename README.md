# CORUM
### Kabataang Magkakaugnay. Pamayanang Maunlad.

A Youth Information System or Governance Platform designed to help Sangguniang Kabataan (SK) officials through centralized youth profiling, analytics, program management, and data-driven decision-making.

This platform combines a desktop management application and a web-based registration portal that share a centralized cloud database, enabling efficient youth management, reporting, geographic insights, and community development planning.

---
## Vision

To provide every Barangay and Sangguniang Kabataan with a unified digital platform for managing youth information, planning impactful programs, and making evidence-based decisions for community development.(fr tho)

## System Architecture


```a hybrid Desktop-Web-Cloud architecture that combines the security and administrative capabilities of a desktop application with the accessibility of a web portal, all powered by a centralized cloud backend.
┌───────────────────────────────┐
│     PUBLIC USERS (YOUTH)      │
└──────────────┬────────────────┘
               │
               │
               ▼
┌──────────────────────────────────────┐
│   WEB REGISTRATION PORTAL            │
│                                      │
│•Youth Registration   • Event Reg     │
│•Public Announcements • Reg Tracking  │
└──────────────┬───────────────────────┘
               │
               │ Secure API Access
               │
               ▼
┌────────────────────────────────┐ 
│   SUPABASE CLOUD               │ ├────────────────────────────────┤
│ Authentication (Supabase Auth) │ 
│ PostgreSQL Database            │ 
│ Row-Level Security (RLS)       │ 
│ File Storage                   │ 
│ Real-Time Services             │ 
│ Analytics Data Layer           │ 
└───────────────┬────────────────┘
                │
                │ Secure API Access
                │
                ▼
┌──────────────────────────────────────────────────┐ 
│           CORUM DESKTOP MANAGEMENT APP           │ 
│                                                  │ 
│ • Dashboard                • Youth Profiling     │ 
│ • Registration Approval    • Program Management  │ 
│ • Event Management         • Attendance Tracking │ 
│ • Reports & Analytics      • GIS & Mapping       │ 
│ • User Administration      • Audit Logs          │ └──────────────────────────────────────────────────┘
```

---

## Key Features

* **Dashboard:** Provides a quick overview of youth statistics, registrations, programs, events, and key performance indicators.

* **Youth Profiling:** Maintains comprehensive youth records including personal information, education, employment status, skills, interests, and participation history.

* **Registration Management:** Handles online youth registration, application review, validation, and approval workflows.

* **Audit Logs:** Tracks user actions and system changes to ensure accountability and transparency.

* **User Management:** Controls user accounts, permissions, and role-based access across the system.

---

## 📂 Project Structure

```text
kk-app/
├── desktop/           # Tauri + React + TypeScript + Vite Desktop App
│   ├── src/           # React frontend (dashboard, list views, settings)
│   └── src-tauri/     # Rust configuration and build assets for Tauri
├── web/               # React + Vite Public Registration Web App
│   └── src/           # Portal frontend, forms, offline/network status
├── supabase/          # Database migrations and configurations
└── package.json       # Monorepo configuration and workspace scripts
```

---

##  Technology Stack

* **Frontend Framework:** React 19, TypeScript
* **Build Tools:** Vite 8, Tauri 2 (Desktop wrapper)
* **Styling:** Tailwind CSS, PostCSS
* **State & Validation:** Zod (schema verification)
* **Database & Auth:** Supabase (PostgreSQL, Realtime, Auth)
* **Charts & Analytics:** Recharts

---

##  Getting Started

### 1. Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+)
* [Rust & Tauri Toolchain](https://tauri.app/start/prerequisites/) (required for building the desktop app)
* [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local database work)

### 2. Installation

Clone the repository and install dependencies from the root directory:

```bash
# Clone the repository
git clone https://github.com/your-username/kk-app.git
cd kk-app

# Install monorepo dependencies
npm install
```

### 3. Setup Environment Variables

Create `.env` files for both applications with your Supabase credentials:

* **Desktop App:** `desktop/.env`
* **Web App:** `web/.env`

Inside each `.env` file, configure:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CACHE_SECRET=your-aes-cache-passphrase
```

---

##  Running the App

Run the workspace scripts from the root directory:

```bash
# Run the Desktop App in Vite developer mode
npm run dev:desktop

# Run the Web App in dev mode
npm run dev:web

# Run Tauri dev environment (starts native desktop wrapper)
npm run desktop:dev:exe

# Build Tauri executable installer
npm run desktop:build:exe
```

---

##  Database Migrations

Apply database migrations to your Supabase instance:

```bash
# Apply schema migrations to your local or remote Supabase DB
supabase db push
```

The database initialization schema is located in `supabase/migrations/2026052900_init.sql`.

---

## Security & PII Protection

All sensitive local data is kept safe using the `secureCache` utility layer.
1. The app derives a key using a random device salt combined with `VITE_CACHE_SECRET`.
2. All inputs containing user profiles are encrypted via `SubtleCrypto.encrypt()` using `AES-GCM`.
3. Logging out automatically wipes all PII cache keys (`kk_youth_profiles`, `kk_web_submissions`, `kk_current_user`, `kk_offline_queue`) from the browser's storage.