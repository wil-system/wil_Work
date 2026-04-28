# WIL 협업툴 문서

이 폴더는 WIL 협업툴을 체계적으로 구현하기 위한 기준 문서 모음입니다.

## 문서 구성

- `01-product-brief.md`  
  제품 목적, 핵심 문제, 사용자, 1차 MVP 범위

- `02-information-architecture.md`  
  게시판 구조, 화면 구성, 주요 사용자 흐름

- `03-ui-ux-spec.md`  
  현재까지 확정한 UI/UX 정책과 화면별 동작 원칙

- `04-data-model.md`  
  Supabase 기준 주요 테이블과 관계

- `05-implementation-roadmap.md`  
  구현 순서, 우선순위, 다음 개발 작업

## 현재 구현 기준

- Next.js + Tailwind CSS
- Supabase DB
- 전체 피드는 제목 없는 메신저형 피드
- 댓글은 게시글 단위 팝업으로 확인
- 첨부파일은 댓글과 분리된 개별 팝업
- 참여자 패널은 토글식 우측 패널
- 모바일은 좌측 메뉴 드로어 방식
