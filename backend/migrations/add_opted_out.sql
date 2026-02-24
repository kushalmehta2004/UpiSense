-- WhatsApp STOP/START: user has opted out of non-essential messages (reports, budget alerts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS opted_out BOOLEAN DEFAULT FALSE;
