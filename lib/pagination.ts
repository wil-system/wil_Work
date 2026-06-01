export function parsePageParam(value: string | undefined) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function getTotalPages(total: number, pageSize: number) {
  const safeTotal = Math.max(0, total);
  const safePageSize = Math.max(1, pageSize);
  return Math.max(1, Math.ceil(safeTotal / safePageSize));
}

export function getVisiblePageNumbers(page: number, totalPages: number, radius = 2) {
  const normalizedTotal = Math.max(1, Math.floor(totalPages));
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotal);

  return Array.from({ length: normalizedTotal }, (_, index) => index + 1)
    .filter(item =>
      item === 1 ||
      item === normalizedTotal ||
      Math.abs(item - normalizedPage) <= radius
    );
}
