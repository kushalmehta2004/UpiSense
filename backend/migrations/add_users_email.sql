-- Add email column for email OTP signup/login
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
