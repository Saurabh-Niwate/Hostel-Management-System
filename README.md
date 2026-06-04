# 🏨 AI-Powered Hostel Management System

A state-of-the-art, full-stack Hostel Management System built with **React**, **Node.js/Express**, and **PostgreSQL** to automate hostel operations, enhance student safety, and reduce canteen food waste.

🔗 **Live Frontend URL**: [https://hostel-management-system-mocha-nu.vercel.app/](https://hostel-management-system-mocha-nu.vercel.app/)  
🔗 **Live API URL**: [https://hostel-management-system-production-eb99.up.railway.app/](https://hostel-management-system-production-eb99.up.railway.app/)

---

## 🌟 Key Features

### 🛡️ 1. Touchless Gate Operations & AI Security
* **Twin-Engine Camera Scanner**: Combines a native browser `BarcodeDetector` (sub-50ms scans via hardware acceleration) with a dynamic `Tesseract.js` OCR fallback to read Student ID barcodes and printed text.
* **AI Anomalous Outing Detector**: Analyzes student entry/exit logs in real-time to alert wardens of behavioral anomalies:
  * Overstaying daily curfews (>6 hours checked out).
  * Recurring late arrivals (checking in within 30 minutes of curfew multiple times a week).
  * Late-night outings (departures between 10:00 PM and 5:00 AM).

### 🍽️ 2. Canteen AI Hub
* **Food Waste Portion Predictor**: Utilizes a mathematical regression model based on total active students, daily outings, approved leaves, and day-of-the-week factors to estimate optimal cooking portions. Features an interactive margin safety slider (0%–30%) and historical charts.
* **AI Recipe & Weekly Menu Planner**: Suggests 7-day weekly menu configurations according to selected dietary themes (*Balanced, High Protein, Budget, Low Carb*) and seasonal variations (*Summer, Winter, Monsoon*).
* **Automatic Calendar Sync**: Integrates a one-click calendar sync that writes the AI-generated weekly schedule directly to the database.

### ⚡ 3. Real-Time WebSockets & Notifications
* **Live Warden Feed**: Real-time Socket.io broadcast to update wardens the instant a student scans in/out at the gates.
* **Instant Student Alerts**: Push-toasts notify students instantly when their travel leaves are approved or rejected.
* **Email Gateways**: Sends HTML notification alerts directly to students and guardians.

### 📱 4. Responsive PWA Overhaul
* **Mobile Drawer Shell**: Adapts layout grids to a mobile-optimized side drawer and top navbar across all six portals (*Admin, Warden, Student, Technical Staff, Canteen Owner, Security*).
* **PWA Installability**: Custom web app manifest, neon branding icons, and a custom Service Worker for offline asset caching and rapid loading.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Socket.io-client, Axios, Tesseract.js.
* **Backend**: Node.js, Express, Socket.io (WebSockets), Multer (Image uploads), Nodemailer (Email gateways), Compression.
* **Database**: PostgreSQL (hosted on Neon Serverless Postgres).

---

## 🚀 Local Installation & Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL instance running locally (or connection string to Neon)

### 1. Clone the Repository
```bash
git clone https://github.com/Saurabh-Niwate/Hostel-Management-System.git
cd Hostel-Management-System
```

### 2. Configure Backend Env variables
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://your_db_url?sslmode=require

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Run backend locally:
```bash
cd backend
npm install
npm run dev
```

### 3. Configure Frontend Env variables
Create a `.env` file in the `/frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run frontend locally:
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Production Deployment Architecture

This project is deployed across a multi-platform cloud architecture:

### 🗄️ 1. Database (Neon.tech)
* Serverless PostgreSQL instance hosted in the **Singapore** (`ap-southeast-1`) region to ensure minimum latency.
* Schema and initial seed data are imported using the commands in `database/schema.sql` and `database/seed.sql`.

### ⚙️ 2. Backend API (Railway.app)
* Deployed as a persistent Node Web Service to support long-running WebSocket connections.
* **Root Directory**: `backend`
* **Env Variables**: Configured with `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and the routing port `PORT=5000`.

### 💻 3. Frontend (Vercel)
* Static Single-Page Application (SPA) hosting with automated builds.
* **Root Directory**: `frontend`
* **Env Variables**: Configured with `VITE_API_BASE_URL` pointing to the public Railway API URL.

---

## 👥 Role-Based Access Credentials (Demo)

Use these credentials to log into different portals:

| Role | Username / ID | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Admin** | `Admin@gmail.com` | `admin123` | Admin Portal |
| **Student** | `STU001` | `student123` | Student Dashboard |
| **Technical Staff** | `TES001` | `tech123` | User/Fee Management |
| **Warden** | `WAR001` | `warden123` | Leave/Anomaly Dashboard |
| **Security** | `SEC001` | `security123` | Barcode/OCR Camera Gate Scanner |
| **Canteen Owner** | `CAN001` | `canteen123` | Canteen Menu & AI Hub |
