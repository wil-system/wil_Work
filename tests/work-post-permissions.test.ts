import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

function policy(sql: string, name: string, operation: 'select' | 'insert' | 'update' | 'delete') {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `create policy "${escapedName}"[\\s\\S]*?for ${operation}[\\s\\S]*?;`,
    'i',
  );
  const match = sql.match(pattern);
  assert.ok(match, `${name} ${operation} policy should exist`);
  return match[0];
}

test('work post RLS keeps edits author-only, assignee status-only, and admin delete-only', () => {
  const schema = read('supabase/schema.sql');
  const updatePolicy = policy(schema, 'Authors can update own posts', 'update');
  const deletePolicy = policy(schema, 'Authors can delete own posts', 'delete');

  assert.match(updatePolicy, /author_id\s*=\s*auth\.uid\(\)/);
  assert.match(updatePolicy, /board_id\s*<>\s*'feed'/);
  assert.match(updatePolicy, /work_status\s+is\s+not\s+null[\s\S]*assignee_id\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /assignee_id\s*=\s*auth\.uid\(\)[\s\S]*not\s+is_work_admin\(\)/i);
  assert.match(updatePolicy, /assignee_id\s*=\s*auth\.uid\(\)/);
  assert.equal(updatePolicy.includes('or is_work_admin()'), false);
  assert.match(updatePolicy, /with check[\s\S]*author_id\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /with check[\s\S]*board_id\s*<>\s*'feed'/i);
  assert.match(updatePolicy, /with check[\s\S]*work_status\s+is\s+not\s+null[\s\S]*assignee_id\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /with check[\s\S]*assignee_id\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /with check[\s\S]*assignee_id\s*=\s*auth\.uid\(\)[\s\S]*not\s+is_work_admin\(\)/i);
  assert.equal(/with check[\s\S]*or is_work_admin\(\)/i.test(updatePolicy), false);

  assert.match(deletePolicy, /author_id\s*=\s*auth\.uid\(\)/);
  assert.match(deletePolicy, /is_work_admin\(\)/);
  assert.equal(deletePolicy.includes("board_id <> 'feed'"), false);
  assert.equal(deletePolicy.includes('work_status is null'), false);
  assert.equal(deletePolicy.includes('assignee_id = auth.uid()'), false);

  assert.match(schema, /create or replace function public\.prevent_assignee_post_content_update\(\)/);
  assert.match(schema, /if old\.author_id = auth\.uid\(\) then[\s\S]*return new;/);
  assert.equal(/if is_work_admin\(\) or old\.author_id = auth\.uid\(\)/.test(schema), false);
  assert.match(schema, /old\.assignee_id = auth\.uid\(\)/);
  assert.match(schema, /new\.title is not distinct from old\.title/);
  assert.match(schema, /new\.content is not distinct from old\.content/);
  assert.match(schema, /new\.assignee_id is not distinct from old\.assignee_id/);
  assert.match(schema, /new\.work_status is distinct from old\.work_status/);
  assert.match(schema, /new\.is_pinned = \(new\.work_status = 'in_progress'\)/);
  assert.match(schema, /raise exception 'Assignees can only update work status\.'/);
  assert.match(schema, /create trigger prevent_assignee_post_content_update[\s\S]*before update on public\.work_posts/i);
});

test('work post UI keeps edit and delete controls away from assignees', () => {
  const source = read('components/chat-feed.tsx');

  assert.match(source, /const canEditPost = isMyMessage;/);
  assert.match(source, /const canDeletePost = isMyMessage \|\| currentUserProfile\.role === 'admin';/);
  assert.match(source, /const canManageWorkStatus = canEditPost \|\| \(currentUserProfile\.role !== 'admin' && isTaskPost && post\.assigneeId === currentUserId\);/);
  assert.match(source, /\{canEditPost && \(/);
  assert.match(source, /\{!editingPost && canDeletePost && \(/);
  assert.match(source, /\{isBusiness && isTaskPost && canManageWorkStatus && \(/);
});
