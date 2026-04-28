# WIL 협업툴 전체 리빌드 디자인 스펙

**작성일**: 2026-04-28  
**범위**: 전체 UI 리빌드 + 신규 기능 5개 + Supabase 인증/권한  
**스택**: Next.js · TypeScript · Tailwind CSS · Supabase · Pretendard · lucide-react

---

## 1. 디자인 시스템

### 1.1 컬러 토큰

```css
/* Warm Premium Light Background */
--bg-app:      #f2f0ee   /* 전체 앱 배경 */
--bg-surface:  #fafaf9   /* 카드, 사이드바 본문 */
--bg-content:  #f5f4f2   /* 피드 영역, 인풋 배경 */

/* Border */
--border:      #e7e5e4
--border-soft: #eeece9

/* Deep Indigo Accent */
--indigo-900:  #1e1b4b   /* 사이드바 활성, 버튼 배경, 아바타 */
--indigo-700:  #4338ca   /* hover 상태 */
--indigo-500:  #6366f1   /* 주요 액센트, active dot */
--indigo-100:  #e0e7ff
--indigo-50:   #eef2ff   /* 태그 배경, hover 배경 */

/* Dark Sidebar */
--sidebar-bg:     #1a1825
--sidebar-hover:  rgba(255,255,255,0.06)
--sidebar-active: rgba(99,102,241,0.18)
--sidebar-text:   #c4c0d4
--sidebar-muted:  #6b6880
--sidebar-border: rgba(255,255,255,0.06)

/* Stone Text Scale */
--text-900: #1c1917
--text-700: #44403c
--text-500: #78716c
--text-400: #a8a29e

/* Semantic */
--success: #16a34a   /* 온라인 dot, 승인 상태 */
--warning: #d97706   /* 대기 상태 */
--danger:  #be123c   /* 거절, 중요 */
```

### 1.2 타이포그래피

- **폰트**: Pretendard (CDN) — 이모지 사용 금지, lucide-react 아이콘 전용
- **글꼴 로딩**: `next/font` 또는 CDN import in `globals.css`
- **계층**:
  - 페이지 타이틀: `16px / 700`
  - 카드 제목: `14px / 700`
  - 본문: `13px / 400, line-height 1.65`
  - 메타/보조: `11px / 400–600`
  - 레이블: `10px / 700, letter-spacing 0.8px`

### 1.3 그림자 & 반경

```
--shadow-card: 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)
--shadow-lift: 0 4px 16px rgba(0,0,0,0.08)
--shadow-float: 0 8px 28px rgba(0,0,0,0.10)

반경: 버튼 8px / 카드 14px / 모달 16px / 아바타 9px / 태그 6px
```

### 1.4 아이콘

전체 lucide-react 사용. 사이즈 기준: 네비 16px / 인라인 14px / 버튼 내 13px.

---

## 2. 정보 구조 (IA)

```
WIL Workspace
├─ 전체 피드                  (모든 멤버 기본 접근)
├─ 팀별 게시판
│  ├─ 컨텐츠팀               (권한 필요)
│  ├─ 영업팀                 (권한 필요)
│  ├─ 생산팀                 (권한 필요)
│  ├─ 물류팀                 (권한 필요)
│  ├─ 신사업팀               (권한 필요)
│  └─ 경영관리실             (권한 필요)
├─ 업무
│  ├─ 업무보고               (권한 필요)
│  ├─ 캘린더                 (모든 멤버)
│  └─ 메모장                 (개인 전용)
├─ 알림센터                  (모든 멤버)
├─ 마이페이지                (모든 멤버)
├─ 설정                      (모든 멤버, 일반 설정)
└─ 관리자                    (admin 역할만 표시)
   ├─ 가입 승인 관리
   ├─ 멤버 관리
   ├─ 게시판 권한 관리
   └─ 게시판 추가/설정
```

---

## 3. 레이아웃 구조

### PC (≥1024px)
```
[사이드바 232px] [메인 피드 flex-1] [참여자 패널 280px, 토글]
```

### 모바일 (<1024px)
- 사이드바: 좌측 드로어 (오버레이)
- 참여자: 우측 드로어 (오버레이)
- 상단 헤더에 햄버거 메뉴 버튼

---

## 4. 컴포넌트 설계

### 4.1 BoardSidebar

**구조**:
1. 헤더: 로고마크(W, 인디고 그라디언트) + "WIL / Workspace" + 검색바
2. 네비게이션 (섹션 레이블 + nav-item 목록):
   - 섹션 없음: 전체 피드
   - 팀별 게시판: 각 팀
   - 업무: 업무보고 / 캘린더 / 메모장
   - 기타: 알림센터 / 마이페이지 / 설정
   - 관리자 (admin만 렌더): 관리자
3. 푸터: 사용자 아바타 + 이름 + 역할 + 더보기 버튼

**활성 상태**: 좌측 3px 인디고 바 + `rgba(99,102,241,0.18)` 배경  
**미읽음 배지**: 인디고-500 배경, 흰 텍스트 / 없으면 stone-100 muted  
**권한 없는 게시판**: 목록에 표시하지 않음 (서버에서 필터)

### 4.2 Topbar

높이 56px, `bg-surface/92 backdrop-blur-md`, 하단 border.

좌: breadcrumb(> 구분자) + 현재 페이지 타이틀  
우: 통계 칩(오늘 게시/미읽음/접속중) + 참여자 토글 버튼

### 4.3 PostCard (리치 카드)

```
┌─────────────────────────────────┐
│ [아바타] 이름  소속  핀뱃지  시간│  ← post-header (14px 16px)
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  ← 1px divider
│ 제목 (14/700)                   │  ← post-body (10px 16px)
│ 본문 텍스트 (13/400)            │
│ [태그들: 상태 / 멘션 / 해시]    │
├─────────────────────────────────┤
│ 💬 댓글 N  📎 첨부 N   조회 N  │  ← post-footer (bg-content)
└─────────────────────────────────┘
```

- hover: `shadow-lift` + border `#dcdad7`
- 핀 게시물: border `--indigo-100` + 배경 `rgba(99,102,241,0.02)`
- 중요 태그: `bg-[#fff1f2]` + `text-[#be123c]`
- 상태 태그: `bg-indigo-50` + `text-indigo-700`
- 멘션 태그: `bg-green-50` + `text-green-700`
- 해시 태그: `bg-bg-content` + `text-text-500`

### 4.4 Composer (하단 입력창)

`position: absolute bottom-0`, `pointer-events-none` 래퍼, `pointer-events-auto` 실제 박스.

```
┌──────────────────────────────┐
│ textarea (auto-resize)       │
├──────────────────────────────┤
│ [📎][@][#][⚡]    [전송▶]  │
└──────────────────────────────┘
```

- `border-radius: 14px`, `shadow-float`
- textarea: Pretendard, 13px, resize none, max-height 160px

### 4.5 CommentModal (댓글 팝업)

PC: `fixed inset-0 z-[300]`, 배경 `bg-slate-950/30 backdrop-blur-sm`  
모달: `max-w-3xl`, 2열 (`원문 | 댓글 스레드`)  
모바일: 전체 화면 슬라이드업

### 4.6 ParticipantPanel

280px 우측 패널. 부서별 그룹 헤더(bg-content 라운드) + 멤버 행(온라인 dot).

### 4.7 NotificationBadge

알림센터 nav 아이템에 미읽음 카운트. 클릭 시 알림 목록 페이지로 이동.

---

## 5. 인증 (Supabase Auth)

### 5.1 플로우

```
[로그인 페이지]
  ├─ 로그인 성공 → 승인 여부 확인
  │   ├─ approved=true → Workspace 진입
  │   └─ approved=false → "관리자 승인 대기 중" 안내 페이지
  └─ 회원가입 신청
      ├─ supabase.auth.signUp() 호출
      ├─ profiles 테이블에 name/team/role 저장, status='pending'
      └─ 관리자에게 알림 (notifications 테이블 insert)

[관리자 승인]
  ├─ 대기 목록 조회: profiles where status='pending'
  ├─ 승인: status='approved', 기본 권한 부여
  └─ 거절: status='rejected', 이유 기록
```

### 5.2 미들웨어 (middleware.ts)

- 비인증 유저: `/login` 리다이렉트
- `pending` 유저: `/pending` 안내 페이지
- `rejected` 유저: `/rejected` 안내 페이지
- 관리자 전용 라우트 (`/admin/**`): role 검증

### 5.3 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # 서버사이드 전용
```

---

## 6. 권한 모델

### 6.1 역할 (profiles.role)

| 역할 | 설명 |
|------|------|
| `admin` | 전체 접근 + 관리자 기능. board_permissions 테이블 무시하고 코드에서 전체 허용 |
| `member` | 전체 피드 기본 접근 + board_permissions에 등록된 게시판만 접근 |

> 팀장/팀원 구분은 profiles.role이 아닌 display 전용 필드(profiles.title)로 표시. 권한 로직은 admin/member 2단계만 사용.

### 6.2 게시판 권한 테이블 (board_permissions)

```sql
board_permissions (
  id          uuid primary key,
  profile_id  uuid references profiles(id),
  board_id    uuid references boards(id),
  created_at  timestamptz
)
```

- `admin` 역할: 모든 게시판 자동 접근 (코드에서 bypass)
- 그 외: `board_permissions` 테이블에 레코드 있어야 접근
- 전체 피드: 모든 인증 유저 접근 (권한 불필요)
- 사이드바: 접근 가능한 게시판만 표시

---

## 7. 신규 기능 화면

### 7.1 업무보고 (WorkReport)

- 기간 선택 (주간 기본)
- 필드: 목표 / 진행 업무 / 이슈 / 다음 주 계획
- 팀별/개인별 목록 뷰
- 전주 대비 변경사항 diff 표시 (텍스트 기반)

### 7.2 캘린더 (Calendar)

- 월간 뷰 기본, 주간 뷰 전환 가능
- 일정 등록: 제목 / 날짜+시간 / 담당자 / 참여자 멘션
- 게시판 연동: 일정 → 피드 공유 버튼
- 데이터: `schedules` 테이블 (title, start_at, end_at, created_by, attendees[])

### 7.3 메모장 (Memo)

- 개인 전용 (타인 접근 불가)
- 작성: 제목 / 본문 / 체크리스트 토글
- 중요 표시 (상단 고정)
- "피드로 공유" 버튼 → 선택 게시판에 게시글로 변환

### 7.4 알림센터 (Notifications)

- 멘션 알림 / 댓글 알림 / 게시글 업데이트 / 가입 승인(관리자용)
- 읽음/미읽음 상태
- "모두 읽음" 버튼

### 7.5 마이페이지 (Profile)

- 프로필 사진(아바타 이니셜 기본) / 이름 / 소속 / 직책 편집
- 비밀번호 변경

### 7.6 설정 (Settings)

- 알림 수신 설정 (멘션/댓글/공지)
- 언어/테마(추후)

### 7.7 관리자 (Admin)

4개 탭:
1. **가입 승인**: 대기/승인/거절 목록
2. **멤버 관리**: 전체 멤버 목록, 역할 변경, 비활성화
3. **게시판 권한**: 사용자 × 게시판 체크박스 매트릭스
4. **게시판 설정**: 게시판 추가/이름 변경/순서 조정/삭제

---

## 8. 데이터 모델 추가/변경

### 기존 변경

```sql
-- profiles 변경
ALTER TABLE profiles ADD COLUMN status text DEFAULT 'pending';
  -- 값: 'pending' | 'approved' | 'rejected'
ALTER TABLE profiles ADD COLUMN avatar_url text;
ALTER TABLE profiles ADD COLUMN rejection_reason text;
ALTER TABLE profiles ADD COLUMN title text;    -- 직책 표시용 (팀장/대리 등), 권한 무관

-- profiles.role 허용 값 명시
  -- 'admin' | 'member'  (2단계만 사용)

-- boards.kind 허용 값 확장
  -- 'feed' | 'team' | 'work_report' | 'memo'

-- 관리자가 게시판 추가 시: boards 테이블에 insert (kind='team', team_id 연결)
-- 기본 6개 팀 게시판 외 추가 가능, 이름/순서/삭제 모두 admin UI에서 관리
```

### 신규 테이블

```sql
-- 게시판 권한
CREATE TABLE board_permissions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id) on delete cascade,
  board_id    uuid references boards(id) on delete cascade,
  created_at  timestamptz default now(),
  UNIQUE(profile_id, board_id)
);

-- 일정
CREATE TABLE schedules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz,
  all_day     boolean default false,
  created_by  uuid references profiles(id),
  attendee_ids uuid[],
  board_id    uuid references boards(id),
  created_at  timestamptz default now()
);
```

---

## 9. 구현 페이즈

### Phase 1 — 디자인 시스템 & UI 전체 리빌드
- globals.css 토큰 교체, Pretendard 적용
- BoardSidebar, Topbar, PostCard, Composer 재작성
- CommentModal, AttachmentPopup, ParticipantPanel 재작성
- 로그인/회원가입 페이지

### Phase 2 — Supabase 인증 & 권한
- Supabase 클라이언트 설정 (.env.local)
- Auth 연동 (signUp / signIn / signOut)
- 관리자 승인 플로우 (middleware + pending 페이지)
- board_permissions 테이블 + 사이드바 필터링

### Phase 3 — 피드 & 게시판 Supabase 연동
- 게시글 CRUD (posts 테이블)
- 댓글/대댓글 CRUD
- 첨부파일 Supabase Storage
- 실시간 업데이트 (supabase realtime) — 선택적 적용. 우선 페이지 포커스 시 refetch로 구현, realtime 구독은 Phase 6 이후 고려

### Phase 4 — 관리자 기능
- 가입 승인 대시보드
- 멤버 관리
- 게시판 권한 매트릭스
- 게시판 추가/설정

### Phase 5 — 신규 기능
- 업무보고
- 캘린더
- 메모장

### Phase 6 — 알림 & 마이페이지
- 알림센터 (멘션/댓글)
- 마이페이지
- 설정

---

## 10. 파일 구조

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
    pending/page.tsx
  (workspace)/
    layout.tsx              ← WorkspaceShell, auth guard
    page.tsx                ← 전체 피드
    board/[boardId]/page.tsx
    work-report/page.tsx
    calendar/page.tsx
    memo/page.tsx
    notifications/page.tsx
    profile/page.tsx
    settings/page.tsx
    admin/
      page.tsx              ← 관리자 대시보드
      approvals/page.tsx
      members/page.tsx
      permissions/page.tsx
      boards/page.tsx

components/
  layout/
    workspace-shell.tsx
    board-sidebar.tsx
    topbar.tsx
    participant-panel.tsx
  feed/
    post-card.tsx
    composer.tsx
    comment-modal.tsx
    attachment-modal.tsx
  auth/
    login-form.tsx
    register-form.tsx
  admin/
    approval-list.tsx
    member-table.tsx
    permission-matrix.tsx
    board-settings.tsx
  ui/
    badge.tsx
    avatar.tsx
    tag.tsx
    button.tsx

lib/
  supabase/
    client.ts               ← 브라우저용
    server.ts               ← 서버 컴포넌트용
    middleware.ts
  types.ts
  mock-data.ts              ← Phase 1에서 임시 유지
```

---

## 11. 비기능 요구사항

- **이모지 금지**: 모든 아이콘은 lucide-react
- **반응형**: PC 1024px+, 모바일 320px+
- **접근성**: `aria-label`, focus-visible 스타일
- **성능**: Pretendard display=swap, 이미지 next/image
- **보안**: SUPABASE_SERVICE_ROLE_KEY는 서버사이드 전용, 클라이언트 노출 금지
