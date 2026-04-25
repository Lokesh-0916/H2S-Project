# MedSmart — Healthcare Supply Intelligence

> Real-time disease intelligence, AI-powered demand forecasting, and generic medicine discovery — for pharmacies and patients.

---

## Project Structure

```
H2S-Project/
├── auth-server/          # Node.js / Express authentication API (port 3001)
│   ├── data/             # Static store data & MongoDB data directory
│   ├── middleware/        # Passport.js OAuth, JWT auth, rate limiter
│   ├── models/           # Mongoose models (User, etc.)
│   ├── routes/           # Auth, profile, store routes
│   ├── .env              # Secret keys & DB URI (never commit)
│   ├── .env.example      # Template for .env
│   └── server.js         # Entry point
│
├── backend/              # Python / Flask AI & data API (port 5000)
│   ├── app.py            # Entry point
│   └── requirements.txt  # Python dependencies
│
├── frontend/             # React / Vite / TailwindCSS UI (port 8080)
│   ├── src/
│   │   ├── medsmart/     # App core (Login, Shell, AppContext)
│   │   │   ├── patient/  # Patient dashboard sections
│   │   │   ├── store/    # Pharmacy dashboard sections
│   │   │   └── shared/   # Reusable UI components & Toast
│   │   ├── routes/       # TanStack Router routes
│   │   └── styles.css    # Design system & Tailwind config
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── run.bat               # One-click launcher for all three services
└── start-auth.bat        # Standalone launcher for auth server + MongoDB
```

---

## Quick Start

### Option A — Launch everything at once
```bat
run.bat
```
This starts the Auth Server, Python Backend, and Vite Frontend in separate windows.

### Option B — Run services individually

**Auth Server**
```bash
cd auth-server
npm install
node server.js
```

**Python Backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Services & Ports

| Service     | Port  | Tech                        |
|-------------|-------|-----------------------------|
| Frontend    | 8080  | React, Vite, TailwindCSS v4 |
| Auth Server | 3001  | Node.js, Express, Passport  |
| Backend     | 5000  | Python, Flask               |
| MongoDB     | 27017 | MongoDB                     |

---

## Environment Variables

Copy `auth-server/.env.example` to `auth-server/.env` and fill in your values:

```env
MONGO_URI=mongodb://localhost:27017/medsmart
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> ⚠️ Never commit `.env` files — they are gitignored.
