export interface ReportComparisonFields {
  goals?: string[] | string | null;
  progress?: string[] | string | null;
  nextPlan?: string[] | string | null;
}

export interface ReportChangeSummary {
  added: string[];
  completed: string[];
  carried: string[];
  dropped: string[];
}

export function normalizeReportItems(value: string[] | string | null | undefined): string[] {
  const items = Array.isArray(value) ? value : String(value ?? '').split(/\r?\n/);
  const seen = new Set<string>();

  return items.reduce<string[]>((result, item) => {
    const normalized = item.trim().replace(/\s+/g, ' ');
    if (!normalized || seen.has(normalized)) return result;
    seen.add(normalized);
    result.push(normalized);
    return result;
  }, []);
}

function includesItem(items: string[], item: string) {
  return items.includes(item);
}

function uniqueItems(...groups: string[][]) {
  return normalizeReportItems(groups.flat());
}

export function calculateReportChangeSummary({
  previous,
  current,
}: {
  previous: ReportComparisonFields | null;
  current: ReportComparisonFields;
}): ReportChangeSummary {
  const currentGoals = normalizeReportItems(current.goals);
  const currentProgress = normalizeReportItems(current.progress);
  const currentNextPlan = normalizeReportItems(current.nextPlan);
  const currentAll = uniqueItems(currentGoals, currentProgress, currentNextPlan);

  if (!previous) {
    return {
      added: currentAll,
      completed: [],
      carried: [],
      dropped: [],
    };
  }

  const previousGoals = normalizeReportItems(previous.goals);
  const previousProgress = normalizeReportItems(previous.progress);
  const previousNextPlan = normalizeReportItems(previous.nextPlan);
  const previousPlanned = uniqueItems(previousGoals, previousNextPlan);
  const previousAll = uniqueItems(previousGoals, previousProgress, previousNextPlan);
  const currentPlanned = uniqueItems(currentGoals, currentNextPlan);

  return {
    added: currentAll.filter(item => !includesItem(previousAll, item)),
    completed: previousPlanned.filter(item => includesItem(currentProgress, item)),
    carried: previousPlanned.filter(item =>
      !includesItem(currentProgress, item) && includesItem(currentPlanned, item)
    ),
    dropped: previousPlanned.filter(item => !includesItem(currentAll, item)),
  };
}
