import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

function readEnvFile(filePath) {
  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    env[key] = rawValue.replace(/^["']|["']$/g, '');
  }

  return env;
}

function toDateKey(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildContent(dateKey, index) {
  const topics = [
    '고객 피드백 정리',
    '업무 우선순위 조정',
    '주간 진행 상황 공유',
    '자료 검토 요청',
    '회의 후속 액션',
    '이슈 확인 및 대응',
    '일정 변경 공유',
    '협업 요청',
  ];
  const topic = topics[index % topics.length];

  return [
    `[TEST_FEED_SEED_${dateKey}] ${topic}`,
    '',
    `테스트용 전체 피드 글입니다. 날짜 필터와 하단 정렬 확인을 위해 생성되었습니다.`,
    `항목 번호: ${index + 1}`,
  ].join('\n');
}

const envPath = path.join(process.cwd(), '.env.local');
const env = readEnvFile(envPath);
const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const password = env.SUPABASE_DB_PASSWORD;
const ref = projectUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!ref) throw new Error('NEXT_PUBLIC_SUPABASE_URL에서 Supabase project ref를 찾지 못했습니다.');
if (!password) throw new Error('SUPABASE_DB_PASSWORD가 .env.local에 없습니다.');

const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query('begin');

  const board = await client.query('select id from work_boards where id = $1', ['feed']);
  if (board.rowCount === 0) throw new Error('work_boards에 feed 게시판이 없습니다.');

  const author = await client.query(`
    select id
    from work_profiles
    where status = 'approved'
    order by case when role = 'admin' then 0 else 1 end, joined_at
    limit 1
  `);
  if (author.rowCount === 0) throw new Error('승인된 작성자 프로필이 없습니다. 먼저 사용자 가입 승인 후 다시 실행하세요.');

  const authorId = author.rows[0].id;
  const today = new Date();
  const summary = [];

  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const dateKey = toDateKey(date);
    const marker = `[TEST_FEED_SEED_${dateKey}]`;

    const existing = await client.query(
      'select count(*)::int as count from work_posts where board_id = $1 and content like $2',
      ['feed', `%${marker}%`]
    );

    if (existing.rows[0].count > 0) {
      summary.push({ date: dateKey, inserted: 0, skipped: existing.rows[0].count });
      continue;
    }

    const count = randomInt(10, 30);
    for (let index = 0; index < count; index += 1) {
      const hour = randomInt(8, 19);
      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);
      const createdAt = `${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+09:00`;

      await client.query(
        `insert into work_posts (board_id, author_id, content, is_pinned, created_at)
         values ($1, $2, $3, $4, $5)`,
        ['feed', authorId, buildContent(dateKey, index), index === 0 && dayOffset % 5 === 0, createdAt]
      );
    }

    summary.push({ date: dateKey, inserted: count, skipped: 0 });
  }

  await client.query('commit');
  console.table(summary);
  const totalInserted = summary.reduce((sum, row) => sum + row.inserted, 0);
  const totalSkipped = summary.reduce((sum, row) => sum + row.skipped, 0);
  console.log(`Inserted ${totalInserted} posts. Skipped ${totalSkipped} existing seeded posts.`);
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}
