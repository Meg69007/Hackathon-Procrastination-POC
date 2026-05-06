# 😤 La Flemme — Anti-Procrastination App

> **Built in 10 hours at a hackathon.**  
> An app that fights procrastination — not with motivation, but with pressure.

---

## What is La Flemme?

**La Flemme** (French slang for laziness) is a mobile + web app that keeps you accountable by doing the one thing no productivity app dares to do: **call your phone and refuse to stop until you finish your task.**

Miss a deadline? La Flemme calls you. Ignores you? She calls again. Every two minutes. Until it's done.

---

## ✨ Features

### 📋 Task Management
- Create tasks with a **title**, **description**, **deadline**, and **priority** (high / normal / low)
- Break tasks down into **concrete steps** with optional time estimates
- Sortable task list by **date**, **priority**, or **completion progress**
- Visual progress bars and overdue warnings

### ⏱ Pomodoro Focus Cycles
- Built-in **Pomodoro timer** with customizable durations
  - 🔥 Focus (default 25 min)
  - ☕ Short break (default 5 min)
  - 🌊 Long break every 4 cycles (default 15 min)
- Per-task cycle sessions — launch directly from a task
- Ambient sounds on web (rain, lo-fi, etc.)
- Vibration feedback on mobile at phase transitions

### 😤 La Flemme — The Accountability System
- When a task passes its deadline and isn't completed, **La Flemme activates**
- A Python backend uses **Twilio** to place automated phone calls to your number
- The call plays a French voice message: *"You have an overdue task. Finish it. Now."*
- Calls repeat every **2 minutes** until you mark the task as done
- Can be triggered **manually** or **automatically** at the deadline
- Escalation schedule: 2h → 1h → 30min → 15min intervals as the delay grows
- Optional: save "La Flemme 😤" as a contact so you know who's calling

### 🎮 Gamification
- Earn **XP** for completing steps (+10 XP) and tasks (+50 XP)
- 8 **levels** from *"Full Flemme"* to *"La Flemme vaincue"* (XP-based)
- **Daily streaks** with motivational messages
- **Badges** unlocked by milestones (first task, 5-day streak, 1000 XP, etc.)
- **Stats screen** with weekly activity chart and key metrics

### ⚙️ Settings
- Phone number for receiving La Flemme calls
- Backend URL configuration
- Customizable Pomodoro durations
- Auto-activation toggle for La Flemme
- Demo data loader (10 realistic tasks pre-filled)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile / Web | React Native + Expo (iOS, Android, Web) |
| Routing | Expo Router (file-based) |
| State Management | Zustand |
| Local Storage | AsyncStorage |
| Backend | Python + FastAPI |
| Phone Calls | Twilio |
| Notifications | Expo Notifications |

---

## 📁 Project Structure

```
.
├── backend/               # Python FastAPI backend
│   ├── main.py            # API server + Twilio call loop
│   ├── requirements.txt
│   └── .env.example
└── mobile/                # Expo React Native app
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.js   # Task list (home screen)
    │   │   └── stats.js   # XP, streaks, badges
    │   ├── task/
    │   │   ├── create.js  # New task form
    │   │   └── [id].js    # Task detail & step completion
    │   ├── cycle/
    │   │   └── [id].js    # Pomodoro timer screen
    │   ├── onboarding.js  # First-launch flow
    │   └── settings.js    # App settings
    ├── stores/
    │   ├── taskStore.js   # Task state (Zustand)
    │   ├── timerStore.js  # Pomodoro timer state
    │   └── userStore.js   # User prefs & phone number
    ├── lib/
    │   ├── flemme.js      # Twilio call trigger helpers
    │   ├── notifications.js
    │   ├── ambientSound.js
    │   └── storage.js
    └── components/
        ├── NavBar.js
        └── CelebrationOverlay.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Python 3.10+
- A [Twilio](https://twilio.com) account (for phone calls)
- Expo Go app on your phone (optional, for native testing)

---

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and fill in your environment variables
cp .env.example .env
```

Edit `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+33700000000   # Your Twilio number
```

Start the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

---

### Mobile / Web Setup

```bash
cd mobile

# Install dependencies
npm install

# Start the Expo dev server
npm start

# Or target a specific platform
npm run android
npm run ios
npm run web
```

Open the app in Expo Go (scan QR code) or in your browser.

In **Settings**, set your phone number and the backend URL (e.g. `http://YOUR_IP:8000`).

---

## 🔌 Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/flemme/start` | Start a call loop for a task |
| `DELETE` | `/flemme/stop/{task_id}` | Stop the call loop |
| `GET` | `/flemme/active` | List active call loops |
| `GET` | `/health` | Health check |

**`POST /flemme/start` body:**
```json
{
  "task_id": "abc123",
  "user_phone": "+33612345678",
  "interval_minutes": 2
}
```

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Task list** | View all pending & completed tasks, sortable by date / priority / progress |
| **Task detail** | Check off steps, launch a focus cycle, manually trigger La Flemme |
| **Create task** | Form with title, deadline, steps and time estimates |
| **Focus cycle** | Pomodoro timer linked to the current task |
| **Stats** | XP level, streak, weekly chart, badges |
| **Settings** | Phone number, Pomodoro config, La Flemme toggle |
| **Onboarding** | 5-step first-launch introduction |

---

## 🧑‍💻 Development Notes

- The app runs fully **offline** — tasks are stored locally via AsyncStorage.  
  The backend is only required when La Flemme needs to place a call.
- The UI language is **French** (this was a French hackathon project).
- Demo data can be loaded from the empty state screen or from Settings.

---

## 📄 License

MIT — built during a hackathon, use freely.
