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
