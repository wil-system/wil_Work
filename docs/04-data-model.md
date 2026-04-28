# 데이터 모델

Supabase 기준 주요 테이블 설계다. 상세 SQL은 `supabase/schema.sql`을 기준으로 한다.

## profiles

사용자 프로필.

- `id`
- `display_name`
- `role`
- `team_id`
- `created_at`

## teams

소속/팀 정보.

- `id`
- `name`
- `description`
- `leader_id`
- `created_at`

## boards

게시판.

- `id`
- `team_id`
- `name`
- `kind`
- `description`
- `is_pinned`
- `created_at`

## posts

전체 피드 및 팀별 게시글.

- `id`
- `board_id`
- `author_id`
- `title`
- `body`
- `status`
- `is_important`
- `is_pinned`
- `tags`
- `mention_profile_ids`
- `created_at`
- `updated_at`

### 정책

- 전체 피드는 제목 없이 작성 가능해야 한다.
- 업무게시판/팀별 업무 등록에서는 제목 또는 기간 필드가 필요할 수 있다.

## comments

댓글과 대댓글.

- `id`
- `post_id`
- `parent_id`
- `author_id`
- `body`
- `mention_profile_ids`
- `created_at`

### 정책

- 대댓글은 1단계까지만 허용한다.
- 댓글 팝업에서는 원문과 댓글을 함께 확인할 수 있어야 한다.

## attachments

파일 첨부.

- `id`
- `post_id`
- `comment_id`
- `file_name`
- `storage_path`
- `mime_type`
- `size_bytes`
- `created_by`
- `created_at`

## worklogs

업무게시판 기록.

- `period_start`
- `period_end`
- `goals`
- `progress`
- `issues`
- `next_plan`
- `diff_summary`

## memos

개인 메모.

- `author_id`
- `title`
- `body`
- `checklist`
- `converted_post_id`
- `is_important`

## notifications

알림.

- `recipient_id`
- `actor_id`
- `post_id`
- `comment_id`
- `event`
- `title`
- `is_read`
- `is_important`
