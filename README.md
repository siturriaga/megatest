# STRIDE v2.0 - School Management System

Digital hall passes, behavioral tracking, house points, and real-time analytics for modern educators.

## 🚀 Quick Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Manual Deployment Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/stride-app.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure Environment Variables**
   In Netlify: Site Settings → Build & Deploy → Environment
   
   Add these variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Firebase Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## 🔑 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication → Google provider
3. Add your Netlify domain to authorized domains
4. Create Firestore database in production mode
5. Deploy the included `firestore.rules`

## 📱 Features

- **Hall Pass System** - Digital passes with capacity tracking and waitlist
- **Infractions Panel** - MTSS-integrated behavioral logging
- **Incentives** - House point system with 40/60 split
- **Safety** - Lockdown mode and conflict group management
- **Communication** - School-wide broadcasts with priority levels
- **Analytics** - Real-time dashboards and MTSS reports
- **Sandbox Mode** - Training environment with zero database costs

## 🎨 Themes

- **Aero** - Light, clean, airy
- **Obsidian** - Dark mode with glowing accents (default)
- **Eclipse** - OLED black with gold accents

## 👤 User Roles

| Role | Level | Capabilities |
|------|-------|--------------|
| SUPER_ADMIN | 100 | Create schools, manage all |
| SCHOOL_ADMIN | 80 | Manage school, lockdown |
| TEACHER | 50 | Issue passes, log behavior |
| HALL_MONITOR | 30 | Verify passes, returns |
| KIOSK | 10 | Tardy logging only |

## 🔒 Domain Restriction

Access is restricted to `@dadeschools.net` accounts by default.
Modify in `hooks/useStrideState.js`:

```javascript
const ALLOWED_DOMAIN = 'dadeschools.net';
const SUPER_ADMIN_EMAIL = 'your-admin@email.com';
```

## 📦 Tech Stack

- Next.js 14
- React 18
- Firebase (Auth + Firestore)
- Tailwind CSS
- Recharts
- Lucide Icons

## 🛠️ Local Development

```bash
npm install
npm run dev
```

## 📄 License

Built for Miami-Dade County Public Schools.

---

Made with ❤️ for educators
