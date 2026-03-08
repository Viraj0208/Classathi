-- Add wamid column to store WhatsApp message ID from Meta Cloud API
ALTER TABLE whatsapp_logs
  ADD COLUMN IF NOT EXISTS wamid TEXT;

-- Add template_name column to track which template was used
ALTER TABLE whatsapp_logs
  ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Index on wamid for fast webhook lookups (delivery status updates)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_wamid
  ON whatsapp_logs(wamid)
  WHERE wamid IS NOT NULL;
