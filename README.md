# KKSync (corum-monorepo)

An offline-first, secure, and real-time Sangguniang Kabataan (SK) Youth Profiling & Information System. It is designed to empower local youth councils (SK) in profiling residents, tracking program attendance, managing documents, and checking real-time analytics.

---

## 🌟 Key Features

* **Offline-First & Secure Sync:** Built-in offline queue that buffers actions locally when offline. When connection returns, it syncs sequentially using a Last-Write-Wins (LWW) conflict resolution policy.
* **Encrypted Cache at Rest:** Protects Personally Identifiable Information (PII) in `localStorage` by encrypting all local data using **AES-GCM (256-bit)** with PBKDF2 key derivation.
* **Tauri Desktop Client:** A dedicated desktop application for SK administrators and staff to manage data locally or sync in real-time.
* **Public Registration Web Portal:** A lightweight web portal for youth residents to register, check status, and submit their profile details.
* **Supabase Integration:** Realtime Postgres database listeners, authentication layers, and schema migrations.

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

## 🛠️ Technology Stack

* **Frontend Framework:** React 19, TypeScript
* **Build Tools:** Vite 8, Tauri 2 (Desktop wrapper)
* **Styling:** Tailwind CSS, PostCSS
* **State & Validation:** Zod (schema verification)
* **Database & Auth:** Supabase (PostgreSQL, Realtime, Auth)
* **Charts & Analytics:** Recharts

---

## 🚀 Getting Started

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

## 💻 Running the App

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

## 💾 Database Migrations

Apply database migrations to your Supabase instance:

```bash
# Apply schema migrations to your local or remote Supabase DB
supabase db push
```

The database initialization schema is located in `supabase/migrations/2026052900_init.sql`.

---

## 🔒 Security & PII Protection

All sensitive local data is kept safe using the `secureCache` utility layer.
1. The app derives a key using a random device salt combined with `VITE_CACHE_SECRET`.
2. All inputs containing user profiles are encrypted via `SubtleCrypto.encrypt()` using `AES-GCM`.
3. Logging out automatically wipes all PII cache keys (`kk_youth_profiles`, `kk_web_submissions`, `kk_current_user`, `kk_offline_queue`) from the browser's storage.
