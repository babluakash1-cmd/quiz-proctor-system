# 🛡️ ECE Strict Proctored Online Assessment Platform
### Powered by Firebase Realtime Database + Socket.IO + React + Node.js

A high-integrity, real-time proctored online testing platform designed for examinations and competitive quizzes. Features strict automated anti-cheat monitoring, automatic violation disqualification, heartbeat audit, real-time WebSocket rankings, and an administrative control suite.

---

## 📁 Repository Structure

```text
quiz-proctor/
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── seedFirebase.js               <-- One-time database seed script
│   ├── server.js                     <-- Express + Socket.IO + Heartbeat Monitor
│   └── src/
│       ├── config/
│       │   └── firebase.js           <-- Firebase Admin & RTDB Initializer
│       ├── middleware/
│       │   └── auth.js               <-- JWT Admin Auth Guard
│       ├── routes/
│       │   ├── admin.js              <-- Admin API (Dashboard, Rooms, Qs, CSV, Telemetry)
│       │   └── candidate.js          <-- Candidate Flow (Join, Questions, Heartbeat, Violations)
│       ├── services/
│       │   ├── dbService.js          <-- Unified Firebase RTDB Adapter
│       │   └── rankingService.js     <-- Real-time Rank Engine & Leaderboards
│       └── socket/
│           └── socketHandler.js      <-- Room & Monitor WebSocket channels
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── config/
│       │   └── api.js                <-- Dynamic API & Socket URL (Local / Subdomain)
│       ├── context/
│       │   └── AuthContext.jsx       <-- Admin Session State
│       ├── hooks/
│       │   └── useProctoring.js      <-- Strict Multi-Vector Anti-Cheat Detector
│       └── pages/
│           ├── Landing.jsx           <-- Room Code Access Page
│           ├── JoinRoom.jsx          <-- Candidate Registration & Fullscreen Lock
│           ├── Quiz.jsx              <-- Countdown Quiz with Shuffled Choices
│           ├── Result.jsx            <-- Scorecard & Live Synchronized Leaderboard
│           └── admin/
│               ├── Login.jsx         <-- Admin Authentication
│               ├── Dashboard.jsx     <-- Aggregate Exam Metrics
│               ├── Questions.jsx     <-- Question CRUD & CSV Bulk Uploader
│               ├── Rooms.jsx         <-- Room Config & Data Reset
│               ├── Monitor.jsx       <-- Real-Time Violation Stream & Candidate Status
│               └── Ranks.jsx         <-- Room Rankings & CSV Exporter
├── nginx/
│   └── quiz-subdomain.conf           <-- Production Nginx Reverse Proxy Config
├── database.rules.json               <-- Secure Firebase RTDB Rules
├── ecosystem.config.js               <-- PM2 Process Manager Config
├── sample-questions.csv              <-- Example CSV template for importing questions
└── README.md
```

---

## 🔒 Strict Proctoring Features Enforced

1. **Tab & Window Visibility**: Instantly detects when a candidate switches browser tabs or minimizes the window.
2. **Window Blur**: Triggers immediate disqualification if the candidate focuses another app or system window.
3. **Fullscreen Enforcement**: Candidates must enter fullscreen to begin. Exiting fullscreen immediately terminates the exam.
4. **Developer Tools & Key Combos**: Blocks `F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U`, and `PrintScreen`.
5. **Contextual Locks**: Right-click, cut, copy, paste, and text drag-selection are completely disabled.
6. **Mobile AI / Search Protection**: Long-press gesture (>450ms) detection prevents mobile circle-to-search or AI overlays.
7. **Loss-of-Signal Heartbeat**: The server audits candidate pings every 5 seconds. If a connection drops or a tab is forcefully closed for more than 20 seconds, the exam automatically finalizes with previously answered questions.
8. **Tamper-Proof Questions**: Correct answers are stripped on the server before sending questions to the browser—inspecting the Network tab will not reveal solutions.

---

## 🔥 Step 1: Firebase Realtime Database Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and click **Add project** (e.g. `ece-quiz-portal`).
2. Go to **Build** → **Realtime Database** → Click **Create Database**.
   - Choose your closest region.
   - For Security Rules, select **Start in locked mode** (all reads/writes flow through our backend `firebase-admin` service account).
3. Copy your database URL:
   ```text
   https://your-project-id-default-rtdb.firebaseio.com/
   ```
4. Generate your Service Account Private Key:
   - Click the **Gear icon (Project Settings)** → **Service accounts** tab.
   - Click **Generate new private key** → Download the JSON file.
   - Rename the downloaded file to `serviceAccountKey.json` and place it in the `backend/` folder:
     ```text
     backend/serviceAccountKey.json
     ```

---

## 💻 Step 2: Local Development Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
```
Edit `backend/.env`:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=your_custom_jwt_secret_key_12345
CLIENT_URL=http://localhost:5173
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Populate the database with default rooms, admin accounts, and sample questions:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
Open a second terminal window:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Step 3: Subdomain Deployment Guide (e.g. `quiz.yourdomain.com`)

### 1. Point Your Domain's DNS
In your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.):
- Add an **A Record**:
  - **Type**: `A`
  - **Host / Name**: `quiz` (or your subdomain prefix)
  - **Points to / Value**: `YOUR_SERVER_PUBLIC_IP`
  - **TTL**: Auto / 300s

---

### 2. Prepare the Code on Your Server (Ubuntu / Debian VPS)
SSH into your server:
```bash
# Install Node.js (v18 or v20) & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Clone or copy quiz-proctor to /var/www/quiz-proctor
sudo mkdir -p /var/www/quiz-proctor
sudo chown -R $USER:$USER /var/www/quiz-proctor
cp -r /path/to/quiz-proctor/* /var/www/quiz-proctor/
```

---

### 3. Build Frontend & Configure Backend

```bash
# 1. Install & Build Frontend
cd /var/www/quiz-proctor/frontend
npm install
npm run build
# The production bundle is output to /var/www/quiz-proctor/frontend/dist

# 2. Configure Backend
cd /var/www/quiz-proctor/backend
cp .env.example .env
npm install --omit=dev
```

In `backend/.env`, set your production parameters:
```ini
PORT=5000
NODE_ENV=production
JWT_SECRET=use_a_strong_random_secret_string_here_32_characters
CLIENT_URL=https://quiz.yourdomain.com
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Upload your `serviceAccountKey.json` to `/var/www/quiz-proctor/backend/serviceAccountKey.json`.

If this is your first time deploying, seed the initial data:
```bash
npm run seed
```

---

### 4. Run the Backend with PM2
```bash
cd /var/www/quiz-proctor
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### 5. Configure Nginx & SSL
Copy the provided Nginx configuration template:
```bash
sudo cp /var/www/quiz-proctor/nginx/quiz-subdomain.conf /etc/nginx/sites-available/quiz.yourdomain.com
```

Edit the file to replace `quiz.yourdomain.com` with your real subdomain:
```bash
sudo nano /etc/nginx/sites-available/quiz.yourdomain.com
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/quiz.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain a free SSL Certificate with Let's Encrypt:
```bash
sudo certbot --nginx -d quiz.yourdomain.com
```

Your proctored portal is now live and fully secured at **`https://quiz.yourdomain.com`**!

---

## 🔑 Default Credentials & Room Codes

### Pre-Configured Rooms
- **Room 1 Code**: `ECE-R1` (Room 1 - Core Electronics, 30s per question)
- **Room 2 Code**: `ECE-R2` (Room 2 - Communication Systems, 30s per question)

### Pre-Configured Admin Accounts
- **Username**: `admin1` &nbsp;|&nbsp; **Password**: `adminpassword123`
- **Username**: `admin2` &nbsp;|&nbsp; **Password**: `adminpassword123`

---

## 📊 CSV Question Upload Format

You can upload questions in bulk via the Admin Question Bank page (`/admin/questions`).
Use a standard `.csv` file formatted with the following headers:

```csv
room_id,question_text,option_a,option_b,option_c,option_d,correct_option,marks
room_1,"What is the barrier potential of Silicon at 300K?","0.3 V","0.7 V","1.1 V","0.1 V",B,1
room_1,"Which configuration offers unity voltage gain?","Common Base","Common Emitter","Common Collector","None",C,1
room_2,"Nyquist rate for 4 kHz bandwidth is:","2 kHz","4 kHz","8 kHz","16 kHz",C,1
```
A complete ready-to-test CSV is located at `quiz-proctor/sample-questions.csv`.
