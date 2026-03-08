

## Plan: Premium Navbar, Settings Page, Enhanced Journal/Tasks/Sleep + More Color & Animations

### 1. Redesigned Navbar
- **Desktop**: Add a glowing animated underline indicator on active items (using `motion.div layoutId` for a sliding pill effect). Add a Settings gear icon link. Add subtle hover glow effects on each nav item.
- **Mobile bottom bar**: Single scrollable row instead of cramped 2-row grid. Active item gets a glowing dot indicator above the icon. Add Settings icon to mobile bar.
- **Brand logo**: Animated gradient border that pulses subtly.

### 2. New Settings Page (`/settings`)
- **Video Background**: Move the video upload/toggle from the floating button into a proper Settings section. Upload, preview thumbnail, enable/disable, opacity slider.
- **Theme Accent Color**: Let user pick from preset accent colors (Indigo, Violet, Cyan, Rose, Emerald).
- **App Preferences**: Toggle noise overlay, grid overlay, aurora blobs on/off. Reset all data button.
- Add route in `App.tsx`, nav item in `Navbar.tsx`.
- Remove the floating `VideoBg` button from `PageLayout` (move functionality into Settings).

### 3. Enhanced Journal Page
- **BrainDump**: Add word count, character count in compose. Staggered entry list animations (each entry fades in with a delay). Gradient left-border accent on entries based on mood. Expand/collapse long entries with "read more".
- **FeynmanCard**: Add a color-shifting gradient border on the flip card. Smoother 3D flip with backface-hidden. Vault entries get staggered reveal animation. Add delete button for vault entries.

### 4. Enhanced Task Board
- **Due dates**: Add optional due date field when creating tasks. Show overdue indicator (red glow) on past-due tasks.
- **Subtasks**: Add ability to create subtasks (checklist within a task).
- **Column headers**: Add gradient accent lines under each column header. Task cards get a subtle left-border color based on priority (red/amber/gray gradient).
- **Animations**: Staggered card entrance per column. Smooth layout animations when moving between columns. Delete with a scale-out + fade.

### 5. Enhanced Sleep Tracker
- **Sleep insights**: Show "best night" and "worst night" from last 7 days. Average quality display.
- **Visual**: Gradient bars in chart (blue-to-purple). Animated number counters for avg hours. Bedtime/wake consistency indicator.
- **Entry history**: Show last 5 entries as a mini timeline with quality indicators below the chart.
- **Animations**: Chart bars animate in with stagger. Stats counters animate with spring.

### 6. More Colors & Animations Globally
- **CSS**: Add a new warm orange/gold blob to the background. Increase saturation on existing blobs. Add a `shimmer` utility class for text gradient animation.
- **GlassCard**: Add a subtle animated gradient border on hover (rotating conic gradient).
- **Page transitions**: Add scale + blur transition between pages in PageLayout.
- **Index page**: Stagger the bento grid cards with cascading fade-in.

### Files to Create
- `src/pages/SettingsPage.tsx`

### Files to Modify
- `src/components/Navbar.tsx` — Full redesign with sliding indicator, settings link, mobile scroll bar
- `src/components/TaskBoard.tsx` — Due dates, subtasks, gradient borders, staggered animations
- `src/components/BrainDump.tsx` — Word count, mood borders, staggered list, expand/collapse
- `src/components/FeynmanCard.tsx` — Gradient border, delete vault entries, better animations
- `src/components/SleepTracker.tsx` — Insights, history timeline, gradient chart bars
- `src/components/GlassCard.tsx` — Animated gradient border on hover
- `src/components/PageLayout.tsx` — Remove VideoBg floating button, enhanced page transition
- `src/components/VideoBg.tsx` — Remove (moved to Settings)
- `src/pages/SettingsPage.tsx` — New settings page with video bg, accent color, preferences
- `src/App.tsx` — Add `/settings` route
- `src/index.css` — New warm blob, shimmer text utility, enhanced saturations

