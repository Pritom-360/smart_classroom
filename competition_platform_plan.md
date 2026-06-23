# 🏆 Competition Platform — Architecture Plan

## The Problem
The current `smart-classroom` project is a **vanilla HTML/CSS/JS** static site. Building an admin panel, dynamic form builder, auth system, team management, and leaderboards in vanilla JS would be **unmaintainable and fragile**. 

## Recommended Approach

> [!IMPORTANT]
> ### Decision Required: Where should this live?
> 
> **Option A:** Build as a **standalone React (Vite) app** in a new folder (e.g. `e:\Websites\smart-classroom\competition-app\`), then link to it from the main site. This is the cleanest approach.
> 
> **Option B:** Build it as a **separate project entirely** (like ScholarHub AI) with its own domain/subdomain (e.g. `compete.catalyst-smart-classroom.me`).
> 
> **Option C:** Try to build everything inside vanilla HTML files (NOT recommended — will be extremely complex and hard to maintain).

---

## Full Feature Map

### 1. 🔐 Authentication (Supabase Auth)
| Feature | Details |
|---------|---------|
| Sign Up | Email + Password only |
| Sign In | Email + Password |
| Session | Persistent via Supabase, survives cookie clears |
| Roles | `user` (default) and `admin` (stored in `profiles` table) |

### 2. 👤 User Dashboard
| Feature | Details |
|---------|---------|
| Profile | Name, email, avatar |
| My Competitions | List of all competitions the user has joined |
| Stats | Total participated, wins, submissions count |
| Badges | Digital participant cards for each competition |

### 3. 🏗️ Admin Panel (Admin-only views)
| Feature | Details |
|---------|---------|
| Create Competition | Title, description, type (Solo/Team), rules, prizes, deadline, cover image |
| Dynamic Form Builder | Admin adds custom fields to the registration form (text, email, URL, file upload, select dropdown — like Google Forms) |
| Manage Participants | View all registrations, filter by competition |
| Declare Results | Set winners (1st, 2nd, 3rd), update leaderboard |
| Competition Status | Toggle Active / Completed / Draft |

### 4. 📋 Competition Detail Page
| Feature | Details |
|---------|---------|
| Public View | Title, description, rules, prizes, deadline countdown |
| Registration Gate | Must be logged in to register |
| Dynamic Form | Renders whatever fields the admin configured |
| Team Support | If `type === 'team'`, form collects team name + member emails |

### 5. 📊 Leaderboard
| Feature | Details |
|---------|---------|
| Global Leaderboard | Across all competitions (points-based) |
| Per-Competition | Winners, runners-up, all participants |
| Public | Anyone can view |

### 6. 🎴 Participant Badge System
| Feature | Details |
|---------|---------|
| Auto-generated | After registration, a personalized badge card |
| Download | `html-to-image` PNG export |
| Social Share | Copy caption button |

---

## Database Schema (Supabase)

```sql
-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitions (created by admin)
CREATE TABLE competitions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'solo', -- 'solo' or 'team'
  rules TEXT,
  prizes TEXT,
  cover_image TEXT,
  max_team_size INT DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed'
  custom_fields JSONB DEFAULT '[]', -- Dynamic form fields
  created_by UUID REFERENCES profiles(id),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations (links users to competitions)
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  competition_id INT REFERENCES competitions(id),
  team_name TEXT, -- NULL for solo
  form_data JSONB DEFAULT '{}', -- Stores dynamic field responses
  submission_url TEXT,
  status TEXT DEFAULT 'registered', -- 'registered', 'submitted', 'winner', 'runner_up'
  placement INT, -- 1, 2, 3 for winners
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, competition_id)
);

-- Team members (for team-based competitions)
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  registration_id INT REFERENCES registrations(id),
  member_name TEXT,
  member_email TEXT,
  role TEXT DEFAULT 'member' -- 'leader' or 'member'
);
```

### Dynamic Form Fields Format (stored in `competitions.custom_fields`)
```json
[
  { "id": "field_1", "label": "Project Title", "type": "text", "required": true },
  { "id": "field_2", "label": "Abstract", "type": "textarea", "required": true },
  { "id": "field_3", "label": "Category", "type": "select", "options": ["AI", "Robotics", "IoT"], "required": true },
  { "id": "field_4", "label": "Project Report", "type": "file", "accept": ".pdf", "required": true },
  { "id": "field_5", "label": "Demo Video Link", "type": "url", "required": false }
]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Routing | React Router |
| Animations | Framer Motion |
| Icons | Lucide React |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (for PDF uploads) |
| Badge Export | html-to-image |
| Deployment | Vercel or Netlify |

---

## Page Structure

```
/                    → Competition Hub (public list)
/competition/:id     → Competition Details + Rules + Register
/login               → Sign In / Sign Up
/dashboard           → User Dashboard (my competitions, stats)
/dashboard/badge/:id → View/Download Badge for a competition
/leaderboard         → Global Leaderboard
/admin               → Admin Panel (protected)
/admin/create        → Create New Competition
/admin/edit/:id      → Edit Competition + Manage Participants
/admin/results/:id   → Declare Winners
```

---

## Implementation Phases

### Phase 1: Foundation ⏱️ ~2 hours
- [ ] Initialize Vite + React + Tailwind project
- [ ] Set up Supabase client + Auth (login/signup)
- [ ] Create `profiles` table with admin role
- [ ] Build auth pages (Login, Signup)
- [ ] Build basic layout with nav + theme toggle

### Phase 2: Competition CRUD ⏱️ ~2 hours  
- [ ] Admin: Create competition form (with dynamic field builder)
- [ ] Admin: List/Edit/Delete competitions
- [ ] Public: Competition Hub listing page
- [ ] Public: Competition Detail page

### Phase 3: Registration & Teams ⏱️ ~2 hours
- [ ] Dynamic form renderer (reads `custom_fields` JSON)
- [ ] Solo registration flow
- [ ] Team registration flow (add members)
- [ ] File upload to Supabase Storage
- [ ] Badge generation + download

### Phase 4: Dashboard & Leaderboard ⏱️ ~1.5 hours
- [ ] User dashboard (my competitions, stats)
- [ ] Admin: View all registrations per competition
- [ ] Admin: Declare winners UI
- [ ] Public leaderboard page

### Phase 5: Polish ⏱️ ~1 hour
- [ ] Light/Dark mode toggle
- [ ] Responsive design pass
- [ ] Framer Motion animations
- [ ] Error handling & loading states
- [ ] Social share (copy caption)

---

> [!WARNING]
> ### This is a full web application, not a single HTML page
> Building this properly requires a React project with routing, state management, and a build step. The vanilla HTML approach won't scale for admin panels, dynamic forms, and auth flows.

> [!TIP]
> ### Quick Start
> Once you confirm **Option A or B** above, I can immediately scaffold the Vite + React project and start Phase 1. The entire platform can be built incrementally.
