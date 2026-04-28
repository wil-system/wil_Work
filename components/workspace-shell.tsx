"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BoardSidebar } from "@/components/board-sidebar";
import type { FeedPopup } from "@/components/feed-panel";
import { FeedPanel } from "@/components/feed-panel";
import { ParticipantPanel } from "@/components/participant-panel";

export function WorkspaceShell() {
  const [activeBoardId, setActiveBoardId] = useState("all");
  const [activeFeedPopup, setActiveFeedPopup] = useState<FeedPopup | null>(
    null,
  );
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sidebar = (
    <BoardSidebar
      activeBoardId={activeBoardId}
      query={query}
      onBoardChange={(boardId) => {
        setActiveBoardId(boardId);
        setActiveFeedPopup(null);
        setIsMobileMenuOpen(false);
      }}
      onQueryChange={setQuery}
    />
  );

  return (
    <div
      className={`grid h-[100dvh] grid-cols-1 overflow-hidden bg-slate-100 lg:grid-cols-[18rem_minmax(0,1fr)] ${
        isParticipantsOpen
          ? "xl:grid-cols-[18rem_minmax(0,1fr)_20rem]"
          : ""
      }`}
    >
      <div className="hidden lg:block">{sidebar}</div>
      <FeedPanel
        activeBoardId={activeBoardId}
        activePopup={activeFeedPopup}
        isParticipantsOpen={isParticipantsOpen}
        query={query}
        onClosePopup={() => setActiveFeedPopup(null)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onTogglePopup={(popup) =>
          setActiveFeedPopup((current) =>
            current?.postId === popup.postId && current.type === popup.type
              ? null
              : popup,
          )
        }
        onToggleParticipants={() =>
          setIsParticipantsOpen((current) => !current)
        }
      />
      <ParticipantPanel
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
      />
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[200] bg-slate-950/35 backdrop-blur-sm lg:hidden">
          <aside className="micro-enter absolute bottom-0 left-0 top-0 w-72 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.22)]">
            {sidebar}
            <button
              className="micro-focus micro-lift absolute right-3 top-3 grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              aria-label="메뉴 닫기"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
