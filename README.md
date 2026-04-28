# WIL 협업툴

WIL 협업툴 기획문서(`WIL 협업툴 2026.04.00.pdf`)를 기반으로 만든 Next.js + Tailwind CSS + Supabase MVP입니다.

## 기획 반영 범위

- ChatGPT 스타일 3패널 구조: 좌측 게시판, 중앙 대화형 피드, 우측 상세/댓글/알림
- 전체 피드: 제목 없는 채팅형/카드형 공유, 해시태그, 담당자 멘션, 중요/핀 표시
- 팀별 게시판: 팀 단위 업무 공유, 상태 관리, 담당자 지정
- 업무게시판: 기간 기반 업무 기록과 Diff 확장을 고려한 `worklogs` 테이블
- 댓글/스레드: 게시글, 댓글, 1단계 대댓글 구조
- 개인 메모장: 개인 기록, 체크리스트, 게시글 전환 필드
- 알림센터: 멘션, 댓글, 게시글 업데이트, 주간업무 등록 이벤트

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Supabase 연결

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. `.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

현재 화면은 샘플 데이터로 동작합니다. 다음 단계에서 `lib/mock-data.ts`를 Supabase query 함수로 교체하면 됩니다.

## 문서

구현 기준 문서는 `docs/` 폴더에 정리되어 있습니다.

- `docs/01-product-brief.md`
- `docs/02-information-architecture.md`
- `docs/03-ui-ux-spec.md`
- `docs/04-data-model.md`
- `docs/05-implementation-roadmap.md`
