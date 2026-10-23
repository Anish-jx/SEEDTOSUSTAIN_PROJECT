-- Migration to add web_url column to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS web_url VARCHAR(2048);
