-- ============================================
-- Migration: App Settings Table
-- Date: 2026-03-15
-- Description: Stores editable app settings like cancellation policy,
--              payment instructions, WhatsApp number, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all settings
CREATE POLICY "Admins can manage settings" ON app_settings
  FOR ALL USING (true);

-- Insert default values
INSERT INTO app_settings (key, value) VALUES
  ('cancellation_policy', 'Toute annulation doit être effectuée au moins 24h avant le créneau réservé. Passé ce délai, aucun remboursement ne sera possible. En cas de retard de paiement supérieur à 30 minutes, la réservation sera automatiquement annulée.'),
  ('payment_instructions_wave', 'Envoyez le montant sur Wave au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.'),
  ('payment_instructions_orange_money', 'Envoyez le montant sur Orange Money au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.'),
  ('payment_whatsapp_number', '+221789251834'),
  ('payment_timer_minutes', '30'),
  ('acompte_percent', '50')
ON CONFLICT (key) DO NOTHING;
