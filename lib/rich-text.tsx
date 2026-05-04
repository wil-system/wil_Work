import type { ReactNode } from 'react';

export function renderRichText(content: string): ReactNode[] {
  return content.split(/(\*\*[^*]+\*\*|@[^\s#@,.;:!?()[\]{}<>]+|#[^\s#@,.;:!?()[\]{}<>]+)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('@')) {
      return (
        <span
          key={index}
          className="inline-flex items-center rounded-md px-1 font-semibold text-[var(--indigo-700)] bg-[var(--indigo-50)]"
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('#')) {
      return (
        <span
          key={index}
          className="inline-flex items-center rounded-md px-1 font-semibold text-[var(--teal-700)] bg-[var(--teal-50)]"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}
