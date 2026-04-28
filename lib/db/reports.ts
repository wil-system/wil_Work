import { createClient } from '@/lib/supabase/server';
import type { WorkReport } from '@/lib/types';

function toReport(row: Record<string, unknown>): WorkReport {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    date: row.date as string,
    plannedTasks: row.planned_tasks as string[],
    completedTasks: row.completed_tasks as string[],
    issues: row.issues as string | undefined,
    status: row.status as WorkReport['status'],
  };
}

export async function getTodayReports(): Promise<WorkReport[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('work_reports')
    .select('*')
    .eq('date', today)
    .order('created_at');
  return (data ?? []).map(toReport);
}

export async function upsertReport(report: Omit<WorkReport, 'id'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_reports').upsert({
    author_id: report.authorId,
    date: report.date,
    planned_tasks: report.plannedTasks,
    completed_tasks: report.completedTasks,
    issues: report.issues,
    status: report.status,
  }, { onConflict: 'author_id,date' });
}
