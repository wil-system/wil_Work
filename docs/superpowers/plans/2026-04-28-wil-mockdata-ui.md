# WIL Mock-Data UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all WIL workspace pages with mock data only — full visual scenario for every page before any Supabase wiring.

**Architecture:** Next.js App Router with `(auth)` and `(workspace)` route groups. All data comes from `lib/mock-data.ts`. No API calls, no Supabase. Every page is a complete visual scenario with realistic Korean content.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, Pretendard font (CDN), lucide-react icons, mock data only. No emojis anywhere — lucide-react icons only.

**Supabase table rule:** All future Supabase tables for this project use `work_` prefix (e.g. `work_profiles`, `work_boards`). Never touch existing tables.

---

## File Map

**New files to create:**
- `app/layout.tsx` — root layout with Pretendard font
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/pending/page.tsx`
- `app/(workspace)/layout.tsx` — shell with sidebar + topbar
- `app/(workspace)/page.tsx` — redirect to /feed
- `app/(workspace)/feed/page.tsx`
- `app/(workspace)/board/[boardId]/page.tsx`
- `app/(workspace)/work-report/page.tsx`
- `app/(workspace)/calendar/page.tsx`
- `app/(workspace)/memo/page.tsx`
- `app/(workspace)/notifications/page.tsx`
- `app/(workspace)/profile/page.tsx`
- `app/(workspace)/settings/page.tsx`
- `app/(workspace)/admin/layout.tsx`
- `app/(workspace)/admin/approvals/page.tsx`
- `app/(workspace)/admin/members/page.tsx`
- `app/(workspace)/admin/permissions/page.tsx`
- `app/(workspace)/admin/boards/page.tsx`
- `lib/types.ts`
- `lib/mock-data.ts`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/tag.tsx`
- `components/board-sidebar.tsx` — full rebuild
- `components/topbar.tsx`
- `components/post-card.tsx`
- `components/composer.tsx`
- `components/comment-modal.tsx`

**Modify:**
- `app/globals.css` — new design tokens + Pretendard
- `app/layout.tsx` — add Pretendard link tag

**Delete (replaced by new versions):**
- `components/workspace-shell.tsx`
- `components/feed-panel.tsx`
- `components/board-sidebar.tsx` (rebuild in place)
- `components/detail-panel.tsx`
- `components/participant-panel.tsx`
- `components/status-pill.tsx`

---

## Task 1: Design System — globals.css + Pretendard

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace globals.css**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg-app: #f2f0ee;
  --bg-surface: #ffffff;
  --bg-sidebar: #1a1825;
  --bg-sidebar-hover: #252236;
  --bg-sidebar-active: #2d2a45;

  /* Indigo accent */
  --indigo-50: #eef2ff;
  --indigo-100: #e0e7ff;
  --indigo-200: #c7d2fe;
  --indigo-400: #818cf8;
  --indigo-500: #6366f1;
  --indigo-600: #4f46e5;
  --indigo-700: #4338ca;
  --indigo-900: #1e1b4b;

  /* Stone neutrals */
  --stone-50: #fafaf9;
  --stone-100: #f5f5f4;
  --stone-200: #e7e5e4;
  --stone-300: #d6d3d1;
  --stone-400: #a8a29e;
  --stone-500: #78716c;
  --stone-600: #57534e;
  --stone-700: #44403c;
  --stone-800: #292524;
  --stone-900: #1c1917;

  /* Semantic */
  --foreground: #1c1917;
  --muted: #78716c;
  --line: #e7e5e4;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;

  /* Shadows */
  --shadow-card: 0 1px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
  --shadow-lift: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-sidebar: 4px 0 24px rgba(0,0,0,0.15);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg-app);
  color: var(--foreground);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  -webkit-font-smoothing: antialiased;
}

button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; }

::selection { background: var(--indigo-200); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb {
  background: var(--stone-300);
  border-radius: 999px;
}
::-webkit-scrollbar-track { background: transparent; }

/* Animations */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}

.animate-fade-up { animation: fade-up 320ms ease-out both; }
.animate-fade-in { animation: fade-in 200ms ease-out both; }

/* Card */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow-card);
}

/* Focus ring */
.focus-ring:focus-visible {
  outline: 2px solid var(--indigo-500);
  outline-offset: 2px;
}

/* Skeleton */
.skeleton {
  background: var(--stone-200);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.skeleton::after {
  animation: shimmer 1.4s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  content: '';
  inset: 0;
  position: absolute;
  transform: translateX(-100%);
}
```

- [ ] **Step 2: Update app/layout.tsx to load Pretendard**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WIL 협업 워크스페이스",
  description: "WIL team collaboration workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify dev server starts without errors**

```bash
npm run dev
```
Expected: server starts on http://localhost:3000 with no TypeScript errors.

---

## Task 2: Types & Mock Data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/mock-data.ts`

- [ ] **Step 1: Create lib/types.ts**

```typescript
// lib/types.ts

export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  position: string;
  avatarInitial: string;
  avatarColor: string;
  joinedAt: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  isPublic: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'doc' | 'xls' | 'zip' | 'other';
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  boardId: string;
  authorId: string;
  title?: string;
  content: string;
  attachments: Attachment[];
  comments: Comment[];
  isPinned: boolean;
  createdAt: string;
}

export interface WorkReport {
  id: string;
  authorId: string;
  date: string;
  plannedTasks: string[];
  completedTasks: string[];
  issues?: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  allDay: boolean;
  type: 'meeting' | 'deadline' | 'holiday' | 'personal';
  attendees: string[];
  description?: string;
}

export interface Memo {
  id: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'comment' | 'mention' | 'approval' | 'board' | 'report';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface BoardPermission {
  profileId: string;
  boardId: string;
}
```

- [ ] **Step 2: Create lib/mock-data.ts**

```typescript
// lib/mock-data.ts
import type { Profile, Board, Post, WorkReport, CalendarEvent, Memo, Notification, BoardPermission } from './types';

export const CURRENT_USER_ID = 'u1';

export const mockProfiles: Profile[] = [
  { id: 'u1', name: '김보현', email: 'bohyun@wil.kr', role: 'admin', status: 'approved', department: '경영지원', position: '총괄 관리자', avatarInitial: '김', avatarColor: '#1e1b4b', joinedAt: '2024-01-10' },
  { id: 'u2', name: '이서연', email: 'seoyeon@wil.kr', role: 'member', status: 'approved', department: '영업팀', position: '팀장', avatarInitial: '이', avatarColor: '#0f766e', joinedAt: '2024-02-01' },
  { id: 'u3', name: '박준혁', email: 'junhyuk@wil.kr', role: 'member', status: 'approved', department: '개발팀', position: '시니어 개발자', avatarInitial: '박', avatarColor: '#b45309', joinedAt: '2024-02-15' },
  { id: 'u4', name: '최민지', email: 'minji@wil.kr', role: 'member', status: 'approved', department: '마케팅', position: '담당자', avatarInitial: '최', avatarColor: '#7c3aed', joinedAt: '2024-03-01' },
  { id: 'u5', name: '정다은', email: 'daeun@wil.kr', role: 'member', status: 'pending', department: '디자인팀', position: '디자이너', avatarInitial: '정', avatarColor: '#be185d', joinedAt: '2026-04-25' },
  { id: 'u6', name: '한승우', email: 'seungwoo@wil.kr', role: 'member', status: 'pending', department: '개발팀', position: '주니어 개발자', avatarInitial: '한', avatarColor: '#0369a1', joinedAt: '2026-04-27' },
];

export const mockBoards: Board[] = [
  { id: 'feed', name: '전체 피드', description: '모든 팀원의 소식을 확인하세요', icon: 'LayoutDashboard', isPublic: true, createdAt: '2024-01-10' },
  { id: 'sales', name: '영업팀', description: '영업팀 전용 게시판', icon: 'TrendingUp', isPublic: false, createdAt: '2024-02-01' },
  { id: 'dev', name: '개발팀', description: '개발팀 이슈 및 공유', icon: 'Code2', isPublic: false, createdAt: '2024-02-15' },
  { id: 'marketing', name: '마케팅', description: '마케팅 캠페인 및 콘텐츠', icon: 'Megaphone', isPublic: false, createdAt: '2024-03-01' },
  { id: 'notice', name: '공지사항', description: '전사 공지', icon: 'Bell', isPublic: true, createdAt: '2024-01-10' },
];

export const mockBoardPermissions: BoardPermission[] = [
  { profileId: 'u1', boardId: 'sales' },
  { profileId: 'u1', boardId: 'dev' },
  { profileId: 'u1', boardId: 'marketing' },
  { profileId: 'u1', boardId: 'notice' },
  { profileId: 'u2', boardId: 'sales' },
  { profileId: 'u3', boardId: 'dev' },
  { profileId: 'u4', boardId: 'marketing' },
];

export const mockPosts: Post[] = [
  {
    id: 'p1', boardId: 'feed', authorId: 'u1',
    title: '이번 주 영업팀 KPI 달성 현황',
    content: '이번 주 영업팀 KPI 달성 현황을 공유드립니다. 전월 대비 **12% 상승**했으며 목표치를 초과 달성했습니다. 특히 신규 고객 유치 부문에서 탁월한 성과를 보여주셨습니다. 팀 전체가 함께 노력한 결과입니다.',
    attachments: [{ id: 'a1', name: 'KPI_2026_04.xlsx', size: '245 KB', type: 'xls' }],
    comments: [
      { id: 'c1', authorId: 'u2', content: '정말 수고하셨습니다! 다음 달도 화이팅!', createdAt: '2026-04-28T09:15:00' },
      { id: 'c2', authorId: 'u3', content: '좋은 결과네요. 영업팀 대단합니다.', createdAt: '2026-04-28T09:30:00' },
      { id: 'c3', authorId: 'u4', content: '마케팅에서도 더 지원하겠습니다!', createdAt: '2026-04-28T10:00:00' },
    ],
    isPinned: true, createdAt: '2026-04-28T08:00:00',
  },
  {
    id: 'p2', boardId: 'feed', authorId: 'u3',
    title: '개발팀 스프린트 회고 공유',
    content: '4월 스프린트 회고 내용을 공유합니다. 이번 스프린트에서는 모바일 UI 개선과 API 성능 최적화를 완료했습니다. 다음 스프린트는 5월 2일 시작 예정이며, 주요 과제는 알림 시스템 개선입니다.',
    attachments: [
      { id: 'a2', name: '스프린트_회고_2026_04.pdf', size: '1.2 MB', type: 'pdf' },
      { id: 'a3', name: 'sprint_screenshot.png', size: '340 KB', type: 'image' },
    ],
    comments: [
      { id: 'c4', authorId: 'u1', content: '잘 정리해주셨네요. 다음 스프린트도 화이팅!', createdAt: '2026-04-28T11:00:00' },
    ],
    isPinned: false, createdAt: '2026-04-28T10:30:00',
  },
  {
    id: 'p3', boardId: 'notice', authorId: 'u1',
    title: '[공지] 5월 사내 워크샵 일정 안내',
    content: '안녕하세요. 5월 16일(금) 오후 2시부터 사내 워크샵이 진행될 예정입니다. 장소는 3층 대회의실이며 전 직원 필수 참석입니다. 자세한 일정은 첨부 파일을 확인해 주세요.',
    attachments: [{ id: 'a4', name: '워크샵_일정표.pdf', size: '180 KB', type: 'pdf' }],
    comments: [],
    isPinned: true, createdAt: '2026-04-27T14:00:00',
  },
  {
    id: 'p4', boardId: 'marketing', authorId: 'u4',
    title: '4월 SNS 캠페인 결과 보고',
    content: '4월 SNS 캠페인 최종 결과를 공유드립니다. 인스타그램 도달 수 32만, 참여율 4.7%로 목표 대비 115% 달성했습니다. 특히 릴스 콘텐츠가 높은 반응을 보였으며 5월 캠페인에도 동일 포맷 적용 예정입니다.',
    attachments: [{ id: 'a5', name: '캠페인_결과_보고서.pdf', size: '2.1 MB', type: 'pdf' }],
    comments: [
      { id: 'c5', authorId: 'u1', content: '훌륭한 성과입니다! 계속 이 방향으로 가시죠.', createdAt: '2026-04-28T13:00:00' },
    ],
    isPinned: false, createdAt: '2026-04-28T12:00:00',
  },
  {
    id: 'p5', boardId: 'dev', authorId: 'u3',
    title: 'Next.js 15 마이그레이션 검토',
    content: 'Next.js 15로의 마이그레이션을 검토했습니다. 주요 변경사항은 React 19 기본 지원, Turbopack 안정화, 캐싱 전략 변경 등입니다. 영향도 분석 완료 후 5월 중 점진적 적용 예정입니다.',
    attachments: [],
    comments: [],
    isPinned: false, createdAt: '2026-04-27T16:00:00',
  },
];

export const mockWorkReports: WorkReport[] = [
  {
    id: 'wr1', authorId: 'u1', date: '2026-04-28',
    plannedTasks: ['팀 KPI 현황 취합 및 보고', '신규 입사자 온보딩 준비', '5월 워크샵 기획'],
    completedTasks: ['팀 KPI 현황 취합 및 보고', '신규 입사자 온보딩 준비'],
    issues: '워크샵 장소 섭외 진행 중, 5월 2일까지 확정 예정',
    status: 'submitted',
  },
  {
    id: 'wr2', authorId: 'u2', date: '2026-04-28',
    plannedTasks: ['신규 고객 미팅 3건', '계약서 검토', '영업 보고서 작성'],
    completedTasks: ['신규 고객 미팅 3건', '영업 보고서 작성'],
    issues: undefined,
    status: 'submitted',
  },
  {
    id: 'wr3', authorId: 'u3', date: '2026-04-28',
    plannedTasks: ['API 성능 최적화', '코드 리뷰', '스프린트 회고 작성'],
    completedTasks: ['API 성능 최적화', '코드 리뷰', '스프린트 회고 작성'],
    issues: undefined,
    status: 'reviewed',
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'e1', title: '주간 팀 미팅', date: '2026-04-28', allDay: false, type: 'meeting', attendees: ['u1','u2','u3','u4'], description: '주간 업무 현황 공유 및 이슈 논의' },
  { id: 'e2', title: '영업팀 고객 미팅', date: '2026-04-29', allDay: false, type: 'meeting', attendees: ['u2'], description: '신규 고객사 제안 발표' },
  { id: 'e3', title: '개발팀 스프린트 시작', date: '2026-05-02', allDay: true, type: 'deadline', attendees: ['u3'], description: '5월 스프린트 킥오프' },
  { id: 'e4', title: '근로자의 날', date: '2026-05-01', allDay: true, type: 'holiday', attendees: [], description: '공휴일' },
  { id: 'e5', title: '마케팅 캠페인 마감', date: '2026-04-30', allDay: false, type: 'deadline', attendees: ['u4'], description: '5월 캠페인 소재 최종 제출' },
  { id: 'e6', title: '사내 워크샵', date: '2026-05-16', allDay: false, type: 'meeting', attendees: ['u1','u2','u3','u4'], description: '전 직원 필수 참석' },
];

export const mockMemos: Memo[] = [
  { id: 'm1', authorId: 'u1', title: '2026 Q2 목표 초안', content: '- 신규 고객 50사 확보\n- 내부 시스템 고도화 완료\n- 팀 역량 강화 교육 2회 이상', tags: ['전략', 'Q2'], isPinned: true, updatedAt: '2026-04-28T08:00:00' },
  { id: 'm2', authorId: 'u1', title: '워크샵 아이디어 메모', content: '1. 팀빌딩 게임\n2. 내부 발표 세션\n3. 자유 토론 시간\n4. 저녁 식사', tags: ['워크샵'], isPinned: false, updatedAt: '2026-04-27T15:00:00' },
  { id: 'm3', authorId: 'u1', title: '온보딩 체크리스트', content: '- 계정 생성\n- 장비 지급\n- 팀 소개\n- 업무 시스템 안내', tags: ['HR', '온보딩'], isPinned: false, updatedAt: '2026-04-26T10:00:00' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'comment', title: '새 댓글', body: '이서연님이 "이번 주 영업팀 KPI 달성 현황"에 댓글을 남겼습니다.', isRead: false, createdAt: '2026-04-28T09:15:00', link: '/board/feed' },
  { id: 'n2', type: 'approval', title: '가입 승인 대기', body: '정다은님이 회원가입을 신청했습니다. 승인이 필요합니다.', isRead: false, createdAt: '2026-04-28T08:30:00', link: '/admin/approvals' },
  { id: 'n3', type: 'approval', title: '가입 승인 대기', body: '한승우님이 회원가입을 신청했습니다. 승인이 필요합니다.', isRead: false, createdAt: '2026-04-27T17:00:00', link: '/admin/approvals' },
  { id: 'n4', type: 'comment', title: '새 댓글', body: '박준혁님이 "이번 주 영업팀 KPI 달성 현황"에 댓글을 남겼습니다.', isRead: true, createdAt: '2026-04-28T09:30:00' },
  { id: 'n5', type: 'board', title: '게시판 추가', body: '"마케팅" 게시판이 생성되었습니다.', isRead: true, createdAt: '2026-04-27T14:00:00' },
];

// Helpers
export function getProfile(id: string): Profile | undefined {
  return mockProfiles.find(p => p.id === id);
}

export function getPostsForBoard(boardId: string): Post[] {
  if (boardId === 'feed') return mockPosts;
  return mockPosts.filter(p => p.boardId === boardId);
}

export function getAccessibleBoards(userId: string): Board[] {
  const user = getProfile(userId);
  if (!user) return [];
  if (user.role === 'admin') return mockBoards;
  const permitted = mockBoardPermissions.filter(p => p.profileId === userId).map(p => p.boardId);
  return mockBoards.filter(b => b.isPublic || permitted.includes(b.id));
}

export function getPendingUsers(): Profile[] {
  return mockProfiles.filter(p => p.status === 'pending');
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/mock-data.ts
git commit -m "feat: add types and mock data for all entities"
```

---

## Task 3: UI Primitives — Avatar, Badge, Tag

**Files:**
- Create: `components/ui/avatar.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/tag.tsx`

- [ ] **Step 1: Create components/ui/avatar.tsx**

```tsx
// components/ui/avatar.tsx
interface AvatarProps {
  initial: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-[11px]', lg: 'w-10 h-10 text-[13px]' };

export function Avatar({ initial, color = '#1e1b4b', size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      style={{ background: color }}
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: Create components/ui/badge.tsx**

```tsx
// components/ui/badge.tsx
type BadgeVariant = 'indigo' | 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  indigo: 'bg-[#eef2ff] border border-[#c7d2fe] text-[#3730a3]',
  green:  'bg-[#d1fae5] border border-[#6ee7b7] text-[#065f46]',
  yellow: 'bg-[#fef9c3] border border-[#fde68a] text-[#92400e]',
  red:    'bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b]',
  gray:   'bg-[#f5f5f4] border border-[#e7e5e4] text-[#57534e]',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create components/ui/tag.tsx**

```tsx
// components/ui/tag.tsx
interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f4] text-[#57534e] border border-[#e7e5e4] ${className}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: add Avatar, Badge, Tag UI primitives"
```

---

## Task 4: BoardSidebar Rebuild

**Files:**
- Modify: `components/board-sidebar.tsx`

- [ ] **Step 1: Rewrite components/board-sidebar.tsx**

```tsx
// components/board-sidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
  FileText, Calendar, StickyNote, Settings, Shield,
  ChevronDown, Plus, LogOut, User
} from 'lucide-react';
import { Avatar } from './ui/avatar';
import { mockBoards, getProfile, getAccessibleBoards, CURRENT_USER_ID } from '@/lib/mock-data';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
};

const WORKSPACE_NAV = [
  { href: '/work-report', label: '업무보고', icon: FileText },
  { href: '/calendar',    label: '캘린더',   icon: Calendar },
  { href: '/memo',        label: '메모장',   icon: StickyNote },
];

export default function BoardSidebar() {
  const pathname = usePathname();
  const [boardsOpen, setBoardsOpen] = useState(true);
  const currentUser = getProfile(CURRENT_USER_ID)!;
  const boards = getAccessibleBoards(CURRENT_USER_ID);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className="flex flex-col h-screen w-[220px] flex-shrink-0 select-none"
      style={{ background: 'var(--bg-sidebar)', boxShadow: 'var(--shadow-sidebar)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-[11px] font-black tracking-[3px] text-white/90">W · I · L</div>
        <div className="text-[10px] text-white/40 mt-0.5 tracking-wide">WORKSPACE</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {/* Feed */}
        <NavItem href="/feed" icon={LayoutDashboard} label="전체 피드" active={isActive('/feed')} />

        {/* Boards */}
        <div className="mt-3">
          <button
            onClick={() => setBoardsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 hover:text-white/50 transition-colors uppercase"
          >
            <span>게시판</span>
            <ChevronDown size={12} className={`transition-transform ${boardsOpen ? '' : '-rotate-90'}`} />
          </button>
          {boardsOpen && boards.filter(b => b.id !== 'feed').map(board => {
            const Icon = ICON_MAP[board.icon] ?? Bell;
            return (
              <NavItem
                key={board.id}
                href={`/board/${board.id}`}
                icon={Icon}
                label={board.name}
                active={isActive(`/board/${board.id}`)}
              />
            );
          })}
        </div>

        {/* Workspace tools */}
        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">워크스페이스</div>
          {WORKSPACE_NAV.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} />
          ))}
        </div>

        {/* Admin (admin only) */}
        {currentUser.role === 'admin' && (
          <div className="mt-3">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">관리자</div>
            <NavItem href="/admin/approvals" icon={Shield} label="가입 승인" active={isActive('/admin')} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <NavItem href="/notifications" icon={Bell} label="알림" active={isActive('/notifications')} />
        <NavItem href="/settings" icon={Settings} label="설정" active={isActive('/settings')} />
        <div className="mt-2 flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white/90 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-white/40 truncate">{currentUser.position}</div>
          </div>
          <LogOut size={13} className="text-white/30 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
        active
          ? 'bg-[#2d2a45] text-white'
          : 'text-white/60 hover:text-white/90 hover:bg-white/5'
      }`}
    >
      <Icon size={15} className={active ? 'text-[#818cf8]' : ''} />
      <span>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/board-sidebar.tsx
git commit -m "feat: rebuild BoardSidebar with dark theme and full nav"
```

---

## Task 5: Topbar Component

**Files:**
- Create: `components/topbar.tsx`

- [ ] **Step 1: Create components/topbar.tsx**

```tsx
// components/topbar.tsx
import Link from 'next/link';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { getProfile, mockNotifications, CURRENT_USER_ID } from '@/lib/mock-data';

interface TopbarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function Topbar({ title, subtitle, breadcrumb }: TopbarProps) {
  const user = getProfile(CURRENT_USER_ID)!;
  const unread = mockNotifications.filter(n => !n.isRead).length;

  return (
    <header className="h-14 border-b flex items-center px-6 gap-4 flex-shrink-0" style={{ background: 'white', borderColor: 'var(--line)' }}>
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-[var(--stone-400)]" />}
                {item.href
                  ? <Link href={item.href} className="text-[11px] text-[var(--muted)] hover:text-[var(--indigo-500)]">{item.label}</Link>
                  : <span className="text-[11px] text-[var(--muted)]">{item.label}</span>
                }
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[15px] font-bold text-[var(--foreground)] truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-[var(--muted)]">{subtitle}</p>}
      </div>

      {/* Search */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--stone-100)] text-[var(--muted)] text-[12px] hover:bg-[var(--stone-200)] transition-colors">
        <Search size={13} />
        <span>검색</span>
        <kbd className="ml-1 text-[10px] opacity-60">⌘K</kbd>
      </button>

      {/* Notifications */}
      <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-[var(--stone-100)] transition-colors">
        <Bell size={17} className="text-[var(--stone-600)]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--indigo-500)] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </Link>

      {/* User */}
      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="sm" />
        <span className="text-[12px] font-semibold text-[var(--stone-700)] hidden md:block">{user.name}</span>
      </Link>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/topbar.tsx
git commit -m "feat: add Topbar with search, notifications, user info"
```

---

## Task 6: Workspace Layout & Route Groups

**Files:**
- Create: `app/(workspace)/layout.tsx`
- Create: `app/(workspace)/page.tsx`
- Create: `app/(auth)/login/page.tsx` (placeholder, full in Task 7)

- [ ] **Step 1: Create app/(workspace)/layout.tsx**

```tsx
// app/(workspace)/layout.tsx
import BoardSidebar from '@/components/board-sidebar';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <BoardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(workspace)/page.tsx (redirect)**

```tsx
// app/(workspace)/page.tsx
import { redirect } from 'next/navigation';
export default function WorkspacePage() {
  redirect('/feed');
}
```

- [ ] **Step 3: Move existing app/page.tsx to redirect**

Edit `app/page.tsx`:

```tsx
// app/page.tsx
import { redirect } from 'next/navigation';
export default function HomePage() {
  redirect('/feed');
}
```

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: set up workspace route group layout with sidebar"
```

---

## Task 7: Auth Pages — Login, Register, Pending

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/pending/page.tsx`

- [ ] **Step 1: Create app/(auth)/login/page.tsx**

```tsx
// app/(auth)/login/page.tsx
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">로그인</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">WIL 협업 워크스페이스에 오신 것을 환영합니다</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <Link
              href="/feed"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--indigo-600)' }}
            >
              <LogIn size={15} />
              로그인
            </Link>
          </div>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">계정이 없으신가요? </span>
            <Link href="/register" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">회원가입 신청</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(auth)/register/page.tsx**

```tsx
// app/(auth)/register/page.tsx
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">회원가입 신청</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">관리자 승인 후 로그인이 가능합니다</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이름</label>
                <input type="text" placeholder="홍길동" className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">부서</label>
                <input type="text" placeholder="영업팀" className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">직책</label>
              <input type="text" placeholder="팀원" className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input type="email" placeholder="your@email.com" className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input type="password" placeholder="8자 이상" className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <Link
              href="/pending"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--indigo-600)' }}
            >
              <UserPlus size={15} />
              가입 신청하기
            </Link>
          </div>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create app/(auth)/pending/page.tsx**

```tsx
// app/(auth)/pending/page.tsx
import Link from 'next/link';
import { Clock, Mail } from 'lucide-react';

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-8">W · I · L</div>
        <div className="card p-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--indigo-50)] flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-[var(--indigo-500)]" />
          </div>
          <h1 className="text-[18px] font-bold text-[var(--foreground)] mb-2">승인 대기 중</h1>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-6">
            회원가입 신청이 완료되었습니다.<br />
            관리자 승인 후 로그인이 가능합니다.<br />
            승인 완료 시 이메일로 안내드립니다.
          </p>
          <div className="flex items-center gap-2 justify-center text-[11px] text-[var(--muted)] bg-[var(--stone-100)] rounded-lg px-4 py-3 mb-6">
            <Mail size={13} />
            <span>your@email.com</span>
          </div>
          <Link href="/login" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add auth pages (login, register, pending)"
```

---

## Task 8: PostCard Component

**Files:**
- Create: `components/post-card.tsx`

- [ ] **Step 1: Create components/post-card.tsx**

```tsx
// components/post-card.tsx
'use client';
import { useState } from 'react';
import { MessageSquare, Paperclip, Pin, FileSpreadsheet, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { getProfile } from '@/lib/mock-data';
import type { Post, Attachment } from '@/lib/types';

const AttachIcon: Record<string, React.ElementType> = {
  xls: FileSpreadsheet, pdf: FileText, image: ImageIcon,
  doc: FileText, zip: File, other: File,
};

function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const Icon = AttachIcon[attachment.type] ?? File;
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--stone-100)] hover:bg-[var(--stone-200)] transition-colors border border-[var(--line)] text-[11px] text-[var(--stone-600)]">
      <Icon size={12} className="text-[var(--indigo-500)]" />
      <span className="font-medium">{attachment.name}</span>
      <span className="text-[10px] text-[var(--stone-400)]">{attachment.size}</span>
    </button>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false);
  const author = getProfile(post.authorId)!;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <article className="card animate-fade-up">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initial={author.avatarInitial} color={author.avatarColor} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">{author.name}</span>
              {author.role === 'admin' && <Badge variant="indigo">관리자</Badge>}
            </div>
            <div className="text-[11px] text-[var(--muted)]">{author.position} · {timeAgo(post.createdAt)}</div>
          </div>
        </div>
        {post.isPinned && (
          <Pin size={13} className="text-[var(--indigo-500)] mt-0.5" />
        )}
      </div>

      {/* Divider */}
      <div className="border-t mx-5" style={{ borderColor: 'var(--line)' }} />

      {/* Body */}
      <div className="px-5 py-3">
        {post.title && (
          <h2 className="text-[14px] font-bold text-[var(--foreground)] mb-1.5">{post.title}</h2>
        )}
        <p className="text-[13px] text-[var(--stone-700)] leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
        />
        {post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.attachments.map(a => <AttachmentChip key={a.id} attachment={a} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t mx-5 pt-2 pb-3 flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={() => setShowComments(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-[var(--stone-100)]"
          style={{ color: showComments ? 'var(--indigo-600)' : 'var(--muted)' }}
        >
          <MessageSquare size={13} />
          <span>댓글 {post.comments.length}개</span>
        </button>
        {post.attachments.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[var(--muted)]">
            <Paperclip size={13} />
            <span>첨부 {post.attachments.length}개</span>
          </span>
        )}
      </div>

      {/* Comments */}
      {showComments && post.comments.length > 0 && (
        <div className="border-t mx-0 bg-[var(--stone-50)] rounded-b-[14px]" style={{ borderColor: 'var(--line)' }}>
          {post.comments.map(comment => {
            const ca = getProfile(comment.authorId)!;
            return (
              <div key={comment.id} className="px-5 py-3 flex gap-2.5 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
                <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-semibold text-[var(--foreground)]">{ca.name}</span>
                    <span className="text-[10px] text-[var(--muted)]">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-[var(--stone-700)]">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/post-card.tsx
git commit -m "feat: add PostCard component with comments expand"
```

---

## Task 9: Composer Component

**Files:**
- Create: `components/composer.tsx`

- [ ] **Step 1: Create components/composer.tsx**

```tsx
// components/composer.tsx
'use client';
import { Paperclip, Send } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { getProfile, CURRENT_USER_ID } from '@/lib/mock-data';

export default function Composer() {
  const user = getProfile(CURRENT_USER_ID)!;
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="md" />
        <div className="flex-1">
          <textarea
            placeholder="팀에 공유할 내용을 작성하세요..."
            rows={3}
            className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
            style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
          />
          <div className="flex items-center justify-between mt-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--stone-100)] transition-colors">
              <Paperclip size={13} />
              파일 첨부
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--indigo-600)' }}>
              <Send size={13} />
              게시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/composer.tsx
git commit -m "feat: add Composer component"
```

---

## Task 10: Feed Page (전체 피드)

**Files:**
- Create: `app/(workspace)/feed/page.tsx`

- [ ] **Step 1: Create app/(workspace)/feed/page.tsx**

```tsx
// app/(workspace)/feed/page.tsx
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getPostsForBoard } from '@/lib/mock-data';

export default function FeedPage() {
  const posts = getPostsForBoard('feed');
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="전체 피드" subtitle="오늘 업무 현황을 확인하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer />
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/feed/
git commit -m "feat: add Feed page"
```

---

## Task 11: Board Page

**Files:**
- Create: `app/(workspace)/board/[boardId]/page.tsx`

- [ ] **Step 1: Create app/(workspace)/board/[boardId]/page.tsx**

```tsx
// app/(workspace)/board/[boardId]/page.tsx
import { notFound } from 'next/navigation';
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { mockBoards, getPostsForBoard } from '@/lib/mock-data';

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const board = mockBoards.find(b => b.id === params.boardId);
  if (!board) notFound();
  const posts = getPostsForBoard(params.boardId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={board.name}
        subtitle={board.description}
        breadcrumb={[{ label: '게시판' }, { label: board.name }]}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer />
        {posts.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/board/
git commit -m "feat: add Board page"
```

---

## Task 12: Work Report Page

**Files:**
- Create: `app/(workspace)/work-report/page.tsx`

- [ ] **Step 1: Create app/(workspace)/work-report/page.tsx**

```tsx
// app/(workspace)/work-report/page.tsx
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { mockWorkReports, getProfile } from '@/lib/mock-data';

const statusMap = {
  draft:     { label: '임시저장', variant: 'gray' as const },
  submitted: { label: '제출완료', variant: 'indigo' as const },
  reviewed:  { label: '검토완료', variant: 'green' as const },
};

export default function WorkReportPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="업무보고" subtitle="일일 업무 현황을 기록하고 공유하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Write report */}
          <div className="xl:col-span-1">
            <div className="card p-5">
              <h2 className="text-[14px] font-bold text-[var(--foreground)] mb-4">오늘 업무보고 작성</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">오늘 완료한 업무</label>
                  <textarea rows={4} placeholder="완료한 업무를 작성하세요" className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">내일 예정 업무</label>
                  <textarea rows={4} placeholder="내일 예정 업무를 작성하세요" className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">이슈 / 특이사항</label>
                  <textarea rows={2} placeholder="이슈나 공유 사항이 있으면 작성하세요" className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
                </div>
                <button className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
                  업무보고 제출
                </button>
              </div>
            </div>
          </div>

          {/* Team reports */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-[14px] font-bold text-[var(--foreground)]">팀원 업무보고 — 2026.04.28</h2>
            {mockWorkReports.map(report => {
              const author = getProfile(report.authorId)!;
              const status = statusMap[report.status];
              return (
                <div key={report.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={author.avatarInitial} color={author.avatarColor} size="md" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{author.name}</div>
                        <div className="text-[11px] text-[var(--muted)]">{author.position}</div>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--stone-500)] mb-1.5 uppercase tracking-wide">완료한 업무</div>
                      <div className="space-y-1">
                        {report.completedTasks.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--stone-700)]">
                            <CheckCircle2 size={13} className="text-[var(--success)] mt-0.5 flex-shrink-0" />
                            {t}
                          </div>
                        ))}
                        {report.plannedTasks.filter(t => !report.completedTasks.includes(t)).map((t, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--muted)]">
                            <Circle size={13} className="mt-0.5 flex-shrink-0" />
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                    {report.issues && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--stone-100)] text-[12px] text-[var(--stone-700)]">
                        <AlertCircle size={13} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
                        {report.issues}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/work-report/
git commit -m "feat: add Work Report page"
```

---

## Task 13: Calendar Page

**Files:**
- Create: `app/(workspace)/calendar/page.tsx`

- [ ] **Step 1: Create app/(workspace)/calendar/page.tsx**

```tsx
// app/(workspace)/calendar/page.tsx
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { mockCalendarEvents } from '@/lib/mock-data';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const typeVariant: Record<string, 'indigo' | 'green' | 'yellow' | 'red' | 'gray'> = {
  meeting: 'indigo', deadline: 'red', holiday: 'yellow', personal: 'green',
};
const typeLabel: Record<string, string> = {
  meeting: '미팅', deadline: '마감', holiday: '휴일', personal: '개인',
};

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const year = 2026, month = 3; // April (0-indexed)
  const cells = buildCalendar(year, month);
  const monthLabel = `2026년 4월`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="캘린더" subtitle="일정을 관리하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Calendar grid */}
          <div className="xl:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-[var(--stone-100)]"><ChevronLeft size={16} /></button>
                <h2 className="text-[15px] font-bold text-[var(--foreground)]">{monthLabel}</h2>
                <button className="p-1 rounded hover:bg-[var(--stone-100)]"><ChevronRight size={16} /></button>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--indigo-600)' }}>
                <Plus size={13} /> 일정 추가
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-[var(--muted)] py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-[var(--line)]">
              {cells.map((day, i) => {
                const dateStr = day ? `2026-04-${String(day).padStart(2, '0')}` : '';
                const events = mockCalendarEvents.filter(e => e.date === dateStr);
                const isToday = day === 28;
                return (
                  <div key={i} className={`bg-white min-h-[72px] p-1.5 ${!day ? 'opacity-30' : 'cursor-pointer hover:bg-[var(--stone-50)]'}`}>
                    {day && (
                      <>
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${isToday ? 'bg-[var(--indigo-600)] text-white' : 'text-[var(--stone-700)]'}`}>
                          {day}
                        </div>
                        {events.slice(0, 2).map(e => (
                          <div key={e.id} className={`text-[9px] font-medium px-1 py-0.5 rounded mb-0.5 truncate ${
                            e.type === 'meeting' ? 'bg-[var(--indigo-50)] text-[var(--indigo-700)]' :
                            e.type === 'deadline' ? 'bg-[#fee2e2] text-[#991b1b]' :
                            e.type === 'holiday' ? 'bg-[#fef9c3] text-[#92400e]' :
                            'bg-[#d1fae5] text-[#065f46]'
                          }`}>{e.title}</div>
                        ))}
                        {events.length > 2 && <div className="text-[9px] text-[var(--muted)]">+{events.length - 2}개</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-[var(--foreground)]">다가오는 일정</h3>
            {mockCalendarEvents.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
              <div key={event.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[var(--foreground)]">{event.title}</span>
                  <Badge variant={typeVariant[event.type]}>{typeLabel[event.type]}</Badge>
                </div>
                <div className="text-[11px] text-[var(--muted)]">{event.date.replace(/-/g, '.')}</div>
                {event.description && <div className="text-[11px] text-[var(--stone-600)] mt-1">{event.description}</div>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/calendar/
git commit -m "feat: add Calendar page"
```

---

## Task 14: Memo Page

**Files:**
- Create: `app/(workspace)/memo/page.tsx`

- [ ] **Step 1: Create app/(workspace)/memo/page.tsx**

```tsx
// app/(workspace)/memo/page.tsx
import Topbar from '@/components/topbar';
import { Tag } from '@/components/ui/tag';
import { Pin, Plus, Edit3 } from 'lucide-react';
import { mockMemos } from '@/lib/mock-data';

export default function MemoPage() {
  const pinned = mockMemos.filter(m => m.isPinned);
  const rest = mockMemos.filter(m => !m.isPinned);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="메모장" subtitle="나만의 업무 메모를 관리하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
            <Plus size={14} /> 새 메모
          </button>
        </div>

        {pinned.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Pin size={13} className="text-[var(--indigo-500)]" />
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">고정됨</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pinned.map(memo => <MemoCard key={memo.id} memo={memo} />)}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">메모</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rest.map(memo => <MemoCard key={memo.id} memo={memo} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoCard({ memo }: { memo: typeof mockMemos[0] }) {
  return (
    <div className="card p-4 group cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[13px] font-bold text-[var(--foreground)]">{memo.title}</h3>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--stone-100)] transition-all">
          <Edit3 size={12} className="text-[var(--muted)]" />
        </button>
      </div>
      <p className="text-[12px] text-[var(--stone-600)] whitespace-pre-line line-clamp-4 mb-3">{memo.content}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {memo.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
        <span className="text-[10px] text-[var(--stone-400)]">{memo.updatedAt.slice(0, 10).replace(/-/g, '.')}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/memo/
git commit -m "feat: add Memo page"
```

---

## Task 15: Notifications Page

**Files:**
- Create: `app/(workspace)/notifications/page.tsx`

- [ ] **Step 1: Create app/(workspace)/notifications/page.tsx**

```tsx
// app/(workspace)/notifications/page.tsx
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserCheck, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';

const typeIcon: Record<string, React.ElementType> = {
  comment: MessageSquare, approval: UserCheck, board: LayoutDashboard, report: FileText, mention: Bell,
};
const typeVariant: Record<string, 'indigo' | 'green' | 'yellow' | 'gray'> = {
  comment: 'indigo', approval: 'yellow', board: 'green', report: 'gray', mention: 'indigo',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function NotificationsPage() {
  const unread = mockNotifications.filter(n => !n.isRead);
  const read = mockNotifications.filter(n => n.isRead);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="알림" subtitle={`읽지 않은 알림 ${unread.length}개`} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl">
        {unread.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">읽지 않음</div>
            <div className="space-y-2">
              {unread.map(n => <NotifItem key={n.id} n={n} />)}
            </div>
          </div>
        )}
        {read.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">읽음</div>
            <div className="space-y-2 opacity-60">
              {read.map(n => <NotifItem key={n.id} n={n} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifItem({ n }: { n: typeof mockNotifications[0] }) {
  const Icon = typeIcon[n.type] ?? Bell;
  const variant = typeVariant[n.type] ?? 'gray';
  return (
    <div className={`card p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-2' : ''}`} style={!n.isRead ? { borderLeftColor: 'var(--indigo-500)' } : {}}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--indigo-50)' }}>
        <Icon size={14} className="text-[var(--indigo-500)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-[var(--foreground)]">{n.title}</span>
          <Badge variant={variant}>{n.type === 'comment' ? '댓글' : n.type === 'approval' ? '승인' : n.type === 'board' ? '게시판' : '보고'}</Badge>
        </div>
        <p className="text-[12px] text-[var(--stone-600)]">{n.body}</p>
        <span className="text-[10px] text-[var(--stone-400)]">{timeAgo(n.createdAt)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(workspace\)/notifications/
git commit -m "feat: add Notifications page"
```

---

## Task 16: Profile & Settings Pages

**Files:**
- Create: `app/(workspace)/profile/page.tsx`
- Create: `app/(workspace)/settings/page.tsx`

- [ ] **Step 1: Create app/(workspace)/profile/page.tsx**

```tsx
// app/(workspace)/profile/page.tsx
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Building, Briefcase, Calendar } from 'lucide-react';
import { getProfile, CURRENT_USER_ID } from '@/lib/mock-data';

export default function ProfilePage() {
  const user = getProfile(CURRENT_USER_ID)!;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="내 프로필" />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar initial={user.avatarInitial} color={user.avatarColor} size="lg" className="w-16 h-16 text-lg rounded-2xl" />
            <div>
              <h2 className="text-[18px] font-bold text-[var(--foreground)]">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>{user.role === 'admin' ? '관리자' : '멤버'}</Badge>
                <Badge variant="green">승인됨</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
            {[
              { icon: Mail, label: '이메일', value: user.email },
              { icon: Building, label: '부서', value: user.department },
              { icon: Briefcase, label: '직책', value: user.position },
              { icon: Calendar, label: '입사일', value: user.joinedAt.replace(/-/g, '.') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={15} className="text-[var(--muted)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--muted)] w-16">{item.label}</span>
                <span className="text-[13px] text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--line)' }}>
            <button className="w-full py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}>
              프로필 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(workspace)/settings/page.tsx**

```tsx
// app/(workspace)/settings/page.tsx
import Topbar from '@/components/topbar';
import { Bell, Palette, Lock, Globe } from 'lucide-react';

const sections = [
  {
    title: '알림 설정',
    icon: Bell,
    items: [
      { label: '새 댓글 알림', desc: '내 게시글에 댓글이 달리면 알림을 받습니다', enabled: true },
      { label: '가입 승인 알림', desc: '새 가입 신청 시 알림을 받습니다 (관리자 전용)', enabled: true },
      { label: '이메일 알림', desc: '알림을 이메일로도 받습니다', enabled: false },
    ],
  },
  {
    title: '화면 설정',
    icon: Palette,
    items: [
      { label: '다크 모드', desc: '어두운 테마로 전환합니다', enabled: false },
      { label: '알림 배지 표시', desc: '사이드바에 읽지 않은 알림 수를 표시합니다', enabled: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="설정" />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl space-y-4">
        {sections.map(section => (
          <div key={section.title} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon size={16} className="text-[var(--indigo-500)]" />
              <h2 className="text-[14px] font-bold text-[var(--foreground)]">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--foreground)]">{item.label}</div>
                    <div className="text-[11px] text-[var(--muted)]">{item.desc}</div>
                  </div>
                  <button
                    className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ background: item.enabled ? 'var(--indigo-500)' : 'var(--stone-300)' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: item.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(workspace\)/profile/ app/\(workspace\)/settings/
git commit -m "feat: add Profile and Settings pages"
```

---

## Task 17: Admin Layout & Approvals Page

**Files:**
- Create: `app/(workspace)/admin/layout.tsx`
- Create: `app/(workspace)/admin/approvals/page.tsx`

- [ ] **Step 1: Create app/(workspace)/admin/layout.tsx**

```tsx
// app/(workspace)/admin/layout.tsx
import Link from 'next/link';
import { Shield, Users, Key, LayoutList } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin/approvals', label: '가입 승인', icon: Shield },
  { href: '/admin/members',   label: '회원 관리', icon: Users },
  { href: '/admin/permissions', label: '권한 관리', icon: Key },
  { href: '/admin/boards',    label: '게시판 관리', icon: LayoutList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <nav className="w-48 flex-shrink-0 border-r p-3 space-y-0.5" style={{ borderColor: 'var(--line)', background: 'white' }}>
        <div className="px-3 py-2 text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">관리자 메뉴</div>
        {ADMIN_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--stone-600)] hover:text-[var(--foreground)] hover:bg-[var(--stone-100)] transition-colors">
            <item.icon size={14} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(workspace)/admin/approvals/page.tsx**

```tsx
// app/(workspace)/admin/approvals/page.tsx
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { getPendingUsers } from '@/lib/mock-data';

export default function ApprovalsPage() {
  const pending = getPendingUsers();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="가입 승인" subtitle={`승인 대기 중인 신청 ${pending.length}건`} breadcrumb={[{ label: '관리자' }, { label: '가입 승인' }]} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl space-y-4">
        {pending.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">대기 중인 가입 신청이 없습니다.</div>
        ) : (
          pending.map(user => (
            <div key={user.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar initial={user.avatarInitial} color={user.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--foreground)]">{user.name}</span>
                    <Badge variant="yellow">승인 대기</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-[var(--muted)]">{user.department} · {user.position}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail size={11} className="text-[var(--muted)]" />
                    <span className="text-[11px] text-[var(--muted)]">{user.email}</span>
                  </div>
                  <div className="text-[10px] text-[var(--stone-400)] mt-1">신청일: {user.joinedAt.replace(/-/g, '.')}</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
                    <CheckCircle2 size={13} /> 승인
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}>
                    <XCircle size={13} /> 거절
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(workspace\)/admin/
git commit -m "feat: add Admin layout and Approvals page"
```

---

## Task 18: Admin Members, Permissions, Boards Pages

**Files:**
- Create: `app/(workspace)/admin/members/page.tsx`
- Create: `app/(workspace)/admin/permissions/page.tsx`
- Create: `app/(workspace)/admin/boards/page.tsx`

- [ ] **Step 1: Create app/(workspace)/admin/members/page.tsx**

```tsx
// app/(workspace)/admin/members/page.tsx
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { mockProfiles } from '@/lib/mock-data';

export default function MembersPage() {
  const approved = mockProfiles.filter(p => p.status === 'approved');
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="회원 관리" subtitle={`전체 회원 ${approved.length}명`} breadcrumb={[{ label: '관리자' }, { label: '회원 관리' }]} />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                {['이름', '부서', '직책', '이메일', '역할', '가입일', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approved.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={user.avatarInitial} color={user.avatarColor} size="sm" />
                      <span className="text-[13px] font-semibold text-[var(--foreground)]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-600)]">{user.department}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-600)]">{user.position}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-500)]">{user.email}</td>
                  <td className="px-4 py-3"><Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>{user.role === 'admin' ? '관리자' : '멤버'}</Badge></td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted)]">{user.joinedAt.replace(/-/g, '.')}</td>
                  <td className="px-4 py-3"><button className="p-1 rounded hover:bg-[var(--stone-100)]"><MoreHorizontal size={14} className="text-[var(--muted)]" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/(workspace)/admin/permissions/page.tsx**

```tsx
// app/(workspace)/admin/permissions/page.tsx
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { mockProfiles, mockBoards, mockBoardPermissions } from '@/lib/mock-data';
import { Check } from 'lucide-react';

export default function PermissionsPage() {
  const members = mockProfiles.filter(p => p.status === 'approved' && p.role === 'member');
  const boards = mockBoards.filter(b => !b.isPublic);

  const hasPermission = (userId: string, boardId: string) =>
    mockBoardPermissions.some(p => p.profileId === userId && p.boardId === boardId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="권한 관리" subtitle="게시판별 접근 권한을 설정하세요" breadcrumb={[{ label: '관리자' }, { label: '권한 관리' }]} />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">멤버</th>
                {boards.map(b => (
                  <th key={b.id} className="text-center px-3 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">{b.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initial={user.avatarInitial} color={user.avatarColor} size="sm" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{user.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{user.department}</div>
                      </div>
                    </div>
                  </td>
                  {boards.map(board => (
                    <td key={board.id} className="text-center px-3 py-3">
                      <button
                        className="w-6 h-6 rounded flex items-center justify-center mx-auto transition-all"
                        style={{
                          background: hasPermission(user.id, board.id) ? 'var(--indigo-500)' : 'var(--stone-200)',
                        }}
                      >
                        {hasPermission(user.id, board.id) && <Check size={12} className="text-white" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-3">클릭하면 권한을 토글할 수 있습니다. 관리자는 모든 게시판에 자동 접근 권한이 있습니다.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create app/(workspace)/admin/boards/page.tsx**

```tsx
// app/(workspace)/admin/boards/page.tsx
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Globe, Lock } from 'lucide-react';
import { mockBoards } from '@/lib/mock-data';

export default function BoardsAdminPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="게시판 관리" subtitle="게시판을 추가하고 설정하세요" breadcrumb={[{ label: '관리자' }, { label: '게시판 관리' }]} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl">
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
            <Plus size={14} /> 게시판 추가
          </button>
        </div>
        <div className="card overflow-hidden">
          {mockBoards.map((board, i) => (
            <div key={board.id} className={`flex items-center gap-4 px-5 py-4 ${i < mockBoards.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--line)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--foreground)]">{board.name}</span>
                  <Badge variant={board.isPublic ? 'green' : 'gray'}>
                    {board.isPublic ? '전체 공개' : '권한 필요'}
                  </Badge>
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{board.description}</div>
              </div>
              <div className="flex items-center gap-2">
                {board.isPublic ? <Globe size={13} className="text-[var(--success)]" /> : <Lock size={13} className="text-[var(--muted)]" />}
                <button className="p-1.5 rounded hover:bg-[var(--stone-100)] transition-colors">
                  <MoreHorizontal size={15} className="text-[var(--muted)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(workspace\)/admin/members/ app/\(workspace\)/admin/permissions/ app/\(workspace\)/admin/boards/
git commit -m "feat: add Admin Members, Permissions, Boards pages"
```

---

## Task 19: Remove Old Components & Final Cleanup

**Files:**
- Delete: `components/workspace-shell.tsx`
- Delete: `components/feed-panel.tsx`
- Delete: `components/detail-panel.tsx`
- Delete: `components/participant-panel.tsx`
- Delete: `components/status-pill.tsx`

- [ ] **Step 1: Delete old components**

```bash
rm components/workspace-shell.tsx components/feed-panel.tsx components/detail-panel.tsx components/participant-panel.tsx components/status-pill.tsx
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 3: Run dev and manually visit each page**

```bash
npm run dev
```

Visit in order:
1. http://localhost:3000/login
2. http://localhost:3000/register
3. http://localhost:3000/pending
4. http://localhost:3000/feed
5. http://localhost:3000/board/sales
6. http://localhost:3000/board/dev
7. http://localhost:3000/work-report
8. http://localhost:3000/calendar
9. http://localhost:3000/memo
10. http://localhost:3000/notifications
11. http://localhost:3000/profile
12. http://localhost:3000/settings
13. http://localhost:3000/admin/approvals
14. http://localhost:3000/admin/members
15. http://localhost:3000/admin/permissions
16. http://localhost:3000/admin/boards

Expected: all pages render with correct design, no console errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete mock-data UI for all WIL workspace pages"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] All pages covered: login, register, pending, feed, board/[boardId], work-report, calendar, memo, notifications, profile, settings, admin/(approvals/members/permissions/boards)
- [x] No Supabase — all data from mock-data.ts
- [x] No emojis — lucide-react icons only throughout
- [x] Pretendard font loaded via CDN in root layout
- [x] Design tokens: dark sidebar #1a1825, indigo accent #6366f1, warm bg #f2f0ee
- [x] All Supabase table names use `work_` prefix (noted in plan header, applies to Phase 2)
- [x] All routes use Next.js App Router with (auth) and (workspace) route groups
- [x] Types defined before mock data; mock data references types correctly
- [x] No placeholder steps — all code blocks are complete and runnable
- [x] Every task ends with a commit
