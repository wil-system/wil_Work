import Link from 'next/link';
import { getVisiblePageNumbers } from '@/lib/pagination';

type PageParams = Record<string, string | number | undefined>;

function buildHref(basePath: string, currentParams: PageParams, overrides: PageParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentParams)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function PaginationNav({
  basePath,
  page,
  totalPages,
  currentParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  currentParams: PageParams;
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePageNumbers(page, totalPages);

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      {page > 1 ? (
        <Link href={buildHref(basePath, currentParams, { page: page - 1 })} className="rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-700)]" style={{ borderColor: 'var(--line)' }}>
          이전
        </Link>
      ) : (
        <span className="rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-300)]" style={{ borderColor: 'var(--line)' }}>이전</span>
      )}

      {visiblePages.map((item, index) => {
        const previous = visiblePages[index - 1];
        return (
          <span key={item} className="flex items-center gap-1.5">
            {previous && item - previous > 1 && <span className="text-[12px] text-[var(--muted)]">...</span>}
            <Link
              href={buildHref(basePath, currentParams, { page: item })}
              aria-current={item === page ? 'page' : undefined}
              className="rounded-lg border px-3 py-2 text-[12px] font-semibold"
              style={{
                borderColor: 'var(--line)',
                background: item === page ? 'var(--indigo-600)' : 'white',
                color: item === page ? 'white' : 'var(--stone-700)',
              }}
            >
              {item}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link href={buildHref(basePath, currentParams, { page: page + 1 })} className="rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-700)]" style={{ borderColor: 'var(--line)' }}>
          다음
        </Link>
      ) : (
        <span className="rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-300)]" style={{ borderColor: 'var(--line)' }}>다음</span>
      )}
    </nav>
  );
}

export { buildHref as buildPaginationHref };
