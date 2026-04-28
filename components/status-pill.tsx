import { clsx } from "clsx";
import type { FeedStatus } from "@/lib/types";

const toneByStatus: Record<FeedStatus, string> = {
  진행중: "bg-green-50 text-green-700 ring-green-200",
  완료: "bg-slate-100 text-slate-700 ring-slate-200",
  보류: "bg-amber-50 text-amber-700 ring-amber-200",
  공유: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function StatusPill({ status }: { status: FeedStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold ring-1",
        toneByStatus[status],
      )}
    >
      {status}
    </span>
  );
}
