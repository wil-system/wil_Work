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
  { profileId: 'u1', boardId: 'sales', role: 'leader' },
  { profileId: 'u1', boardId: 'dev', role: 'leader' },
  { profileId: 'u1', boardId: 'marketing', role: 'leader' },
  { profileId: 'u1', boardId: 'notice', role: 'leader' },
  { profileId: 'u2', boardId: 'sales', role: 'leader' },
  { profileId: 'u3', boardId: 'dev', role: 'leader' },
  { profileId: 'u4', boardId: 'marketing', role: 'leader' },
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
    id: 'wr0', authorId: 'u2', boardId: 'sales', date: '2026-05-12',
    periodStart: '2026-05-06',
    periodEnd: '2026-05-12',
    periodLabel: '2026-05 2주차',
    periodType: 'week',
    goals: ['B2B 신규 리드 20건 확보', '기존 고객 재계약 조건 정리'],
    progress: ['B2B 신규 리드 12건 확보', '기존 고객 재계약 조건 정리'],
    nextPlan: ['B2B 신규 리드 20건 확보', '견적서 표준 양식 정리'],
    plannedTasks: ['B2B 신규 리드 20건 확보', '견적서 표준 양식 정리'],
    completedTasks: ['B2B 신규 리드 12건 확보', '기존 고객 재계약 조건 정리'],
    issues: '견적서 승인 절차가 길어 일부 고객 회신이 지연되고 있습니다.',
    status: 'reviewed',
    reviewStatus: 'reviewed',
    reviewerId: 'u1',
    reviewComment: '견적서 승인 병목은 다음 보고에서 별도 항목으로 추적해주세요.',
    reviewedAt: '2026-05-13T02:30:00.000Z',
  },
  {
    id: 'wr1', authorId: 'u2', boardId: 'sales', date: '2026-05-19',
    periodStart: '2026-05-13',
    periodEnd: '2026-05-19',
    periodLabel: '2026-05 3주차',
    periodType: 'week',
    goals: ['B2B 신규 리드 20건 확보', '견적서 표준 양식 정리'],
    progress: ['B2B 신규 리드 20건 확보', '견적서 표준 양식 정리'],
    nextPlan: ['대형 고객 제안 미팅 3건', '재계약 리스크 고객 목록 정리'],
    plannedTasks: ['대형 고객 제안 미팅 3건', '재계약 리스크 고객 목록 정리'],
    completedTasks: ['B2B 신규 리드 20건 확보', '견적서 표준 양식 정리'],
    issues: 'A사 의사결정자가 변경되어 제안 일정 재조율이 필요합니다.',
    status: 'submitted',
    reviewStatus: 'submitted',
    previousReportId: 'wr0',
  },
  {
    id: 'wr2', authorId: 'u3', boardId: 'dev', date: '2026-05-20',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-20',
    periodLabel: '2026-05 상반기 개발 정리',
    periodType: 'custom',
    goals: ['업무게시판 기간 보고 구조 설계', '첨부파일 미리보기 안정화', '모바일 댓글 UX 개선'],
    progress: ['업무게시판 기간 보고 구조 설계', '모바일 댓글 UX 개선'],
    nextPlan: ['첨부파일 미리보기 안정화', '보고서 변화 요약 QA'],
    plannedTasks: ['첨부파일 미리보기 안정화', '보고서 변화 요약 QA'],
    completedTasks: ['업무게시판 기간 보고 구조 설계', '모바일 댓글 UX 개선'],
    issues: 'PDF 미리보기는 브라우저별 렌더링 차이가 있어 추가 테스트가 필요합니다.',
    status: 'submitted',
    reviewStatus: 'changes_requested',
    reviewerId: 'u1',
    reviewComment: '미리보기 이슈의 재현 조건을 더 구체화해주세요.',
    reviewedAt: '2026-05-21T04:10:00.000Z',
  },
  {
    id: 'wr3', authorId: 'u4', boardId: 'marketing', date: '2026-05-26',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    periodLabel: '2026-05 월간 마케팅',
    periodType: 'month',
    goals: ['신규 캠페인 랜딩 기획', 'SNS 콘텐츠 12건 발행', '리드 전환율 개선안 작성'],
    progress: ['신규 캠페인 랜딩 기획', 'SNS 콘텐츠 9건 발행'],
    nextPlan: ['SNS 콘텐츠 12건 발행', '리드 전환율 개선안 작성', '6월 캠페인 소재 확정'],
    plannedTasks: ['SNS 콘텐츠 12건 발행', '리드 전환율 개선안 작성', '6월 캠페인 소재 확정'],
    completedTasks: ['신규 캠페인 랜딩 기획', 'SNS 콘텐츠 9건 발행'],
    issues: '디자인 리소스가 부족해 일부 소재 제작 일정이 밀리고 있습니다.',
    status: 'submitted',
    reviewStatus: 'submitted',
  },
  {
    id: 'wr4', authorId: 'u1', boardId: 'dev', date: '2026-06-01',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-01',
    periodLabel: '2026-06-01 대표 확인용 일일 보고',
    periodType: 'day',
    goals: ['업무게시판 변화 요약 검수', '팀별 검토대기 현황 확인'],
    progress: ['업무게시판 변화 요약 검수'],
    nextPlan: ['팀별 검토대기 현황 확인', '운영 전 권한 정책 점검'],
    plannedTasks: ['팀별 검토대기 현황 확인', '운영 전 권한 정책 점검'],
    completedTasks: ['업무게시판 변화 요약 검수'],
    issues: undefined,
    status: 'submitted',
    reviewStatus: 'submitted',
  },
  {
    id: 'wr5', authorId: 'u2', boardId: 'sales', date: '2026-06-01',
    periodStart: '2026-05-20',
    periodEnd: '2026-06-01',
    periodLabel: '2026-05 말 영업 집중기간',
    periodType: 'week',
    goals: ['대형 고객 제안 미팅 3건', '재계약 리스크 고객 목록 정리'],
    progress: ['대형 고객 제안 미팅 3건', '재계약 리스크 고객 목록 정리'],
    nextPlan: ['계약 전환 가능성 높은 고객 5곳 후속 연락', '6월 프로모션 조건 협의'],
    plannedTasks: ['계약 전환 가능성 높은 고객 5곳 후속 연락', '6월 프로모션 조건 협의'],
    completedTasks: ['대형 고객 제안 미팅 3건', '재계약 리스크 고객 목록 정리'],
    issues: 'B사 예산 확정이 1주 지연되어 계약 예상일도 밀릴 수 있습니다.',
    status: 'submitted',
    reviewStatus: 'submitted',
    previousReportId: 'wr1',
  },
  {
    id: 'wr6', authorId: 'u3', boardId: 'dev', date: '2026-06-01',
    periodStart: '2026-05-21',
    periodEnd: '2026-06-01',
    periodLabel: '2026-05 말 개발 안정화',
    periodType: 'week',
    goals: ['첨부파일 미리보기 안정화', '보고서 변화 요약 QA'],
    progress: ['보고서 변화 요약 QA', '모바일 레이아웃 회귀 확인'],
    nextPlan: ['첨부파일 미리보기 안정화', '관리자 권한 회귀 테스트'],
    plannedTasks: ['첨부파일 미리보기 안정화', '관리자 권한 회귀 테스트'],
    completedTasks: ['보고서 변화 요약 QA', '모바일 레이아웃 회귀 확인'],
    issues: '첨부파일 미리보기는 Storage 권한 테스트 데이터가 더 필요합니다.',
    status: 'reviewed',
    reviewStatus: 'reviewed',
    previousReportId: 'wr2',
    reviewerId: 'u1',
    reviewComment: '변화 요약 QA는 확인 완료. Storage 테스트 데이터만 보강하세요.',
    reviewedAt: '2026-06-01T06:20:00.000Z',
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'e1', title: '주간 팀 미팅', date: '2026-04-28', allDay: false, type: 'meeting', attendees: ['u1','u2','u3','u4'], description: '주간 업무 현황 공유 및 이슈 논의' },
  { id: 'e2', title: '영업팀 고객 미팅', date: '2026-04-29', allDay: false, type: 'meeting', attendees: ['u2'], description: '신규 고객사 제안 발표' },
  { id: 'e3', title: '개발팀 스프린트 시작', date: '2026-05-02', allDay: true, type: 'deadline', attendees: ['u3'], description: '5월 스프린트 킥오프' },
  { id: 'e4', title: '근로자의 날', date: '2026-05-01', allDay: true, type: 'holiday', attendees: [], description: '공휴일' },
  { id: 'e5', title: '마케팅 캠페인 마감', date: '2026-04-30', allDay: false, type: 'deadline', attendees: ['u4'], description: '5월 캠페인 소재 최종 제출' },
  { id: 'e6', title: '사내 워크샵', date: '2026-05-16', allDay: false, type: 'meeting', attendees: ['u1','u2','u3','u4'], description: '전 직원 필수 참석' },
  { id: 't1', title: '제안서 최종 검토', date: '2026-05-02', allDay: true, type: 'todo', attendees: [], description: '영업팀 공유 전 문구 확인', completed: false },
  { id: 't2', title: '워크샵 참석자 명단 확인', date: '2026-05-16', allDay: true, type: 'todo', attendees: [], description: '불참자와 대체 일정 확인', completed: false },
  { id: 't3', title: '캠페인 결과 공유', date: '2026-05-18', allDay: true, type: 'todo', attendees: [], description: '성과 요약을 피드에 게시', completed: true },
];

export const mockMemos: Memo[] = [
  { id: 'm1', authorId: 'u1', title: '2026 Q2 목표 초안', content: '- 신규 고객 50사 확보\n- 내부 시스템 고도화 완료\n- 팀 역량 강화 교육 2회 이상', tags: ['전략', 'Q2'], isPinned: true, updatedAt: '2026-04-28T08:00:00' },
  { id: 'm2', authorId: 'u1', title: '워크샵 아이디어 메모', content: '1. 팀빌딩 게임\n2. 내부 발표 세션\n3. 자유 토론 시간\n4. 저녁 식사', tags: ['워크샵'], isPinned: false, updatedAt: '2026-04-27T15:00:00' },
  { id: 'm3', authorId: 'u1', title: '온보딩 체크리스트', content: '- 계정 생성\n- 장비 지급\n- 팀 소개\n- 업무 시스템 안내', tags: ['HR', '온보딩'], isPinned: false, updatedAt: '2026-04-26T10:00:00' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'comment', title: '새 댓글', body: '이서연님이 "이번 주 영업팀 KPI 달성 현황"에 댓글을 남겼습니다.', isRead: false, createdAt: '2026-04-28T09:15:00', link: '/feed' },
  { id: 'n2', type: 'approval', title: '가입 승인 대기', body: '정다은님이 회원가입을 신청했습니다. 승인이 필요합니다.', isRead: false, createdAt: '2026-04-28T08:30:00', link: '/admin/approvals' },
  { id: 'n3', type: 'approval', title: '가입 승인 대기', body: '한승우님이 회원가입을 신청했습니다. 승인이 필요합니다.', isRead: false, createdAt: '2026-04-27T17:00:00', link: '/admin/approvals' },
  { id: 'n4', type: 'comment', title: '새 댓글', body: '박준혁님이 "이번 주 영업팀 KPI 달성 현황"에 댓글을 남겼습니다.', isRead: true, createdAt: '2026-04-28T09:30:00' },
  { id: 'n5', type: 'board', title: '게시판 추가', body: '"마케팅" 게시판이 생성되었습니다.', isRead: true, createdAt: '2026-04-27T14:00:00' },
];

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

const heavyVolumeValues = new Set(['heavy', 'large', 'true']);

export function isHighVolumeDemoDataMode(value = process.env.NEXT_PUBLIC_DEMO_DATA_VOLUME ?? process.env.NEXT_PUBLIC_TEST_DATA_VOLUME): boolean {
  return heavyVolumeValues.has((value ?? '').toLowerCase());
}

export interface HighVolumeMockData {
  profiles: Profile[];
  boardPermissions: BoardPermission[];
  posts: Post[];
  workReports: WorkReport[];
  calendarEvents: CalendarEvent[];
  memos: Memo[];
  notifications: Notification[];
}

const heavyBoardIds = ['feed', 'sales', 'dev', 'marketing', 'notice'] as const;
const heavyTeamBoards = ['sales', 'dev', 'marketing', 'notice'] as const;
const heavyProfilePalette = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be185d', '#0369a1'];
const heavyDepartments = ['Sales', 'Development', 'Marketing', 'Design', 'Operations', 'Support'];
const heavyTodoColors: NonNullable<CalendarEvent['todoColor']>[] = ['lemon', 'mint', 'sky', 'peach', 'lavender'];

function juneDate(day: number): string {
  return `2026-06-${String(day).padStart(2, '0')}`;
}

function juneDateTime(day: number, hour: number, minute = 0): string {
  return `${juneDate(day)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function rotate<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

export function buildHighVolumeMockData(): HighVolumeMockData {
  const profiles: Profile[] = Array.from({ length: 42 }, (_, index) => {
    const number = index + 1;
    const isPending = number % 7 === 0 || number > 36;
    return {
      id: `hv-user-${number}`,
      name: `Demo User ${number}`,
      email: `demo.user.${number}@wil.test`,
      role: number % 18 === 0 ? 'admin' : 'member',
      status: isPending ? 'pending' : 'approved',
      department: rotate(heavyDepartments, index),
      position: number % 5 === 0 ? 'Lead' : 'Member',
      avatarInitial: `D${number}`,
      avatarColor: rotate(heavyProfilePalette, index),
      joinedAt: juneDate(Math.min(28, number)),
    };
  });

  const approvedProfileIds = profiles
    .filter(profile => profile.status === 'approved')
    .map(profile => profile.id);
  const authorIds = ['u1', 'u2', 'u3', 'u4', ...approvedProfileIds.slice(0, 16)];

  const boardPermissions: BoardPermission[] = approvedProfileIds.flatMap((profileId, index) =>
    heavyTeamBoards
      .filter((_, boardIndex) => (index + boardIndex) % 2 === 0)
      .map((boardId, boardIndex) => ({
        profileId,
        boardId,
        role: (index + boardIndex) % 9 === 0 ? 'leader' : 'member',
      })),
  );

  const posts: Post[] = Array.from({ length: 96 }, (_, index) => {
    const boardId = rotate(heavyBoardIds, index);
    const day = 10 - (index % 10);
    const hour = 8 + (index % 10);
    const commentCount = index % 5;
    return {
      id: `hv-post-${index + 1}`,
      boardId,
      authorId: rotate(authorIds, index),
      title: `High volume post ${index + 1}`,
      content: [
        `Load test post ${index + 1} for ${boardId}.`,
        'This content is intentionally long enough to exercise wrapping, preview height, and dense feed scrolling.',
        index % 3 === 0 ? 'Includes a task status so board task lanes have enough rows.' : 'General update item for feed density.',
      ].join(' '),
      attachments: index % 4 === 0
        ? [{ id: `hv-attachment-${index + 1}`, name: `demo-attachment-${index + 1}.pdf`, size: `${120 + index} KB`, type: 'pdf' }]
        : [],
      comments: Array.from({ length: commentCount }, (_, commentIndex) => ({
        id: `hv-comment-${index + 1}-${commentIndex + 1}`,
        authorId: rotate(authorIds, index + commentIndex + 1),
        content: `Dense comment ${commentIndex + 1} on post ${index + 1}.`,
        createdAt: juneDateTime(day, Math.min(22, hour + 1), commentIndex * 10),
      })),
      isPinned: index % 17 === 0,
      workStatus: boardId !== 'feed' && index % 3 === 0
        ? rotate(['in_progress', 'completed', 'on_hold'] as const, index)
        : undefined,
      assigneeId: boardId !== 'feed' && index % 3 === 0 ? rotate(authorIds, index + 2) : undefined,
      createdAt: juneDateTime(day, hour, (index * 7) % 60),
    };
  });

  const workReports: WorkReport[] = Array.from({ length: 72 }, (_, index) => {
    const day = 1 + (index % 10);
    const authorId = rotate(authorIds, index);
    const boardId = rotate(heavyTeamBoards, index);
    const reviewStatus = rotate(['draft', 'submitted', 'reviewed', 'changes_requested'] as const, index);
    return {
      id: `hv-report-${index + 1}`,
      authorId,
      boardId,
      date: juneDate(day),
      periodStart: juneDate(Math.max(1, day - 2)),
      periodEnd: juneDate(day),
      periodLabel: `2026-06 dense period ${index + 1}`,
      periodType: rotate(['day', 'week', 'month', 'custom'] as const, index),
      goals: [`Goal ${index + 1}-1`, `Goal ${index + 1}-2`, `Goal ${index + 1}-3`],
      progress: [`Progress ${index + 1}-1`, `Progress ${index + 1}-2`],
      nextPlan: [`Next plan ${index + 1}-1`, `Next plan ${index + 1}-2`],
      plannedTasks: [`Planned task ${index + 1}-1`, `Planned task ${index + 1}-2`],
      completedTasks: [`Completed task ${index + 1}-1`, `Completed task ${index + 1}-2`],
      issues: index % 4 === 0 ? `Issue note for dense report ${index + 1}.` : undefined,
      status: reviewStatus === 'reviewed' ? 'reviewed' : reviewStatus === 'draft' ? 'draft' : 'submitted',
      reviewStatus,
      reviewerId: reviewStatus === 'reviewed' || reviewStatus === 'changes_requested' ? 'u1' : undefined,
      reviewComment: reviewStatus === 'changes_requested' ? `Please revise dense report ${index + 1}.` : undefined,
      reviewedAt: reviewStatus === 'reviewed' || reviewStatus === 'changes_requested' ? juneDateTime(day, 18) : undefined,
      createdAt: juneDateTime(day, 9, index % 60),
      updatedAt: juneDateTime(day, 17, index % 60),
    };
  });

  const currentUserReports: WorkReport[] = Array.from({ length: 54 }, (_, index) => {
    const day = 1 + (index % 30);
    const boardId = rotate(heavyTeamBoards, index);
    const reviewStatus = rotate(['submitted', 'reviewed', 'changes_requested', 'draft'] as const, index);
    return {
      id: `hv-my-report-${index + 1}`,
      authorId: CURRENT_USER_ID,
      boardId,
      date: juneDate(day),
      periodStart: juneDate(Math.max(1, day - (index % 5))),
      periodEnd: juneDate(day),
      periodLabel: `My dense report history ${index + 1}`,
      periodType: rotate(['day', 'week', 'month', 'custom'] as const, index),
      goals: [
        `My history goal ${index + 1}-1`,
        `My history goal ${index + 1}-2`,
        `My history goal ${index + 1}-3`,
      ],
      progress: [
        `My history progress ${index + 1}-1`,
        `My history progress ${index + 1}-2`,
      ],
      nextPlan: [
        `My history next plan ${index + 1}-1`,
        `My history next plan ${index + 1}-2`,
      ],
      plannedTasks: [
        `My history planned ${index + 1}-1`,
        `My history planned ${index + 1}-2`,
      ],
      completedTasks: [
        `My history completed ${index + 1}-1`,
        `My history completed ${index + 1}-2`,
      ],
      issues: index % 4 === 0 ? `My history issue ${index + 1}.` : undefined,
      status: reviewStatus === 'reviewed' ? 'reviewed' : reviewStatus === 'draft' ? 'draft' : 'submitted',
      reviewStatus,
      reviewerId: reviewStatus === 'reviewed' || reviewStatus === 'changes_requested' ? 'u2' : undefined,
      reviewComment: reviewStatus === 'changes_requested' ? `Revise my history report ${index + 1}.` : undefined,
      reviewedAt: reviewStatus === 'reviewed' || reviewStatus === 'changes_requested' ? juneDateTime(day, 18, index % 60) : undefined,
      createdAt: juneDateTime(day, 10 + (index % 8), index % 60),
      updatedAt: juneDateTime(day, 19, index % 60),
    };
  });

  const calendarEvents: CalendarEvent[] = [
    ...Array.from({ length: 14 }, (_, index) => ({
      id: `hv-today-event-${index + 1}`,
      title: `Today schedule ${index + 1}`,
      date: '2026-06-10',
      allDay: index % 5 === 0,
      type: rotate(['meeting', 'deadline', 'personal'] as const, index),
      attendees: authorIds.slice(0, 1 + (index % 4)),
      description: `Dense schedule item ${index + 1} for today.`,
    })),
    ...Array.from({ length: 18 }, (_, index) => ({
      id: `hv-today-todo-${index + 1}`,
      title: `Today todo ${index + 1}`,
      date: '2026-06-10',
      allDay: true,
      type: 'todo' as const,
      attendees: [],
      description: `Dense todo item ${index + 1} for today.`,
      completed: index % 4 === 0,
      todoColor: rotate(heavyTodoColors, index),
    })),
    ...Array.from({ length: 80 }, (_, index) => {
      const day = 1 + (index % 30);
      const isTodo = index % 2 === 0;
      return {
        id: `hv-month-${isTodo ? 'todo' : 'event'}-${index + 1}`,
        title: isTodo ? `Month todo ${index + 1}` : `Month schedule ${index + 1}`,
        date: juneDate(day),
        allDay: isTodo || index % 6 === 0,
        type: isTodo ? 'todo' as const : rotate(['meeting', 'deadline', 'holiday', 'personal'] as const, index),
        attendees: isTodo ? [] : authorIds.slice(0, 1 + (index % 3)),
        description: isTodo ? `Monthly dense todo ${index + 1}.` : `Monthly dense schedule ${index + 1}.`,
        completed: isTodo ? index % 5 === 0 : undefined,
        todoColor: isTodo ? rotate(heavyTodoColors, index) : undefined,
      };
    }),
  ];

  const memos: Memo[] = Array.from({ length: 48 }, (_, index) => ({
    id: `hv-memo-${index + 1}`,
    authorId: CURRENT_USER_ID,
    title: `Dense memo ${index + 1}`,
    content: [
      `Memo body ${index + 1}.`,
      'The text is long enough to check list wrapping, card height, and scroll behavior in memo pages.',
      `Checklist: item A, item B, item C, follow up ${index + 1}.`,
    ].join('\n'),
    tags: [`tag-${(index % 6) + 1}`, rotate(['sales', 'dev', 'marketing', 'ops'] as const, index)],
    isPinned: index % 11 === 0,
    updatedAt: juneDateTime(10 - (index % 10), 10 + (index % 8), index % 60),
  }));

  const notifications: Notification[] = Array.from({ length: 64 }, (_, index) => {
    const type = rotate(['comment', 'mention', 'approval', 'board', 'report'] as const, index);
    return {
      id: `hv-notification-${index + 1}`,
      type,
      title: `Dense ${type} notification ${index + 1}`,
      body: `Notification body ${index + 1} with enough text to verify dense notification list spacing and wrapping.`,
      isRead: index % 3 === 0,
      createdAt: juneDateTime(10 - (index % 10), 9 + (index % 9), index % 60),
      link: type === 'approval'
        ? '/admin/approvals'
        : type === 'report'
          ? '/work-report/review'
          : '/feed',
    };
  });

  return {
    profiles,
    boardPermissions,
    posts,
    workReports: [...currentUserReports, ...workReports],
    calendarEvents,
    memos,
    notifications,
  };
}

if (isHighVolumeDemoDataMode()) {
  const highVolume = buildHighVolumeMockData();
  mockProfiles.push(...highVolume.profiles);
  mockBoardPermissions.push(...highVolume.boardPermissions);
  mockPosts.push(...highVolume.posts);
  mockWorkReports.push(...highVolume.workReports);
  mockCalendarEvents.push(...highVolume.calendarEvents);
  mockMemos.push(...highVolume.memos);
  mockNotifications.push(...highVolume.notifications);
}
