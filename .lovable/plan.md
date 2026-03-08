

## Plan: Add More Modules & Widgets Across All Pages

Currently most pages have 1-2 components. Here's what I'll add to make each page feel richer and more feature-complete.

---

### Tasks Page — 3 new widgets
1. **Task Analytics Card** — Shows today's stats: tasks created, completed, completion rate, and a mini bar chart of tasks completed per day (last 7 days)
2. **Pomodoro Quick-Link** — Small card suggesting "Focus on a task?" that links to Flow Engine, showing the top priority incomplete task
3. **Daily Planner** — A simple "Today's Focus" section where you pick up to 3 tasks to highlight as your daily priorities (stored in localStorage)

### Journal Page — 2 new widgets
1. **Mood Timeline** — Pulls mood data from brain dump entries and shows a small sparkline/emoji timeline of your recent journal moods
2. **Word Count Stats** — A mini card showing total entries, total words written, average entry length, and longest streak of consecutive journal days

### Habits Page — 2 new widgets
1. **Habit Insights Card** — Shows best habit (highest completion rate), worst habit, overall weekly completion %, and a motivational nudge
2. **Weekly Heatmap** — A compact color-coded grid showing all habits × 7 days with intensity colors based on completion

### Mood Page — 2 new widgets
1. **Mood Patterns Card** — Shows most common mood, mood distribution as a mini pie chart, and "mood trend" (improving/declining/stable)
2. **Mood Triggers Journal** — Quick-tag system for what influenced your mood (work, exercise, social, weather, etc.) stored with entries

### Sleep Page — 2 new widgets
1. **Sleep Tips Card** — Rotating sleep hygiene tips based on your data (e.g., if avg < 7h, suggest earlier bedtime)
2. **Sleep Debt Calculator** — Shows cumulative sleep debt vs 8h target over the past week

### Water Page — 1 new widget
1. **Hydration Tips & Reminders** — Shows tips and a "time since last drink" counter based on log timestamps

### Notes Page — 1 new widget  
1. **Quick Capture Widget** — A floating quick-add input at the top that creates a note instantly without opening the full editor

### Stats Page — 1 new widget
1. **Productivity Score** — A composite score (0-100) combining focus time, tasks done, habits checked, and journal entries from the past 7 days

---

### Technical Approach
- Each new widget is a standalone component in `src/components/`
- All data comes from existing `useLocalStorage` hooks — no new storage keys where possible (reuse `nexus-tasks`, `nexus-journal`, `nexus-mood-entries`, etc.)
- Each page gets its widgets added to the grid layout with responsive `grid-cols` breakpoints
- Haptic feedback on interactive elements, XP rewards where appropriate
- Consistent glass card styling with `GlassCard` component

### Files to create (~10 new components)
- `src/components/TaskAnalytics.tsx`
- `src/components/DailyPlanner.tsx`
- `src/components/JournalStats.tsx`
- `src/components/MoodTimeline.tsx`
- `src/components/HabitInsights.tsx`
- `src/components/MoodPatterns.tsx`
- `src/components/SleepTips.tsx`
- `src/components/SleepDebt.tsx`
- `src/components/HydrationTips.tsx`
- `src/components/ProductivityScore.tsx`

### Files to edit (page layouts)
- `src/pages/TasksPage.tsx` — add TaskAnalytics + DailyPlanner in grid
- `src/pages/JournalPage.tsx` — add JournalStats + MoodTimeline
- `src/pages/HabitsPage.tsx` — add HabitInsights
- `src/pages/MoodPage.tsx` — add MoodPatterns
- `src/pages/SleepPage.tsx` — add SleepTips + SleepDebt
- `src/pages/WaterPage.tsx` — add HydrationTips
- `src/pages/StatsPage.tsx` — add ProductivityScore
- `src/pages/NotesPage.tsx` — add quick capture

