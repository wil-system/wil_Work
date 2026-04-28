import { Bell, ChevronDown, Search } from "lucide-react";
import { boards } from "@/lib/mock-data";

type BoardSidebarProps = {
  activeBoardId: string;
  query: string;
  onBoardChange: (boardId: string) => void;
  onQueryChange: (query: string) => void;
};

export function BoardSidebar({
  activeBoardId,
  query,
  onBoardChange,
  onQueryChange,
}: BoardSidebarProps) {
  return (
    <aside className="flex h-dvh w-full flex-col border-r border-slate-200 bg-white lg:w-72">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-green-700">
              W.I.L Workspace
            </p>
            <h1 className="mt-1 truncate text-xl font-bold text-slate-950">
              업무 협업툴
            </h1>
          </div>
          <button
            className="micro-focus micro-lift grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            aria-label="알림"
          >
            <Bell size={18} />
          </button>
        </div>
        <label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition focus-within:border-green-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/20">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            placeholder="게시글, 담당자, 태그 검색"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
          <span>게시판</span>
          <ChevronDown size={14} />
        </div>
        <div className="space-y-1">
          {boards.map((board, index) => {
            const Icon = board.icon;
            const isActive = activeBoardId === board.id;

            return (
              <button
                key={board.id}
                className={`micro-focus group relative flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition duration-200 active:translate-y-px ${
                  isActive
                    ? "bg-slate-900 text-white shadow-[0_2px_12px_rgba(15,23,42,0.16)]"
                    : "text-slate-700 hover:bg-slate-100 hover:shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => onBoardChange(board.id)}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-green-400" />
                ) : null}
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${
                    isActive
                      ? "bg-white/12 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-green-700"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      isActive
                        ? "font-semibold text-white"
                        : "font-medium text-slate-800"
                    }`}
                  >
                    {board.name}
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      isActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {board.description}
                  </span>
                </span>
                {board.unread > 0 ? (
                  <span
                    className={`grid min-w-6 place-items-center rounded-lg px-1.5 text-xs font-bold ${
                      isActive
                        ? "bg-green-400 text-slate-950"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {board.unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button className="micro-focus flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition duration-200 hover:bg-slate-100 active:translate-y-px">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            BH
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              김보현
            </span>
            <span className="block text-xs text-slate-500">총괄 관리자</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
