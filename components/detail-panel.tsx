import {
  Bell,
  Check,
  Download,
  MessageSquareReply,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { attachments, comments, notifications } from "@/lib/mock-data";
import type { FeedItem } from "@/lib/types";
import { StatusPill } from "./status-pill";

type DetailPanelProps = {
  post?: FeedItem;
  isOpen: boolean;
  onClose: () => void;
};

export function DetailPanel({ post, isOpen, onClose }: DetailPanelProps) {
  const postAttachments = attachments.filter(
    (attachment) => attachment.postId === post?.id,
  );

  return (
    <>
      <aside className="hidden h-dvh w-88 flex-col border-l border-slate-200 bg-white xl:flex">
        <PanelContent post={post} postAttachments={postAttachments} />
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm xl:hidden">
          <aside className="absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col rounded-t-lg bg-white shadow-2xl">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <h2 className="text-sm font-bold text-slate-950">상세 정보</h2>
              <button
                className="grid size-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="닫기"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
            <PanelContent post={post} postAttachments={postAttachments} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function PanelContent({
  post,
  postAttachments,
}: {
  post?: FeedItem;
  postAttachments: typeof attachments;
}) {
  if (!post) {
    return (
      <div className="grid flex-1 place-items-center p-4 text-sm text-slate-500">
        게시글을 선택하세요.
      </div>
    );
  }

  return (
    <>
      <section className="shrink-0 border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">선택한 게시글</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">
              {post.author}
              <span className="mx-1.5 text-xs font-normal text-slate-400">
                ·
              </span>
              <span className="text-sm font-medium text-slate-500">
                {post.role}
              </span>
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-700">
              {post.body}
            </p>
          </div>
          <StatusPill status={post.status} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Metric label="댓글" value={String(post.comments)} />
          <Metric label="첨부" value={String(post.attachments)} />
          <Metric label="멘션" value={String(post.mentions.length)} />
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">댓글 스레드</h3>
          <span className="text-xs text-slate-500">최근 댓글 우선</span>
        </div>

        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {comment.author}
                </span>
                <span className="text-xs text-slate-500">
                  {comment.createdAt}
                </span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-700">
                {comment.body}
              </p>
              <button className="mt-2 inline-flex h-7 items-center gap-1 rounded-md px-1 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                <MessageSquareReply size={13} />
                답글
              </button>
            </div>
          ))}
        </div>

        <PanelAttachments postAttachments={postAttachments} />
        <PanelNotifications />
      </section>

      <section className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-end gap-2 rounded-md border border-slate-200 px-2 py-2">
          <button
            className="grid size-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="댓글 파일 첨부"
          >
            <Paperclip size={17} />
          </button>
          <textarea
            rows={2}
            className="min-h-12 flex-1 resize-none py-1 text-sm leading-5 outline-none placeholder:text-slate-400"
            placeholder="댓글 입력... @담당자 호출"
          />
          <button
            className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-950 text-white hover:bg-slate-800"
            aria-label="댓글 등록"
          >
            <Send size={16} />
          </button>
        </div>
      </section>
    </>
  );
}

function PanelAttachments({
  postAttachments,
}: {
  postAttachments: typeof attachments;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">첨부 파일</h3>
        <span className="text-xs text-slate-500">
          {postAttachments.length}개
        </span>
      </div>
      {postAttachments.length > 0 ? (
        <div className="space-y-2">
          {postAttachments.map((attachment) => (
            <button
              key={attachment.id}
              className="flex w-full items-center gap-3 rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">
                {attachment.fileType}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {attachment.fileName}
                </span>
                <span className="block text-xs text-slate-500">
                  {attachment.fileSize} · {attachment.uploadedBy}
                </span>
              </span>
              <Download size={16} className="text-slate-500" />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
          첨부 파일이 없습니다.
        </div>
      )}
    </div>
  );
}

function PanelNotifications() {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-bold text-slate-900">알림 필터</h3>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex gap-3 rounded-md border border-slate-200 p-3"
          >
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
              {notification.read ? <Check size={15} /> : <Bell size={15} />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {notification.title}
                </p>
                {notification.important ? (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                    중요
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {notification.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
