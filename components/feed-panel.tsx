"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import {
  AtSign,
  Download,
  FileUp,
  Hash,
  Inbox,
  Menu,
  MessageSquareReply,
  Pin,
  Send,
  Users,
} from "lucide-react";
import {
  attachments,
  boards,
  comments,
  feedItems,
  quickStats,
} from "@/lib/mock-data";
import type { FeedItem } from "@/lib/types";
import { StatusPill } from "./status-pill";

export type FeedPopup = {
  postId: string;
  type: "comments" | "attachments";
  placement?: "up" | "down";
};

type FeedPanelProps = {
  activeBoardId: string;
  activePopup: FeedPopup | null;
  isParticipantsOpen: boolean;
  query: string;
  onClosePopup: () => void;
  onOpenMobileMenu: () => void;
  onTogglePopup: (popup: FeedPopup) => void;
  onToggleParticipants: () => void;
};

export function FeedPanel({
  activeBoardId,
  activePopup,
  isParticipantsOpen,
  query,
  onClosePopup,
  onOpenMobileMenu,
  onTogglePopup,
  onToggleParticipants,
}: FeedPanelProps) {
  const feedScrollRef = useRef<HTMLElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [composerValue, setComposerValue] = useState("");

  const activeBoard =
    boards.find((board) => board.id === activeBoardId) ?? boards[0];
  const filteredFeedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...feedItems]
      .filter((item) => activeBoardId === "all" || item.boardId === activeBoardId)
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          item.author,
          item.role,
          item.title,
          item.body,
          item.status,
          ...item.tags,
          ...item.mentions,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .reverse();
  }, [activeBoardId, query]);
  const activePopupPost = activePopup
    ? filteredFeedItems.find((item) => item.id === activePopup.postId)
    : undefined;

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) {
      return;
    }

    composer.style.height = "auto";
    composer.style.height = `${Math.min(composer.scrollHeight, 160)}px`;
  }, [composerValue]);

  useEffect(() => {
    if (!activePopup) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (
        target.closest("[data-feed-popup-root]") ||
        target.closest("[data-feed-popup-trigger]")
      ) {
        return;
      }

      onClosePopup();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activePopup, onClosePopup]);

  return (
    <main className="relative flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f8f7]">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-5 md:py-4">
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-green-700">
              W.I.L Workspace
            </p>
            <h1 className="truncate text-lg font-bold text-slate-950">
              업무 협업툴
            </h1>
          </div>
          <button
            className="micro-focus micro-lift inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={onOpenMobileMenu}
          >
            <Menu size={16} />
            메뉴
          </button>
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">현재 보드</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950 md:text-2xl">
              {activeBoard.name}
            </h2>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="grid grid-cols-4 gap-1.5 md:gap-2">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="micro-card micro-enter min-w-0 bg-white px-2 py-2 md:min-w-20 md:px-3"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 md:gap-1.5 md:text-xs">
                      <Icon size={12} />
                      <span className="truncate">{stat.label}</span>
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-950 md:text-lg">
                      {stat.value}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className={`micro-focus micro-lift inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold ${
                isParticipantsOpen
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              }`}
              onClick={onToggleParticipants}
            >
              <Users size={16} />
              참여자
            </button>
          </div>
        </div>
      </header>

      <section
        ref={feedScrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-44 pt-4 md:px-6"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          {filteredFeedItems.length > 0 ? (
            filteredFeedItems.map((item, index) => {
              const activeType =
                activePopup?.postId === item.id ? activePopup.type : null;
              const popupPlacement =
                activePopup?.postId === item.id
                  ? (activePopup.placement ?? "down")
                  : "down";

              return (
                <article
                  key={item.id}
                  className={`micro-enter relative rounded-xl px-1 py-2 transition duration-200 ${
                    activeType ? "bg-green-50/70" : ""
                  }`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <PostContent item={item} />

                  <div className="relative mt-2 flex max-w-[min(42rem,100%)] items-center justify-between gap-2 pl-1 text-xs text-slate-500">
                    <PopupTrigger
                      active={activeType === "comments"}
                      icon={<MessageSquareReply size={14} />}
                      label={`댓글 ${item.comments}개`}
                      onClick={() =>
                        onTogglePopup({
                          postId: item.id,
                          type: "comments",
                          placement: "down",
                        })
                      }
                    />
                    <PopupTrigger
                      active={activeType === "attachments"}
                      icon={<FileUp size={14} />}
                      label={`첨부 ${item.attachments}개`}
                      onClick={(event) =>
                        onTogglePopup({
                          postId: item.id,
                          type: "attachments",
                          placement:
                            event.currentTarget.getBoundingClientRect().top >
                            window.innerHeight * 0.55
                              ? "up"
                              : "down",
                        })
                      }
                    />
                    {activeType === "attachments" ? (
                      <div
                        className={`absolute left-0 z-[300] hidden w-[min(48rem,calc(100vw-24rem))] md:block ${
                          popupPlacement === "up"
                            ? "bottom-full mb-2"
                            : "top-full mt-2"
                        }`}
                      >
                        <FeedPopupPanel post={item} type={activeType} isPopup />
                      </div>
                    ) : null}
                  </div>

                  {activeType ? (
                    <div className="md:hidden">
                      <FeedPopupPanel post={item} type={activeType} />
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
      {activePopup?.type === "comments" && activePopupPost ? (
        <div className="fixed left-1/2 top-1/2 z-[300] hidden w-[min(62rem,calc(100vw-22rem))] max-h-[calc(100dvh-8rem)] -translate-x-1/2 -translate-y-1/2 md:block">
          <FeedPopupPanel post={activePopupPost} type="comments" isPopup />
        </div>
      ) : null}
      {activePopup ? (
        <button
          className="pointer-events-none fixed inset-0 z-[200] hidden cursor-default md:block"
          aria-label="팝업 닫기"
          onClick={onClosePopup}
        />
      ) : null}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-[100] px-4 pb-3 md:px-6 md:pb-5">
        <div className="mx-auto max-w-5xl">
          <div className="pointer-events-auto max-w-[min(42rem,100%)] rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <textarea
              ref={composerRef}
              rows={1}
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              className="max-h-40 min-h-11 w-full resize-none overflow-y-auto bg-transparent px-1 py-1 text-[13px] leading-5 outline-none placeholder:text-slate-400"
              placeholder="내용 입력... @담당자 #태그"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <button
                className="micro-focus grid size-9 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:translate-y-px"
                aria-label="파일 첨부"
              >
                <FileUp size={17} />
              </button>
              <button
                className="micro-focus grid size-9 place-items-center rounded-xl bg-green-500 text-white transition hover:bg-green-600 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="게시글 등록"
                disabled={!composerValue.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PopupTrigger({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      data-feed-popup-trigger
      className={`micro-focus inline-flex h-8 items-center gap-1 rounded-xl px-2 font-semibold transition duration-200 active:translate-y-px ${
        active
          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-green-700"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="micro-card micro-enter grid min-h-[20rem] place-items-center border-dashed p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-green-50 text-green-700">
          <Inbox size={22} />
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-900">
          조건에 맞는 게시글이 없습니다.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          다른 게시판을 선택하거나 검색어를 줄여보세요.
        </p>
      </div>
    </div>
  );
}

function PostContent({ item }: { item: FeedItem }) {
  return (
    <div className="flex max-w-[min(42rem,100%)] flex-col items-start">
      <div className="mb-1 flex w-full flex-wrap items-center gap-1.5 px-1 md:gap-2">
        <h3 className="text-sm font-bold text-slate-950">{item.author}</h3>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs font-medium text-slate-500">{item.role}</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-500">{item.updatedAt}</span>
        {item.pinned ? (
          <Pin
            size={15}
            className="fill-amber-500 text-amber-500"
            aria-label="상단 고정"
          />
        ) : null}
      </div>

      <div className="micro-card relative bg-white px-3 py-3 text-sm leading-6 text-slate-800 md:px-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusPill status={item.status} />
          {item.priority === "important" ? (
            <span className="inline-flex h-6 items-center rounded-lg bg-red-50 px-2 text-xs font-semibold text-red-700 ring-1 ring-red-100">
              중요
            </span>
          ) : null}
        </div>
        <p className="font-semibold text-slate-950">{item.title}</p>
        <p className="mt-2 max-w-[72ch] whitespace-pre-line">{item.body}</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 px-1">
        {item.mentions.map((mention) => (
          <span
            key={mention}
            className="inline-flex h-7 items-center gap-1 rounded-xl bg-green-50 px-2 text-xs font-semibold text-green-700"
          >
            <AtSign size={13} />
            {mention.replace("@", "")}
          </span>
        ))}
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-7 items-center gap-1 rounded-xl bg-slate-100 px-2 text-xs font-semibold text-slate-600"
          >
            <Hash size={13} />
            {tag.replace("#", "")}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeedPopupPanel({
  post,
  type,
  isPopup = false,
}: {
  post: FeedItem;
  type: FeedPopup["type"];
  isPopup?: boolean;
}) {
  const postAttachments = attachments.filter(
    (attachment) => attachment.postId === post.id,
  );

  return (
    <div
      data-feed-popup-root
      className={`micro-card micro-enter border-green-100 p-3 ${
        isPopup
          ? "flex max-h-[min(38rem,calc(100vh-8rem))] min-h-0 flex-col overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
          : "mt-3 max-w-[min(56rem,100%)]"
      }`}
    >
      {type === "comments" ? (
        <CommentPopupContent post={post} />
      ) : (
        <AttachmentPopupContent postAttachments={postAttachments} />
      )}
    </div>
  );
}

function CommentPopupContent({ post }: { post: FeedItem }) {
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);

  return (
    <section className="grid min-h-0 gap-3 md:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="min-h-0 rounded-xl border border-slate-200 bg-slate-50 p-3 md:max-h-[34rem] md:overflow-y-auto">
        <p className="text-xs font-bold text-slate-500">원문</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-bold text-slate-900">{post.author}</span>
          <span>·</span>
          <span>{post.role}</span>
          <span>·</span>
          <span>{post.updatedAt}</span>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
          {post.body}
        </p>
      </aside>

      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">댓글 스레드</h4>
          <span className="text-xs text-slate-500">최근 댓글 우선</span>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 md:max-h-[28rem]">
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              className="micro-enter rounded-xl border border-slate-200 bg-white p-3"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {comment.author}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {comment.createdAt}
                </span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-700">
                {comment.body}
              </p>
              <button
                className="micro-focus mt-2 inline-flex h-7 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-green-700 transition hover:bg-green-50 active:translate-y-px"
                onClick={() =>
                  setReplyTargetId((current) =>
                    current === comment.id ? null : comment.id,
                  )
                }
              >
                <MessageSquareReply size={13} />
                답글
              </button>
              {comment.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className="mt-3 border-l-2 border-green-200 pl-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {reply.author}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {reply.createdAt}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    {reply.body}
                  </p>
                </div>
              ))}
              {replyTargetId === comment.id ? (
                <div className="micro-enter mt-3 flex items-end gap-2 border-l-2 border-green-200 pl-3">
                  <textarea
                    rows={2}
                    className="min-h-10 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
                    placeholder="답글 입력..."
                  />
                  <button
                    className="micro-focus grid size-9 shrink-0 place-items-center rounded-xl bg-green-500 text-white transition hover:bg-green-600 active:translate-y-px"
                    aria-label="답글 등록"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-3 flex shrink-0 items-end gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
          <textarea
            rows={2}
            className="min-h-12 flex-1 resize-none py-1 text-sm leading-5 outline-none placeholder:text-slate-400"
            placeholder="댓글 입력... @담당자 호출"
          />
          <button
            className="micro-focus grid size-9 shrink-0 place-items-center rounded-xl bg-green-500 text-white transition hover:bg-green-600 active:translate-y-px"
            aria-label="댓글 등록"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function AttachmentPopupContent({
  postAttachments,
}: {
  postAttachments: ReturnType<typeof attachments.filter>;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">첨부 파일</h4>
        <span className="text-xs text-slate-500">
          {postAttachments.length}개
        </span>
      </div>
      {postAttachments.length > 0 ? (
        <div className="space-y-2">
          {postAttachments.map((attachment, index) => (
            <button
              key={attachment.id}
              className="micro-focus micro-enter flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-green-200 hover:bg-green-50/50 active:translate-y-px"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
          첨부 파일이 없습니다.
        </div>
      )}
    </section>
  );
}
