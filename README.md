# CORUM
### Kabataang Magkakaugnay. Pamayanang Maunlad.

> **⚠️ PROTOTYPE / PROOF OF CONCEPT**
> This project is currently in **active development** and is **not yet deployed for production use**. It serves as a working prototype to demonstrate the concept of a unified SK youth governance platform. Features may be incomplete, unstable, or subject to significant changes.

![Status](https://img.shields.io/badge/Status-Prototype-orange)
![Version](https://img.shields.io/badge/Version-0.1.0--alpha-blue)
![License](https://img.shields.io/badge/License-Not%20Yet%20Licensed-lightgrey)

---

## 📋 About

CORUM is a **proof-of-concept** Youth Information System designed to explore how Sangguniang Kabataan (SK) officials could leverage technology for centralized youth profiling, analytics, program management, and data-driven decision-making.

This prototype demonstrates the feasibility of combining a desktop management application with a web-based registration portal through a shared cloud database — intended to eventually enable efficient youth management, reporting, geographic insights, and community development planning.

> **Note:** This is an academic/capstone-stage project. The current implementation represents our initial exploration of the concept and is not representative of a final product.

---

## 🎯 Vision

To explore and validate the concept of providing every Barangay and Sangguniang Kabataan with a unified digital platform for managing youth information, planning impactful programs, and making evidence-based decisions for community development.

---

## 📌 Current Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Desktop App (Tauri) | 🟡 In Progress | Core UI scaffolded, key views under development |
| Web Registration Portal | 🟡 In Progress | Basic registration flow implemented |
| Supabase Backend | 🟡 In Progress | Initial schema defined, RLS policies being refined |
| Dashboard & Analytics | 🔴 Early Stage | Placeholder charts, data pipeline not finalized |
| GIS & Mapping | 🔴 Planned | Not yet implemented |
| Program Management | 🔴 Planned | Not yet implemented |
| Attendance Tracking | 🔴 Planned | Not yet implemented |

---

## 🏗️ Proposed System Architecture

> *This diagram represents the **target architecture** — not all components are fully functional yet.*

```
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
                │ 
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

## ✅ Implemented Features (So Far)

* **Dashboard (WIP):** Basic overview of youth statistics and registrations — charts and KPIs are placeholder/demo data.

* **Youth Profiling (WIP):** Initial schema for youth records including personal information, education, and employment status.

* **Registration Management (WIP):** Basic online youth registration flow with review capabilities.

* **Audit Logs (Partial):** Framework for tracking user actions — logging coverage is incomplete.

* **User Management (Partial):** Basic user accounts and role-based access scaffolding.

---

## 🚧 Known Limitations

- **Not production-ready** — This prototype has not undergone security audits, performance testing, or accessibility compliance review.
- **Demo data** — Some dashboard components use hardcoded or seeded sample data.
- **Limited error handling** — Edge cases and failure scenarios are not fully covered.
- **Single-barangay scope** — Multi-barangay support is planned but not yet implemented.
- **No automated testing** — Unit and integration test suites have not been set up yet.
- **Desktop builds are dev-only** — No signed or distributable installer has been produced.

---

## 📂 Project Structure

```text
CORUM/
├── desktop/           # Tauri + React + TypeScript Desktop Admin App
│   ├── src/           # Views, Layouts, Database Contexts, Hooks
│   ├── src-tauri/     # Rust build & configuration for Tauri windowing
│   └── package.json   # Desktop app configuration and scripts
├── web/               # React + Vite Public Registration Web App
│   ├── src/           # Sign-up forms, validation schema, secure syncer
│   └── package.json   # Web portal configuration and scripts
├── shared/            # Shared utilities and types across apps
├── supabase/          # Cloud Backend & Database Configuration
│   └── migrations/    # SQL schemas (combined core, desktop, & web schemas)
├── README.md          # This file
├── package.json       # Monorepo workspaces definition
└── package-lock.json  # Dependency lock file
```

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 19, TypeScript
* **Build Tools:** Vite 8, Tauri 2 (Desktop wrapper)
* **Styling:** Tailwind CSS, PostCSS
* **State & Validation:** Zod (schema verification)
* **Database & Auth:** Supabase (PostgreSQL, Realtime, Auth)
* **Charts & Analytics:** Recharts

---

## 🚀 Getting Started (Development)

> ⚠️ These instructions are for **local development and testing only**. This project is not ready for deployment.

### 1. Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+)
* [Rust & Tauri Toolchain](https://tauri.app/start/prerequisites/) (required for building the desktop app)
* [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local database work)

### 2. Installation

Clone the repository and install dependencies from the root directory:

```bash
# Clone the repository
git clone https://github.com/ZO-HN/CORUM.git
cd CORUM

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

## ▶️ Running the App (Dev Mode)

Run the workspace scripts from the root directory:

```bash
# Run the Desktop App in Vite developer mode
npm run dev:desktop

# Run the Web App in dev mode
npm run dev:web

# Run Tauri dev environment (starts native desktop wrapper)
npm run desktop:dev:exe

# Build Tauri executable installer (dev builds only)
npm run desktop:build:exe
```

---

## 🗄️ Database Migrations

Apply database migrations to your Supabase instance:

```bash
# Apply schema migrations to your local or remote Supabase DB
supabase db push
```

The database initialization schema is located in `supabase/migrations/2026052900_init.sql`.

---

## 🔐 Security & PII Protection (Planned)

> **Note:** The security measures below are implemented at a basic level. A full security audit has **not** been conducted. Do not use this prototype with real personal data.

The `secureCache` utility layer provides baseline local data protection:
1. The app derives a key using a random device salt combined with `VITE_CACHE_SECRET`.
2. All inputs containing user profiles are encrypted via `SubtleCrypto.encrypt()` using `AES-GCM`.
3. Logging out automatically wipes all PII cache keys (`kk_youth_profiles`, `kk_web_submissions`, `kk_current_user`, `kk_offline_queue`) from the browser's storage.

---

## 🗺️ Roadmap

This is a rough plan for future development — timelines are tentative:

- [ ] Complete core desktop dashboard with live data
- [ ] Finalize web registration portal with full validation
- [ ] Implement program & event management modules
- [ ] Add GIS mapping for youth geographic distribution
- [ ] Implement attendance tracking system
- [ ] Set up automated testing (unit + integration)
- [ ] Conduct security audit & hardening
- [ ] Multi-barangay support
- [ ] Produce signed desktop installer for pilot deployment
- [ ] Pilot testing with a partner barangay SK council

---

## 🤝 Contributing

This project is in its early stages. If you're interested in contributing or have feedback, feel free to open an issue or reach out.

---

<p align="center">
  <sub>🚧 This is a prototype under active development — not a production system. 🚧</sub>
</p>