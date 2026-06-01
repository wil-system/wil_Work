-- Allow authors to submit multiple reports for the same department and period.
-- Edits are now keyed by report id, not by author + board + period.

drop index if exists work_reports_author_board_period_key;
