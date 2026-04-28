import type { LucideIcon } from "lucide-react";

export type BoardKind = "company" | "team" | "worklog" | "memo";

export type Board = {
  id: string;
  name: string;
  kind: BoardKind;
  unread: number;
  pinned?: boolean;
  description: string;
  icon: LucideIcon;
};

export type FeedStatus = "진행중" | "완료" | "보류" | "공유";

export type FeedItem = {
  id: string;
  boardId: string;
  author: string;
  role: string;
  title: string;
  body: string;
  status: FeedStatus;
  priority: "normal" | "important";
  tags: string[];
  mentions: string[];
  attachments: number;
  comments: number;
  updatedAt: string;
  pinned?: boolean;
};

export type Attachment = {
  id: string;
  postId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type ThreadComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  replies?: ThreadComment[];
};

export type Notification = {
  id: string;
  title: string;
  source: string;
  read: boolean;
  important?: boolean;
};

export type Participant = {
  id: string;
  name: string;
  department: string;
  role: string;
};
