-- Add notes column to transactions (for "Other" category memo)
-- Run in Supabase SQL Editor. If "column already exists", ignore.
ALTER TABLE transactions ADD COLUMN notes VARCHAR(500);

-- Add awaiting_note to pending_clarifications (when user selects "Other", we ask for a note)
ALTER TABLE pending_clarifications ADD COLUMN awaiting_note BOOLEAN DEFAULT FALSE;
