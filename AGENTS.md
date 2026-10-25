<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MANDATORY WORKSPACE RULES & MEMORY (AUTOMATIC & NON-NEGOTIABLE)

## 1. AUTOMATIC VERCEL CI/CD DEPLOYMENT PIPELINE
Going forward in this entire project, for EVERY feature, bug fix, or UI change, you MUST autonomously execute the full deployment pipeline without waiting for explicit user commands:

1. **Pre-commit Verification:**
   - Always run `npx tsc --noEmit` and confirm 0 TypeScript errors.
   - Confirm `npm run build` succeeds locally before pushing when making architectural changes.
   - NEVER commit secret keys, passwords, or `.env.local` to git history. All environment access must use safe fallbacks and runtime checks.
2. **Git Commit & Push to Main:**
   - Stage modified files (`git add <files>`).
   - Create clear, conventional commits (`feat: ...`, `fix: ...`, `style: ...`).
   - Push directly to `origin main` (`git push origin main`).
3. **Pipeline & Live Verification:**
   - Pushing to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`), which builds and deploys prebuilt assets to Vercel Production (`alihsan-lms`).
   - Confirm deployment completion and test live endpoints (`https://alihsan-lms.vercel.app/`, `/login`, `/student/login`, `/teacher/login`, `/admin/login`, `/reset-password`).
   - Confirm status code `200 OK` (no HTTP 500s or runtime crashes).
   - Only consider a task complete once the live production site is verified working.

## 2. MOBILE-FIRST RESPONSIVENESS STANDARDS
All UI components, dashboards, modals, navigation bars, and forms across all 4 roles (Student, Teacher, Admin, Superadmin) must strictly adhere to:
1. **Zero Unintentional Horizontal Scroll:**
   - Body/main containers must never cause horizontal overflow on viewport widths from 320px up to 430px (iPhone SE, iPhone 14/15 Pro, Pixel 7, Samsung Galaxy).
   - Use `w-full max-w-full overflow-x-hidden` on outer wrappers where necessary.
2. **Data Tables & Wide Content:**
   - All tables (attendance, class records, student lists, user tables) must have explicit horizontal scroll wrappers (`overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0`) or transform into card stacks on screens `< 640px`.
3. **Touch Targets & Typography:**
   - All interactive elements (buttons, tabs, inputs, dropdowns) must meet mobile touch target accessibility standards (minimum 44x44px clickable area).
   - Form inputs must have minimum font-size 16px (`text-base` or `text-sm sm:text-base`) to prevent iOS Safari auto-zoom on focus.
4. **Header & Navigation:**
   - Headers, role badges, and logout/action buttons must wrap or collapse cleanly into a mobile drawer or mobile bottom bar without overlapping or clipping.

## 3. LOGIN PORTAL SWITCHER VISIBILITY (PERMANENT RULE)
- The "Need a different portal? / Need another portal?" switch option MUST ONLY be displayed on the **Admin Login Portal** (`/admin/login` / `portalType === 'admin'`).
- It MUST NEVER be displayed on the **Student Login Portal** (`/student/login`) or the **Teacher Login Portal** (`/teacher/login`).
- Student and Teacher authentication cards must remain completely dedicated to entering credentials for their respective portal with no other portal navigation links.
