export type ComposerTokenTrigger = '@' | '#';

export interface ComposerToken {
  trigger: ComposerTokenTrigger;
  query: string;
  start: number;
  end: number;
}

const TOKEN_PATTERN = /(^|\s)([@#])([^\s@#,.;:!?()[\]{}<>]*)$/;
const HASHTAG_PATTERN = /(^|\s)#([^\s@#,.;:!?()[\]{}<>]+)/g;

export function getActiveComposerToken(value: string, cursor: number): ComposerToken | null {
  const safeCursor = Math.max(0, Math.min(cursor, value.length));
  const beforeCursor = value.slice(0, safeCursor);
  const match = beforeCursor.match(TOKEN_PATTERN);
  if (!match) return null;

  const trigger = match[2] as ComposerTokenTrigger;
  const query = match[3] ?? '';

  return {
    trigger,
    query,
    start: safeCursor - query.length - 1,
    end: safeCursor,
  };
}

export function insertComposerToken(value: string, token: ComposerToken, label: string) {
  const cleanLabel = label.trim().replace(/^[@#]+/, '');
  const replacement = `${token.trigger}${cleanLabel} `;
  const next = `${value.slice(0, token.start)}${replacement}${value.slice(token.end)}`;

  return {
    value: next,
    cursor: token.start + replacement.length,
  };
}

export function extractHashtags(contents: string[]) {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const content of contents) {
    for (const match of content.matchAll(HASHTAG_PATTERN)) {
      const tag = match[2]?.trim();
      if (!tag) continue;

      const key = tag.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      tags.push(tag);
    }
  }

  return tags;
}
