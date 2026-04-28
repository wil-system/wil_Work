import { X } from "lucide-react";
import { participants } from "@/lib/mock-data";
import type { Participant } from "@/lib/types";

type ParticipantPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ParticipantPanel({ isOpen, onClose }: ParticipantPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <aside className="hidden h-dvh w-80 flex-col border-l border-slate-200 bg-white xl:flex">
        <PanelContent onClose={onClose} />
      </aside>

      <div className="fixed inset-0 z-[200] bg-slate-950/35 backdrop-blur-sm xl:hidden">
        <aside className="micro-enter absolute bottom-0 right-0 top-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-[0_10px_28px_rgba(15,23,42,0.22)]">
          <PanelContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}

function PanelContent({ onClose }: { onClose: () => void }) {
  const grouped = participants.reduce<Record<string, Participant[]>>(
    (groups, participant) => {
      groups[participant.department] ??= [];
      groups[participant.department].push(participant);
      return groups;
    },
    {},
  );

  return (
    <>
      <header className="shrink-0 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-green-700">참여자</p>
            <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
              부서별 참여자
            </h2>
          </div>
          <button
            className="micro-focus micro-lift grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            aria-label="참여자 패널 닫기"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {Object.entries(grouped).map(([department, members], groupIndex) => (
            <section
              key={department}
              className="micro-enter"
              style={{ animationDelay: `${groupIndex * 80}ms` }}
            >
              <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                <h3 className="text-xs font-bold text-slate-700">
                  {department}
                </h3>
                <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {members.length}
                </span>
              </div>
              <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                {members.map((member) => (
                  <button
                    key={member.id}
                    className="micro-focus flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition duration-200 hover:bg-green-50/60 active:translate-y-px"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                      {member.name.slice(1, 3)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {member.role}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
