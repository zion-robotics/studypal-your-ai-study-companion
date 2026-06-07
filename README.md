# StudyPal — Your AI-Powered Study Companion

> **The study pal every student always needed.** AI-powered study accountability for African students who work while they study. Study smarter, even offline.

**Live Demo:** [studypal-your-ai-study-companion.vercel.app](https://studypal-your-ai-study-companion.vercel.app)

---

## 📋 Overview

StudyPal is a full-stack AI-powered study application designed specifically for students in Africa who balance work, school, and life. Built for the **YPIT Hackathon 2026 — Education Track**, StudyPal transforms the study experience by:

- 📝 **Structuring your notes** into bite-size lessons using AI
- 🎧 **Reading content aloud** for hands-free learning while you commute, work, or cook
- ❓ **Quizzing you instantly** with voice-based comprehension checks
- 📊 **Tracking real progress** with Daily Pulse — actual coverage data, no motivation quotes
- 🔌 **Working offline** after the first load — no internet required
- 🎯 **Adapting to your reality** with "Life Happened Mode" that replans when you miss days

**Beta tested by 200+ students** from UNILAG, LASU, UI, Covenant, and ABU with a **4.9/5 rating**.

---

## 🎯 The Problem We Solve

### Why Students Struggle

1. **Inconsistent Internet** — NEPA goes. Data finishes. Study apps shouldn't punish you for that.
2. **No One Checking In** — Self-study is lonely. Without accountability, weeks blur into nothing.
3. **Life Gets in the Way** — You work, you commute, you cook. Most planners weren't built for real students.

StudyPal is built to work for **any learner** — university students, polytechnic students, JAMB/WAEC candidates, or self-studiers. It fits into your real schedule, not the other way around.

---

## ✨ Core Features

### 1. **Voice Lessons** 🎧
- AI reads your content aloud in 10–15 minute sessions
- Perfect for learning while doing chores, commuting, or working

### 2. **Smart Study Planner**
- Personalized micro-sessions adapted to your real schedule
- Automatically reschedules when life happens

### 3. **Comprehension Checks** ❓
- 3 quick voice-based or text questions after every session
- Instant feedback — real understanding, not just recall

### 4. **Daily Pulse** 📊
- Real progress data day by day
- Streak tracking, average performance, and days remaining
- Zero guilt-tripping if you miss a day

### 5. **Offline Mode** 🔌
- Full functionality without internet after the first load
- Syncs automatically when you're back online

### 6. **AI-Powered Content Structuring** 🤖
- Upload lecture notes, past questions, or PDFs
- AI structures them into 5–7 ordered lesson topics
- Groq + Aethex power the intelligence

---

## 🛠 Tech Stack

**99.1% TypeScript** | 0.9% Other

### Frontend & Framework
- **React 19.2.0** — Modern UI with Concurrent features
- **TanStack Start** — Full-stack framework with file-based routing
- **TanStack Router** — Type-safe routing & query management
- **TanStack React Query** — Server state management

### UI & Animation
- **Radix UI** — Unstyled, accessible components (accordion, dialog, dropdown, etc.)
- **Tailwind CSS 4.2** — Utility-first styling
- **Framer Motion** — Smooth animations and transitions
- **Lucide React** — Icon library

### Forms & Validation
- **React Hook Form** — Efficient form handling
- **Zod** — Runtime TypeScript schema validation
- **Class Variance Authority** — Component variant management

### Backend & Database
- **Supabase** — PostgreSQL database + authentication
- **Groq** — AI content structuring (LLM inference)

### Build & Deployment
- **Vite 7.3.1** — Lightning-fast build tool
- **Vercel** — Deployment platform (configured in `vercel.json`)
- **TypeScript 5.8.3** — Type safety

### Development
- **ESLint** — Code quality
- **Prettier** — Code formatting
- **Bun** — Fast package manager
- **Nitro** — Backend framework (beta)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun**
- **Git**
- Supabase account (free tier available)
- Groq API key

### Installation

```bash
# Clone the repository
git clone https://github.com/zion-robotics/studypal-your-ai-study-companion.git
cd studypal-your-ai-study-companion

# Install dependencies
bun install
# or
npm install

# Create .env.local
cp .env.example .env.local
```

### Environment Setup

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### Development Server

```bash
# Start dev server with hot reload
bun run dev
# or
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
bun run build
# or
npm run build

# Preview production build
bun run preview
```

---

## 📁 Project Structure

```
src/
├── routes/                    # File-based routing (TanStack Start)
│   ├── __root.tsx             # App shell with authentication
│   ├── index.tsx              # Landing page
│   ├── login.tsx              # Login page
│   ├── signup.tsx             # Registration page
│   ├── onboarding.tsx         # User setup flow
│   ├── dashboard.tsx          # Main dashboard
│   ├── upload.tsx             # Note upload & AI structuring
│   ├── session.tsx            # Study session (voice, quizzes)
│   ├── documents.tsx          # Document management
│   ├── courses.tsx            # Folder/course organization
│   ├── notes.tsx              # Personal notes
│   ├── community.tsx          # Social feed
│   ├── discussions.tsx        # Discussion threads
│   ├── settings.tsx           # User preferences
│   ├── -AppShell.tsx          # Sidebar layout
│   └── README.md              # Route conventions
├── components/
│   └── sp/                    # StudyPal-specific UI components
│       ├── TopNav.tsx
│       ├── Logo.tsx
│       ├── ThemeToggle.tsx
│       └── AppShell.tsx
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── groq.ts                # Groq API integration
│   ├── validation.ts          # Form validation
│   ├── guards.ts              # Route protection
│   └── lovable-error-reporting.ts
├── hooks/
│   ├── useAuth.ts             # Authentication
│   ├── useProfile.ts          # User profile
│   └── useCountUp.ts          # Animation helpers
├── styles.css                 # Global styles
└── types/                     # TypeScript types

```

---

## 📊 Database Schema (Supabase)

### Tables

```
users (via Supabase Auth)
├── id (UUID)
├── email
├── created_at

user_profiles
├── user_id (FK)
├── full_name
├── school_name
├── user_type (tertiary | secondary)
├── learning_mode (mixed | online | offline)
├── notifications_enabled
├── voice_id
├── exam_date
├── avatar_url
├── onboarding_completed

lessons
├── id
├── user_id (FK)
├── subject
├── notes (text)
├── topics (string[])
├── exam_type (JAMB | WAEC | NECO | POST-UTME | null)
├── created_at

documents
├── id
├── user_id (FK)
├── folder_id (FK)
├── name
├── file_path
├── file_size
├── public_url
├── created_at

courses (Folders)
├── id
├── user_id (FK)
├── parent_folder_id (FK, nullable)
├── title
├── created_at

notes
├── id
├── user_id (FK)
├── title
├── body (markdown)
├── color (yellow | sage | coral | sky | lavender | white)
├── tags (Chemistry | Biology | Economics | Math | General | Important)
├── created_at
├── updated_at
```

---

## 🔐 Authentication

StudyPal uses **Supabase Auth** with magic links and password-based login. The app includes:

- Email validation & password strength checks
- OAuth callback handling with automatic redirects
- Session restoration from localStorage
- Onboarding flow for new users
- Protected routes with `requireAuth` and `requireGuest` guards

---

## 🎨 Design System

- **Colors:** Accent-driven (teal/cyan) with light/dark mode support
- **Typography:** Display fonts for headings, monospace for metadata
- **Spacing:** Tailwind's default scale (px-4, gap-6, etc.)
- **Components:** Radix UI primitives + custom StudyPal variants
- **Animations:** Framer Motion for micro-interactions
- **Icons:** Lucide React

---

## 📱 Key Pages & Features

### Landing Page (`/`)
- Hero section with parallax scrolling
- Problem statement (3 challenges)
- Feature showcase
- How-it-works timeline
- Testimonials from beta testers
- Call-to-action

### Authentication (`/login`, `/signup`)
- Email validation
- Password strength indicator
- Error handling with friendly messages
- Redirect based on onboarding status

### Dashboard (`/dashboard`)
- User's study stats & streaks
- Recent lessons & documents
- Quick-start actions
- Progress visualization

### Upload (`/upload`)
- Drag-and-drop file/text input
- AI content structuring (via Groq)
- Exam-type selection (JAMB/WAEC/NECO)
- Topic preview & confirmation

### Study Session (`/session`)
- Voice-based lesson playback
- Comprehension quiz (3 questions)
- Session timer & progress
- Offline support

### Documents (`/documents`)
- File browser (PDFs, Word, Excel, Images, etc.)
- List & grid views
- Search & filter
- Real-time sync with Supabase

### Courses (`/courses`)
- Hierarchical folder management
- Drag-and-drop organization
- Quick actions (rename, delete, move)
- Document count per folder

### Notes (`/notes`)
- Rich text editing
- Color & tag organization
- Full-text search
- Real-time sync

### Community (`/community`)
- Social feed of student posts
- Categories: University & Exam Prep
- Tags for filtering
- Like & comment functionality

### Settings (`/settings`)
- Profile management (name, school, user type)
- Learning preferences
- Voice settings
- Notification controls

---

## 🔌 API Integrations

### Supabase
- PostgreSQL database
- Row-level security policies
- Real-time subscriptions
- Storage for documents

### Groq
- Structured output API for content parsing
- Fast inference for note structuring
- Model: Best available in Groq (configurable)

---

## 🧪 Development

```bash
# Run linter
bun run lint

# Format code
bun run format

# Watch for changes
bun run dev
```

---

## 📈 Performance Optimizations

- ✅ Code splitting with TanStack Router
- ✅ Lazy loading of routes
- ✅ Image optimization (Unsplash CDN)
- ✅ Framer Motion GPU acceleration
- ✅ Offline-first architecture (via localStorage + Supabase)
- ✅ React Query caching & stale-while-revalidate

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Deploy automatically on push to main
git push origin main
```

The app is configured in `vercel.json` for SSR + edge runtime.

### Environment Variables (Vercel)
Set these in your Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GROQ_API_KEY`

---

## 🎯 Beta Users & Testimonials

> *"I work at a phone repair shop till 5pm. StudyPal gives me 10-minute sessions I can actually finish. My GPA went from 2.8 to 3.4 this semester."*
> — Tunde A., 300L Engineering, LASU

> *"I uploaded my Biology past questions and StudyPal turned them into daily quizzes. I scored 287 on my JAMB. I wasn't expecting that at all."*
> — Chisom E., JAMB Candidate, Enugu

> *"The voice lessons are everything. I listen while I'm cooking or on the bus. It actually asks me questions and waits for my answer. Nothing else does that."*
> — Amaka O., HND Accounting, Yaba Tech

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of the YPIT Hackathon 2026. See LICENSE file for details.

---

## 📞 Contact

- **GitHub:** [@zion-robotics](https://github.com/zion-robotics)
- **Built for:** YPIT Hackathon 2026 — Education Track

---

## 🚀 What's Next?

- [ ] Mobile app (React Native)
- [ ] AI-generated exam simulations
- [ ] Peer tutoring marketplace
- [ ] Integration with school LMS
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

**Built for students who work while they study.**
