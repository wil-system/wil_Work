export type UserRole = 'admin' | 'member';
export type BoardRole = 'leader' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type WorkStatus = 'in_progress' | 'completed' | 'on_hold';

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
  icon: string;
  isPublic: boolean;
  displayOrder?: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'doc' | 'xls' | 'zip' | 'other';
  storagePath?: string;
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
  workStatus?: WorkStatus;
  assigneeId?: string;
  createdAt: string;
}

export interface FeedDateCount {
  date: string;
  count: number;
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
  role?: BoardRole;
}
