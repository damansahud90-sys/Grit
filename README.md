# 🔥 Grit — Personal Productivity PWA

> **Small steps. Big wins.**

Grit is a beautiful, mobile-first productivity app built as a Progressive Web App. It helps you track goals, focus with timers, journal your progress, and stay consistent — all with a warm, cozy café aesthetic.

---

## ✨ Features

- **📊 Dashboard** — Daily overview with streak tracking, quick stats, and motivational quotes
- **🎯 Goals** — Create daily/weekly/monthly goals with priority levels and sub-tasks
- **⏱️ Focus Timer** — Pomodoro-style timer with wake lock, session logging, and efficiency tracking
- **📈 Stats** — Hourly rhythm charts, weekly flow, monthly heatmap, and category breakdowns
- **📝 Diary** — Morning intentions, evening reflections, mistake log, and pinned notes
- **🔐 Auth** — Email/password, Google sign-in, or guest mode
- **☁️ Cloud Sync** — Firestore backup when signed in, local storage for guests
- **🌙 Dark Mode** — Beautiful light and dark themes
- **📱 Installable** — Add to home screen on any device

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI Framework |
| Vite | Build tool |
| Zustand | State management (persisted) |
| Firebase | Auth + Firestore |
| Framer Motion | Animations |
| Recharts | Data visualization |
| Lucide React | Icons |
| Vite PWA Plugin | Service worker + installability |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (for auth & sync)

### Installation

```bash
# Clone the repo
git clone https://github.com/damansahud90-sys/Grit.git
cd Grit

# Install dependencies
npm install

# Create .env file with your Firebase config
# See .env.example for required variables

# Start dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Build for Production

```bash
npm run build
```

## 📱 Install on Your Phone

1. Open the deployed app URL in Chrome/Safari
2. Tap **"Add to Home Screen"** (or the install icon in the address bar)
3. Grit will work like a native app — offline support included!

## 📸 Screenshots

| Dashboard | Focus Timer | Goals | Stats |
|-----------|-------------|-------|-------|
| 🏠 Daily overview | ⏱️ Pomodoro timer | 🎯 Task management | 📊 Analytics |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ by [Daman Das Sahu](https://github.com/damansahud90-sys)**
