# 🏥 PharmaLink — Smart Healthcare Supply Intelligence

[![Node.js](https://img.shields.io/badge/Auth-Node.js%20%2B%20Express-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Backend-Python%20%2B%20Flask-blue)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248)](https://www.mongodb.com/atlas)

---

## 📌 Overview

**PharmaLink** is a full-stack healthcare supply intelligence platform that connects pharmacies and patients through real-time disease monitoring, AI-powered demand forecasting, inventory management, and generic medicine discovery.

This is a working prototype with:
- A **React + Vite** frontend with dark mode, animations, and role-based dashboards
- A **Node.js + Express** authentication server with JWT, rate limiting, and MongoDB
- A **Python + Flask** backend with ML-based demand prediction and inventory management
- **MongoDB Atlas** as the shared database

---

## 🎯 Problem Statement

Healthcare supply chains struggle with:
- **Stockouts** during disease outbreaks due to poor demand forecasting
- **Price opacity** — patients don't know cheaper generic alternatives exist
- **Fragmented inventory** — pharmacies can't see or share surplus stock

PharmaLink solves all three with a unified platform for pharmacies and patients.

---

## 🚀 Features

### 🏪 Pharmacy / Store Dashboard
- 📊 **Disease Monitor** — Log and track outbreaks with case growth trends
- 🧠 **AI Demand Forecast** — Predict medicine demand based on disease spread (ML-powered)
- 📦 **Inventory Management** — Real-time stock tracking, edit, and restock (persisted to MongoDB)
- 🔄 **Stock Transfers** — Request/approve transfers between pharmacies
- 🤖 **Auto Redistribution** — AI-suggested transfers to balance coverage
- 📈 **Analytics** — Disease trends, generic adoption rates, top medicines

### 👤 Patient Portal
- 🔔 **Health Alerts** — Nearby outbreak notifications with severity levels
- 💊 **Medicine Search** — Find generic alternatives with exact savings (live DB data)
- 💰 **Purchase History** — Track spending and savings over time
- ✅ **Medical Disclaimer Flow** — Safe buy confirmation before ordering

### 🔐 Authentication
- JWT-based login for both patients and pharmacy stores
- PIN-based login for major pharmacy chains (Apollo, MedPlus, Jan Aushadhi)
- Email + password for registered local pharmacies
- Brute-force protection (account lockout after 5 failed attempts)
- Google OAuth ready (configure credentials to enable)

### 🛡️ System Health
- Live service status banner — shows Auth Server & Backend online/offline in real time
- Graceful demo mode fallback — all features work even if auth server is offline

---

## 🏗️ Architecture

```
User Browser (React + Vite — Port 8080)
       │
       ├──► Auth Server (Node.js + Express — Port 3001)
       │         └── MongoDB Atlas (pharmalink DB — users, profiles)
       │
       └──► Backend (Python + Flask — Port 5000)
                 └── MongoDB Atlas (pharmalink DB — medicines, inventory, diseases)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts |
| Auth Server | Node.js, Express, JWT, bcryptjs, Mongoose, Passport.js |
| Backend | Python, Flask, PyMongo, scikit-learn (demand prediction) |
| Database | MongoDB Atlas |
| Dev Tools | nodemon, dotenv, ESLint, Prettier |

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v18+
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/H2S-Project.git
cd H2S-Project
```

### 2. Configure environment variables

**Auth Server** (`auth-server/.env`):
```env
PORT=3001
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pharmalink
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Backend** (`backend/.env`):
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pharmalink
```

### 3. Install dependencies
```bash
# Auth Server
cd auth-server && npm install

# Frontend
cd ../frontend && npm install

# Backend
cd ../backend && pip install -r requirements.txt
```

### 4. Seed the database (first time only)
With the Flask backend running, hit these endpoints once:
```
POST http://localhost:5000/api/seed-master      # Seeds 15 medicines + 6 diseases
POST http://localhost:5000/api/seed-inventory   # Seeds inventory for PH001, PH002, PH003
POST http://localhost:5000/api/sync             # Syncs disease outbreak data
```

---

## ▶️ Running the Application

### Option A — One-click startup (Windows)
```
Double-click run.bat
```
This opens 3 terminal windows — Auth Server, Backend, and Frontend — all at once.

### Option B — Manual startup
```bash
# Terminal 1 — Auth Server
cd auth-server && npm start

# Terminal 2 — Backend
cd backend && python app.py

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Then open: **http://localhost:5173** (or the port shown by Vite)

---

## 🔑 Demo Credentials

| Role | Login Method | Credentials |
|---|---|---|
| Store — Apollo | PIN login | Store: Apollo, PIN: `5678` |
| Store — MedPlus | PIN login | Store: MedPlus, PIN: `1234` |
| Store — Jan Aushadhi | PIN login | Store: Jan Aushadhi, PIN: `9012` |
| Patient | Email + Password | Register a new account |

> If the auth server is offline, the app falls back to **demo mode** automatically — all features remain functional with local data.

---

## 📋 API Reference

### Auth Server (Port 3001)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Patient login |
| POST | `/auth/signup` | Patient registration |
| POST | `/auth/store-login` | Store login (PIN or email) |
| POST | `/auth/store-register` | Register local pharmacy |
| GET | `/api/health` | Health check |

### Backend (Port 5000)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/all-generics` | List all medicines with savings |
| GET | `/api/generic-medicine?brand=X` | Find generic for a brand |
| POST | `/api/predict-demand` | AI demand forecast |
| GET | `/api/inventory/<pharmacyId>` | Get pharmacy inventory |
| POST | `/api/inventory/restock` | Restock a medicine |
| POST | `/api/inventory/transfer` | Transfer between pharmacies |
| GET | `/api/stock-alerts` | Critical stock alerts |
| GET | `/api/redistribution` | AI redistribution suggestions |

---

## 🔮 Future Enhancements
- 💳 Payment gateway integration (Razorpay / Stripe)
- 📱 Mobile app (React Native)
- 🌐 Real-time disease data from WHO / India Gov APIs
- 📦 Full order management & tracking
- 🔔 Push notifications for outbreak alerts
- 🧪 Unit & integration test coverage

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you'd like to change.

---

## 📜 License

This project is created for educational and demonstration purposes.
