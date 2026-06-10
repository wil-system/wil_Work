import { randomUUID } from 'node:crypto';

const BOARD_ID_PREFIX = 'board';
const BOARD_ID_SUFFIX_LENGTH = 12;

export function generateBoardId(seed: string = randomUUID()): string {
  const suffix = seed
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, BOARD_ID_SUFFIX_LENGTH);

  if (suffix) return `${BOARD_ID_PREFIX}-${suffix}`;

  return generateBoardId(randomUUID());
}
