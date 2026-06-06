# StudyPal — Sequenced Build Plan

You asked for all 9 fixes. Doing them in one turn would break the app. Here is the order I'll ship them, one batch per turn, each one stable before moving on.

---

## Turn 1 — Quick wins + Settings (FIX 5, FIX 8)

**Why first:** Pure frontend, zero backend risk, immediately visible.

- **FIX 5** — Lock the hero phone mockup. Remove the float/parallax animation, fix it in place with a subtle shadow + glow, keep it professional.
- **FIX 8** — New `/settings` route with: profile (name, school, level), theme toggle (reuse existing `ThemeToggle`), notifications toggle (writes to `user_profiles.notifications_enabled`), learning mode (voice/text/mixed), sign out. Linked from `AppShell` user card.

**Files:** `src/routes/index.tsx` (hero), `src/routes/settings.tsx` (new), `src/components/sp/AppShell.tsx` (link).

---

## Turn 2 — Courses foundation (FIX 1 Phase 1–2)

**Why second:** Everything else (RAG, Study, Community import) depends on a real `courses` table.

- DB: `courses` table (name, code, description, user_id, created_at) + `course_materials` table (course_id, kind: pdf/notes/text, title, source_url/raw_text, created_at) with RLS.
- Rename `/upload` → `/courses` (Course Library: grid + search + "New Course" dialog). Keep `/upload` as a redirect for backward compat.
- New `/courses/$courseId` route = Course Workspace with tabs: Overview / Materials / Lessons / Quizzes. Only Overview + Materials functional this turn; other tabs scaffolded.
- Materials upload: PDF via Supabase Storage bucket `course-materials`, notes (textarea), paste text.

**Files:** new migration, `src/routes/courses.tsx`, `src/routes/courses.$courseId.tsx`, `src/lib/courses.functions.ts`.

---

## Turn 3 — RAG pipeline (FIX 1 Phase 3)

**Why third:** Needs courses + materials to exist.

- Enable `pgvector`. New table `material_chunks` (material_id, course_id, chunk_index, content, embedding vector(1536), token_count).
- Server fn `ingestMaterial`: extract text (PDF via `pdf-parse` or send text directly), chunk at ~800 chars with 100 overlap, embed via Lovable AI Gateway (`openai/text-embedding-3-small`, 1536 dims), insert.
- Server fn `retrieveContext(courseId, query, topK=5)`: embed query, cosine search via SQL function `match_chunks`.
- Server fn `groqWithRag`: retrieves chunks first, passes only retrieved context to Groq, never raw model knowledge.

**Files:** migration, `src/lib/rag.functions.ts`, refactor `src/lib/groq.ts`.

---

## Turn 4 — Aethex voice layer real integration (FIX 6)

**Why fourth:** Independent of Courses/RAG but needs `AETHEX_API_KEY` confirmed.

- Replace Web Speech fallback in `src/lib/speech.ts` with real Aethex calls when key is present.
- Server fns: `aethexTTS(text, voiceId)` → returns signed audio URL or streams PCM16; `aethexListVoices` (cache 1h).
- WebRTC conversation flow in `/session` already partly wired — finish offer/answer ICE handling, add pause/resume/repeat voice commands.
- Voice settings (voice_id, language) added to Settings page.

**Files:** `src/lib/aethex.ts` (extend), `src/lib/speech.ts`, `src/routes/session.tsx`, `src/routes/settings.tsx`.

---

## Turn 5 — Study system + Community import + Lessons (FIX 1 Phase 4–7, FIX 2)

- Lessons: AI-generated from RAG context, stored in `lessons` table per course, completion tracking.
- Study page rebuilt as execution layer: Daily Pulse (today's plan from study_plan), Continue Learning (last incomplete lesson), Quick Quiz, Voice Study shortcut.
- **Life Happened Mode**: detect >2 day gap → recalculate plan, no streak penalty, encouraging copy.
- **FIX 2 Community import**: dialog with "Add to existing course" (picker) or "Create new course". Copies material + queues for RAG ingestion.

**Files:** migrations, `src/routes/session.tsx`, `src/routes/community.tsx`, `src/routes/dashboard.tsx`.

---

## Turn 6 — Dashboard redesign + UI/UX polish (FIX 7, FIX 9)

**Why last:** Needs all data sources stable to design around real content.

- **FIX 7** Dashboard: hero greeting w/ user name + level (JAMB / 100lvl etc), Daily Pulse card, course progress carousel, streak heatmap, quiz performance trend, next exam countdown. Glassmorphism + subtle gradients + motion.
- **FIX 9** Dual-mode polish: copy/iconography branches on `user_profiles.user_type` — `secondary` users see "JAMB", "WAEC", "subjects"; `tertiary` users see "courses", "lectures", "GPA". One refined font pair, semantic tokens only, consistent radius/shadow scale.
- Run Lighthouse pass, fix tab order, alt text, contrast.

**Files:** `src/routes/dashboard.tsx`, `src/styles.css`, all route headers/copy.

---

## Risk notes

- **Renaming `/upload` → `/courses`** breaks existing in-app links. I'll add a redirect route.
- **pgvector + 1536-dim column** is locked in to the embedding model. Switching models later means re-embedding.
- **Aethex WebRTC** needs `AETHEX_API_KEY` in secrets — I'll check via `fetch_secrets` before Turn 4.
- **No new tables in Turn 1** so we don't block on schema review.

---

## What I need from you

Just say **"go"** and I'll execute Turn 1 (settings page + lock the phone mockup) right now. After each turn I'll stop, you confirm it works, then I move to the next.

If you'd rather reorder (e.g., dashboard redesign first because it's most visible to demo), tell me the new order.
